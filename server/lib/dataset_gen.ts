import { NormalizedEvent, NodeTypes, EdgeLabels } from "@shared/schema";

class PseudoRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1) + min);
  }
  
  pick<T>(array: T[]): T {
    return array[this.range(0, array.length - 1)];
  }
}

const BASE_TIME = "2026-02-09T00:00:00.000Z";
const BASE_MS = new Date(BASE_TIME).getTime();
const HOUR = 3600000;
const MINUTE = 60000;

function ts(offsetMs: number): string {
  return new Date(BASE_MS - offsetMs).toISOString();
}

function makeEvent(
  eventId: string,
  timestamp: string,
  subjectId: string,
  subjectType: string,
  platform: string,
  action: string,
  targetId: string,
  targetType: string,
  risk: number = 0,
  lifecycle: string = "ACTIVE"
): NormalizedEvent {
  return {
    event_id: eventId,
    timestamp,
    subject: {
      id: subjectId,
      type: subjectType as any,
      platform: platform as any,
      lifecycle_state: lifecycle as any,
      risk_score: risk
    },
    relationships: [{
      label: action as any,
      target: { id: targetId, type: targetType }
    }]
  };
}

function generateCicdCompromise(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const humans = ["alice", "bob", "charlie"];
  let idx = 0;

  for (let i = 0; i < 20; i++) {
    const offset = rng.range(2 * HOUR, 24 * HOUR);
    events.push(makeEvent(
      `evt_noise_${idx++}`, ts(offset),
      rng.pick(humans), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  events.push(makeEvent("evt_cicd_01", ts(18 * HOUR), "alice", "HUMAN", "enterprise", "AUTHENTICATES_WITH", "jenkins-master", "RESOURCE", 10));
  events.push(makeEvent("evt_cicd_02", ts(16 * HOUR), "jenkins-master", "WORKLOAD", "ci_cd", "ASSUMES", "prod-deployer-role", "IDENTITY", 70));
  events.push(makeEvent("evt_cicd_03", ts(14 * HOUR), "prod-deployer-role", "SERVICE_ACCOUNT", "aws", "CONTROLS", "k8s-cluster-admin", "RESOURCE", 80));
  events.push(makeEvent("evt_cicd_04", ts(10 * HOUR), "k8s-cluster-admin", "WORKLOAD", "k8s", "ACCESSES", "ot-gateway-bridge", "WORKLOAD", 90));
  events.push(makeEvent("evt_cicd_05", ts(8 * HOUR), "ot-gateway-bridge", "WORKLOAD", "ot", "CONTROLS", "plc-press-01", "PLC", 100));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateOtFullAttackChain(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const humans = ["alice", "bob", "charlie", "dave", "eve"];
  let idx = 0;

  for (let i = 0; i < 60; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_bg_${idx++}`, ts(offset),
      rng.pick(humans), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  for (let i = 0; i < 30; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_bg_${idx++}`, ts(offset),
      rng.pick(humans), "HUMAN", "enterprise",
      "ACCESSES", rng.pick(["web-server-01", "db-proxy", "payment-service"]), "WORKLOAD"
    ));
  }

  for (let i = 0; i < 20; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_ot_noise_${idx++}`, ts(offset),
      "scada-monitor", "WORKLOAD", "ot",
      "COMMUNICATES_WITH", rng.pick(["plc-temp-01", "plc-valve-02", "hmi-console"]), rng.pick(["PLC", "HMI"])
    ));
  }

  const chain = [
    { id: "evt_chain_01", t: 36 * HOUR, src: "alice", srcT: "HUMAN", srcP: "enterprise", act: "AUTHENTICATES_WITH", tgt: "gitlab-ci", tgtT: "WORKLOAD", risk: 5 },
    { id: "evt_chain_02", t: 34 * HOUR, src: "gitlab-ci", srcT: "WORKLOAD", srcP: "ci_cd", act: "ASSUMES", tgt: "ci-deploy-token", tgtT: "IDENTITY", risk: 40 },
    { id: "evt_chain_03", t: 32 * HOUR, src: "ci-deploy-token", srcT: "SERVICE_ACCOUNT", srcP: "aws", act: "ASSUMES", tgt: "cloud-admin-role", tgtT: "IDENTITY", risk: 70 },
    { id: "evt_chain_04", t: 30 * HOUR, src: "cloud-admin-role", srcT: "SERVICE_ACCOUNT", srcP: "aws", act: "ACCESSES", tgt: "secrets-manager", tgtT: "RESOURCE", risk: 75 },
    { id: "evt_chain_05", t: 28 * HOUR, src: "secrets-manager", srcT: "WORKLOAD", srcP: "aws", act: "CONTROLS", tgt: "k8s-workload-api", tgtT: "WORKLOAD", risk: 80 },
    { id: "evt_chain_06", t: 26 * HOUR, src: "k8s-workload-api", srcT: "WORKLOAD", srcP: "k8s", act: "COMMUNICATES_WITH", tgt: "ot-gateway-01", tgtT: "WORKLOAD", risk: 90 },
    { id: "evt_chain_07", t: 24 * HOUR, src: "ot-gateway-01", srcT: "WORKLOAD", srcP: "ot", act: "COMMUNICATES_WITH", tgt: "scada-controller", tgtT: "WORKLOAD", risk: 95 },
    { id: "evt_chain_08", t: 22 * HOUR, src: "scada-controller", srcT: "WORKLOAD", srcP: "ot", act: "CONTROLS", tgt: "plc-press-01", tgtT: "PLC", risk: 100 },
  ];

  for (const step of chain) {
    events.push(makeEvent(step.id, ts(step.t), step.src, step.srcT, step.srcP, step.act, step.tgt, step.tgtT, step.risk));
  }

  events.push(makeEvent("evt_chain_09", ts(20 * HOUR), "ci-deploy-token", "SERVICE_ACCOUNT", "aws", "AUTHENTICATES_WITH", "ci-deploy-token", "IDENTITY", 0, "DECOMMISSIONED"));

  events.push(makeEvent("evt_chain_10", ts(6 * HOUR), "ci-deploy-token", "SERVICE_ACCOUNT", "aws", "ASSUMES", "cloud-admin-role", "IDENTITY", 90));
  events.push(makeEvent("evt_chain_11", ts(4 * HOUR), "cloud-admin-role", "SERVICE_ACCOUNT", "aws", "ACCESSES", "secrets-manager", "RESOURCE", 90));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateCloudOtBridge(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  let idx = 0;

  for (let i = 0; i < 15; i++) {
    const offset = rng.range(1 * HOUR, 24 * HOUR);
    events.push(makeEvent(
      `evt_bridge_bg_${idx++}`, ts(offset),
      rng.pick(["operator-a", "operator-b"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  events.push(makeEvent("evt_bridge_01", ts(20 * HOUR), "terraform-sa", "SERVICE_ACCOUNT", "aws", "CONTROLS", "vpc-peering", "RESOURCE", 60));
  events.push(makeEvent("evt_bridge_02", ts(18 * HOUR), "vpc-peering", "WORKLOAD", "aws", "COMMUNICATES_WITH", "ot-dmz-proxy", "WORKLOAD", 70));
  events.push(makeEvent("evt_bridge_03", ts(16 * HOUR), "ot-dmz-proxy", "WORKLOAD", "ot", "COMMUNICATES_WITH", "historian-server", "WORKLOAD", 80));
  events.push(makeEvent("evt_bridge_04", ts(14 * HOUR), "historian-server", "WORKLOAD", "ot", "ACCESSES", "hmi-panel-01", "HMI", 85));
  events.push(makeEvent("evt_bridge_05", ts(12 * HOUR), "hmi-panel-01", "HMI", "ot", "CONTROLS", "plc-valve-03", "PLC", 95));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateRoleSprawl(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const roles = ["admin-role", "read-only-role", "deploy-role", "audit-role", "backup-role", "network-role", "db-admin-role", "log-role"];
  let idx = 0;

  for (const role of roles) {
    const offset = rng.range(12 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_sprawl_${idx++}`, ts(offset),
      "overprovisioned-sa", "SERVICE_ACCOUNT", "aws",
      "ASSUMES", role, "IDENTITY", 50
    ));
  }

  for (const role of roles) {
    const offset = rng.range(1 * HOUR, 12 * HOUR);
    events.push(makeEvent(
      `evt_sprawl_${idx++}`, ts(offset),
      role, "SERVICE_ACCOUNT", "aws",
      "ACCESSES", rng.pick(["prod-db", "staging-db", "log-store", "secret-vault", "k8s-cluster"]), "RESOURCE", 60
    ));
  }

  for (let i = 0; i < 10; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_sprawl_bg_${idx++}`, ts(offset),
      rng.pick(["alice", "bob"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateDormantWakeup(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  let idx = 0;

  events.push(makeEvent("evt_dormant_01", ts(72 * HOUR), "legacy-backup-sa", "SERVICE_ACCOUNT", "aws", "ASSUMES", "s3-full-access", "IDENTITY", 30));
  events.push(makeEvent("evt_dormant_02", ts(70 * HOUR), "s3-full-access", "SERVICE_ACCOUNT", "aws", "ACCESSES", "prod-db-backup", "RESOURCE", 40));

  for (let i = 0; i < 20; i++) {
    const offset = rng.range(2 * HOUR, 60 * HOUR);
    events.push(makeEvent(
      `evt_dormant_bg_${idx++}`, ts(offset),
      rng.pick(["alice", "bob", "charlie"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  events.push(makeEvent("evt_dormant_03", ts(4 * HOUR), "legacy-backup-sa", "SERVICE_ACCOUNT", "aws", "ASSUMES", "s3-full-access", "IDENTITY", 80));
  events.push(makeEvent("evt_dormant_04", ts(3 * HOUR), "s3-full-access", "SERVICE_ACCOUNT", "aws", "ACCESSES", "prod-db-backup", "RESOURCE", 85));
  events.push(makeEvent("evt_dormant_05", ts(2 * HOUR), "s3-full-access", "SERVICE_ACCOUNT", "aws", "CONTROLS", "exfil-endpoint", "RESOURCE", 100));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateBaseline(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const humans = ["alice", "bob", "charlie"];
  const workloads = ["web-server-01", "db-proxy", "payment-service"];
  let idx = 0;

  for (let i = 0; i < 50; i++) {
    const offset = rng.range(0, 24 * HOUR);
    events.push(makeEvent(
      `evt_base_${idx++}`, ts(offset),
      rng.pick(humans), "HUMAN", "enterprise",
      "ACCESSES", rng.pick(workloads), "WORKLOAD"
    ));
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export const AVAILABLE_SCENARIOS = [
  { name: "cicd_compromise", label: "CI/CD Compromise", description: "Human -> Jenkins -> Cloud Role -> K8s -> OT Gateway -> PLC" },
  { name: "ot_full_attack_chain", label: "OT Full Attack Chain", description: "Developer -> GitLab CI -> Token -> Cloud Role -> Secrets -> K8s -> OT Gateway -> SCADA -> PLC" },
  { name: "cloud_ot_bridge", label: "Cloud-OT Bridge", description: "Terraform SA -> VPC Peering -> OT DMZ -> Historian -> HMI -> PLC" },
  { name: "role_sprawl", label: "Role Sprawl", description: "Single SA assuming 8+ roles accessing multiple resources" },
  { name: "dormant_wakeup", label: "Dormant Wakeup", description: "Legacy SA dormant for days, suddenly reactivated for exfiltration" },
  { name: "baseline", label: "Baseline (Noise)", description: "Normal user activity with no attack chain" },
];

export function generateScenario(name: string, seed: number = 42): NormalizedEvent[] {
  const rng = new PseudoRandom(seed);
  
  switch (name) {
    case "cicd_compromise": return generateCicdCompromise(rng);
    case "ot_full_attack_chain": return generateOtFullAttackChain(rng);
    case "cloud_ot_bridge": return generateCloudOtBridge(rng);
    case "role_sprawl": return generateRoleSprawl(rng);
    case "dormant_wakeup": return generateDormantWakeup(rng);
    case "baseline": return generateBaseline(rng);
    default: return generateBaseline(rng);
  }
}
