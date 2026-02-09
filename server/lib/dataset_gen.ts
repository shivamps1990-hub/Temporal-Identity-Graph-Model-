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

function generateShadowOtBridge(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  let idx = 0;

  for (let i = 0; i < 30; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_shadow_bg_${idx++}`, ts(offset),
      rng.pick(["alice", "bob", "charlie"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  events.push(makeEvent("evt_shadow_01", ts(40 * HOUR), "cloud-workload-x", "WORKLOAD", "aws", "ACCESSES", "ot-gateway-legacy", "WORKLOAD", 50));
  events.push(makeEvent("evt_shadow_02", ts(38 * HOUR), "ot-gateway-legacy", "WORKLOAD", "ot", "COMMUNICATES_WITH", "plc-pump-01", "PLC", 80));
  events.push(makeEvent("evt_shadow_03", ts(36 * HOUR), "ot-gateway-legacy", "WORKLOAD", "ot", "ACCESSES", "hmi-ops-console", "HMI", 75));

  for (let i = 0; i < 15; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_shadow_bg_${idx++}`, ts(offset),
      rng.pick(["service-a", "service-b"]), "WORKLOAD", "aws",
      "ACCESSES", rng.pick(["db-main", "cache-01", "queue-svc"]), "RESOURCE"
    ));
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateCicdTokenSprawl(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  let idx = 0;

  for (let i = 0; i < 25; i++) {
    const offset = rng.range(1 * HOUR, 48 * HOUR);
    events.push(makeEvent(
      `evt_tsprawl_bg_${idx++}`, ts(offset),
      rng.pick(["dev-alice", "dev-bob", "dev-charlie"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "github-sso", "RESOURCE"
    ));
  }

  const tokens = ["ci-token-build", "ci-token-test", "ci-token-deploy", "ci-token-scan", "ci-token-release"];
  for (const token of tokens) {
    const offset = rng.range(20 * HOUR, 44 * HOUR);
    events.push(makeEvent(
      `evt_tsprawl_${idx++}`, ts(offset),
      "github-actions-runner", "WORKLOAD", "ci_cd",
      "ASSUMES", token, "IDENTITY", 30
    ));
  }

  events.push(makeEvent(`evt_tsprawl_reuse_01`, ts(12 * HOUR), "ci-token-deploy", "SERVICE_ACCOUNT", "ci_cd", "ASSUMES", "cloud-prod-role", "IDENTITY", 70));
  events.push(makeEvent(`evt_tsprawl_reuse_02`, ts(10 * HOUR), "cloud-prod-role", "SERVICE_ACCOUNT", "aws", "ACCESSES", "secrets-manager", "RESOURCE", 75));
  events.push(makeEvent(`evt_tsprawl_reuse_03`, ts(8 * HOUR), "secrets-manager", "WORKLOAD", "aws", "CONTROLS", "k8s-prod-cluster", "RESOURCE", 80));
  events.push(makeEvent(`evt_tsprawl_reuse_04`, ts(6 * HOUR), "k8s-prod-cluster", "WORKLOAD", "k8s", "ACCESSES", "ot-data-lake", "WORKLOAD", 85));
  events.push(makeEvent(`evt_tsprawl_reuse_05`, ts(4 * HOUR), "ot-data-lake", "WORKLOAD", "ot", "CONTROLS", "plc-sensor-array", "PLC", 95));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateVendorRemoteAccess(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  let idx = 0;

  for (let i = 0; i < 20; i++) {
    const offset = rng.range(1 * HOUR, 72 * HOUR);
    events.push(makeEvent(
      `evt_vendor_bg_${idx++}`, ts(offset),
      rng.pick(["plant-operator-a", "plant-operator-b"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "local-ad", "RESOURCE"
    ));
  }

  events.push(makeEvent("evt_vendor_01", ts(60 * HOUR), "vendor-sa-siemens", "SERVICE_ACCOUNT", "enterprise", "AUTHENTICATES_WITH", "vpn-gateway", "RESOURCE", 40));
  events.push(makeEvent("evt_vendor_02", ts(58 * HOUR), "vpn-gateway", "WORKLOAD", "enterprise", "COMMUNICATES_WITH", "ot-jump-host", "WORKLOAD", 55));
  events.push(makeEvent("evt_vendor_03", ts(56 * HOUR), "ot-jump-host", "WORKLOAD", "ot", "ACCESSES", "scada-engineering-ws", "WORKLOAD", 70));
  events.push(makeEvent("evt_vendor_04", ts(54 * HOUR), "scada-engineering-ws", "WORKLOAD", "ot", "CONTROLS", "plc-conveyor-01", "PLC", 90));
  events.push(makeEvent("evt_vendor_05", ts(52 * HOUR), "scada-engineering-ws", "WORKLOAD", "ot", "CONTROLS", "hmi-conveyor-panel", "HMI", 85));

  events.push(makeEvent("evt_vendor_06", ts(6 * HOUR), "vendor-sa-siemens", "SERVICE_ACCOUNT", "enterprise", "AUTHENTICATES_WITH", "vpn-gateway", "RESOURCE", 60));
  events.push(makeEvent("evt_vendor_07", ts(4 * HOUR), "vpn-gateway", "WORKLOAD", "enterprise", "COMMUNICATES_WITH", "ot-jump-host", "WORKLOAD", 70));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateDelayedBlastRadius(rng: PseudoRandom): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  let idx = 0;

  for (let i = 0; i < 30; i++) {
    const offset = rng.range(1 * HOUR, 72 * HOUR);
    events.push(makeEvent(
      `evt_delayed_bg_${idx++}`, ts(offset),
      rng.pick(["alice", "bob", "charlie"]), "HUMAN", "enterprise",
      "AUTHENTICATES_WITH", "okta-sso", "RESOURCE"
    ));
  }

  events.push(makeEvent("evt_delayed_01", ts(48 * HOUR), "compromised-dev", "HUMAN", "enterprise", "AUTHENTICATES_WITH", "gitlab-ci", "WORKLOAD", 20));
  events.push(makeEvent("evt_delayed_02", ts(46 * HOUR), "gitlab-ci", "WORKLOAD", "ci_cd", "ASSUMES", "deploy-token-stg", "IDENTITY", 35));

  events.push(makeEvent("evt_delayed_03", ts(24 * HOUR), "deploy-token-stg", "SERVICE_ACCOUNT", "aws", "ASSUMES", "staging-role", "IDENTITY", 50));
  events.push(makeEvent("evt_delayed_04", ts(22 * HOUR), "staging-role", "SERVICE_ACCOUNT", "aws", "ACCESSES", "staging-secrets", "RESOURCE", 55));

  events.push(makeEvent("evt_delayed_05", ts(8 * HOUR), "staging-secrets", "WORKLOAD", "aws", "CONTROLS", "prod-k8s-sa", "WORKLOAD", 75));
  events.push(makeEvent("evt_delayed_06", ts(6 * HOUR), "prod-k8s-sa", "WORKLOAD", "k8s", "ACCESSES", "ot-historian", "WORKLOAD", 85));
  events.push(makeEvent("evt_delayed_07", ts(4 * HOUR), "ot-historian", "WORKLOAD", "ot", "CONTROLS", "plc-reactor-01", "PLC", 100));

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export const AVAILABLE_SCENARIOS = [
  { name: "cicd_compromise", label: "CI/CD Compromise", description: "Human -> Jenkins -> Cloud Role -> K8s -> OT Gateway -> PLC", intent: "Demonstrate CI/CD pipeline exploitation reaching OT", expected_threats: ["IT_TO_OT_PATH"] },
  { name: "ot_full_attack_chain", label: "OT Full Attack Chain", description: "Developer -> GitLab CI -> Token -> Cloud -> Secrets -> K8s -> OT -> SCADA -> PLC", intent: "Full multi-hop attack chain with dormant token reuse", expected_threats: ["IT_TO_OT_PATH", "DORMANT_REACTIVATION"] },
  { name: "cloud_ot_bridge", label: "Cloud-OT Bridge", description: "Terraform SA -> VPC Peering -> OT DMZ -> Historian -> HMI -> PLC", intent: "Cloud infrastructure bridging into OT through network peering", expected_threats: ["IT_TO_OT_PATH", "ORPHAN_NHI"] },
  { name: "role_sprawl", label: "Role Sprawl", description: "Single SA assuming 8+ roles accessing multiple resources", intent: "Demonstrate excessive transitive delegation", expected_threats: ["EXCESSIVE_DELEGATION"] },
  { name: "dormant_wakeup", label: "Dormant Wakeup", description: "Legacy SA dormant for days, suddenly reactivated for exfiltration", intent: "Show dormant identity reactivation risk", expected_threats: ["DORMANT_REACTIVATION"] },
  { name: "shadow_ot_bridge", label: "Shadow OT Bridge", description: "Cloud workload with forgotten OT gateway access, no human owner", intent: "Surface orphan NHI with OT access", expected_threats: ["ORPHAN_NHI", "IT_TO_OT_PATH"] },
  { name: "cicd_token_sprawl", label: "CI/CD Token Sprawl", description: "Many CI tokens, one reused incorrectly through to OT", intent: "Token reuse creating excessive delegation chain to OT", expected_threats: ["EXCESSIVE_DELEGATION", "IT_TO_OT_PATH"] },
  { name: "vendor_remote_access", label: "Vendor Remote Access", description: "External vendor SA with long-lived OT access via VPN", intent: "Show weak vendor ownership trail into OT", expected_threats: ["ORPHAN_NHI", "IT_TO_OT_PATH"] },
  { name: "delayed_blast_radius", label: "Delayed Blast Radius", description: "Early compromise, reachability emerges hours later", intent: "Demonstrate delayed risk emergence over time", expected_threats: ["IT_TO_OT_PATH"] },
  { name: "baseline", label: "Baseline (Noise)", description: "Normal user activity with no attack chain", intent: "Control scenario with no expected threats", expected_threats: [] },
];

export function generateScenario(name: string, seed: number = 42): NormalizedEvent[] {
  const rng = new PseudoRandom(seed);

  switch (name) {
    case "cicd_compromise": return generateCicdCompromise(rng);
    case "ot_full_attack_chain": return generateOtFullAttackChain(rng);
    case "cloud_ot_bridge": return generateCloudOtBridge(rng);
    case "role_sprawl": return generateRoleSprawl(rng);
    case "dormant_wakeup": return generateDormantWakeup(rng);
    case "shadow_ot_bridge": return generateShadowOtBridge(rng);
    case "cicd_token_sprawl": return generateCicdTokenSprawl(rng);
    case "vendor_remote_access": return generateVendorRemoteAccess(rng);
    case "delayed_blast_radius": return generateDelayedBlastRadius(rng);
    case "baseline": return generateBaseline(rng);
    default: return generateBaseline(rng);
  }
}
