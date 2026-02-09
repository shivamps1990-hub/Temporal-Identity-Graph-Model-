import { NormalizedEvent, NodeTypes, EdgeLabels } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

// Simple deterministic RNG for "seed"
class PseudoRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  
  // Returns 0-1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns int between min and max
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1) + min);
  }
  
  pick<T>(array: T[]): T {
    return array[this.range(0, array.length - 1)];
  }
}

export function generateScenario(name: string, seed: number = 42): NormalizedEvent[] {
  const rng = new PseudoRandom(seed);
  const events: NormalizedEvent[] = [];
  const baseTime = "2026-02-09T00:00:00.000Z"; // Fixed base time for research reproducibility

  // Helper to add event
  const addEvent = (
    subjectId: string, 
    subjectType: string, 
    platform: string,
    action: string, 
    targetId: string, 
    targetType: string,
    risk: number = 0
  ) => {
    // Deterministic timestamp: baseTime - (rng seed based offset)
    const offset = rng.range(0, 86400000);
    const ts = new Date(new Date(baseTime).getTime() - offset).toISOString();
    
    // Deterministic event_id using hash of properties
    const event_id = `evt_${subjectId}_${targetId}_${offset}`;
    
    events.push({
      event_id,
      timestamp: ts,
      subject: {
        id: subjectId,
        type: subjectType as any,
        platform: platform as any,
        lifecycle_state: "ACTIVE",
        risk_score: risk
      },
      relationships: [{
        label: action as any,
        target: {
          id: targetId,
          type: targetType
        }
      }]
    });
  };

  // Common Identities
  const humans = ["alice", "bob", "charlie"];
  const serviceAccounts = ["ci-runner-sa", "backup-sa", "deployer-sa"];
  const workloads = ["web-server-01", "db-proxy", "payment-service"];
  
  // Scenario Logic
  if (name === "cicd_compromise") {
    // Attack Path: Human -> CI/CD -> Cloud Role -> Workload -> OT Gateway -> PLC
    
    // 1. Valid/Noise traffic
    for (let i = 0; i < 20; i++) {
      addEvent(
        rng.pick(humans), "HUMAN", "enterprise", 
        "AUTHENTICATES_WITH", 
        "okta-sso", "RESOURCE"
      );
    }

    // 2. The Attack Chain
    // Step 1: Compromised Dev (Alice) logs into CI/CD
    addEvent("alice", "HUMAN", "enterprise", "AUTHENTICATES_WITH", "jenkins-master", "RESOURCE", 10);
    
    // Step 2: CI/CD assumes high privilege role
    addEvent("jenkins-master", "WORKLOAD", "ci_cd", "ASSUMES", "prod-deployer-role", "IDENTITY", 70);
    
    // Step 3: Role deploys/accesses a workload
    addEvent("prod-deployer-role", "SERVICE_ACCOUNT", "aws", "CONTROLS", "k8s-cluster-admin", "RESOURCE", 80);
    
    // Step 4: K8s Admin accesses OT Gateway (Lateral Move)
    addEvent("k8s-cluster-admin", "WORKLOAD", "k8s", "ACCESSES", "ot-gateway-bridge", "WORKLOAD", 90);
    
    // Step 5: OT Gateway controls PLC
    addEvent("ot-gateway-bridge", "WORKLOAD", "ot", "CONTROLS", "plc-press-01", "PLC", 100);

  } else {
    // Baseline / Noise
    for (let i = 0; i < 50; i++) {
      addEvent(
        rng.pick(humans), "HUMAN", "enterprise",
        "ACCESSES",
        rng.pick(workloads), "WORKLOAD"
      );
    }
  }

  // Sort by time
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
