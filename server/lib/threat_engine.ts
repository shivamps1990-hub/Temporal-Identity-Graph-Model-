import { GraphNode, GraphEdge } from "@shared/schema";

export interface ThreatEvidence {
  event_ids: string[];
  first_seen: string;
  last_seen: string;
}

export interface DerivedThreat {
  threat_id: string;
  type: "IT_TO_OT_PATH" | "ORPHAN_NHI" | "EXCESSIVE_DELEGATION" | "DORMANT_REACTIVATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  nodes_involved: string[];
  paths: string[][];
  evidence: ThreatEvidence;
}

export interface ThreatMapResult {
  timestamp: string | null;
  threats: DerivedThreat[];
  summary: {
    total: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
  };
}

function computeSeverity(pathLength: number, maxRisk: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  const score = maxRisk * (1 + 1 / pathLength);
  if (score >= 150) return "CRITICAL";
  if (score >= 100) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function findAllPathsBFS(
  sourceId: string,
  targetId: string,
  edges: GraphEdge[],
  maxHops: number
): { path: string[]; edges: GraphEdge[] }[] {
  const results: { path: string[]; edges: GraphEdge[] }[] = [];
  const queue: { id: string; path: string[]; usedEdges: GraphEdge[] }[] = [
    { id: sourceId, path: [sourceId], usedEdges: [] }
  ];

  while (queue.length > 0) {
    const { id, path, usedEdges } = queue.shift()!;
    if (path.length > maxHops + 1) continue;

    if (id === targetId && path.length > 1) {
      results.push({ path: [...path], edges: [...usedEdges] });
      continue;
    }

    for (const edge of edges) {
      if (edge.source === id && !path.includes(edge.target)) {
        queue.push({
          id: edge.target,
          path: [...path, edge.target],
          usedEdges: [...usedEdges, edge]
        });
      }
    }
  }

  return results;
}

export function deriveThreats(
  nodes: GraphNode[],
  edges: GraphEdge[],
  timestamp: string | null
): ThreatMapResult {
  const threats: DerivedThreat[] = [];
  let threatCounter = 0;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const IT_PLATFORMS = new Set(["enterprise", "aws", "ci_cd", "k8s"]);
  const OT_TYPES = new Set(["PLC", "HMI"]);

  const itNodes = nodes.filter(n => IT_PLATFORMS.has(n.platform) || n.type === "HUMAN");
  const otTargets = nodes.filter(n => n.platform === "ot" || OT_TYPES.has(n.type));

  for (const src of itNodes) {
    for (const tgt of otTargets) {
      const pathResults = findAllPathsBFS(src.id, tgt.id, edges, 8);
      for (const result of pathResults) {
        const maxRisk = Math.max(...result.path.map(nid => nodeMap.get(nid)?.risk_score || 0));
        const allProvenance = result.edges.flatMap(e => e.provenance);
        const allFirstSeen = result.edges.map(e => e.first_seen).sort();
        const allLastSeen = result.edges.map(e => e.last_seen).sort();

        threats.push({
          threat_id: `THREAT_ITOT_${++threatCounter}`,
          type: "IT_TO_OT_PATH",
          severity: computeSeverity(result.path.length, maxRisk),
          description: `Identity path exists from ${src.type} "${src.id}" (${src.platform}) to OT device "${tgt.id}" (${tgt.type}) through ${result.path.length - 2} intermediate nodes.`,
          nodes_involved: result.path,
          paths: [result.path],
          evidence: {
            event_ids: Array.from(new Set(allProvenance)),
            first_seen: allFirstSeen[0] || "",
            last_seen: allLastSeen[allLastSeen.length - 1] || ""
          }
        });
      }
    }
  }

  const nhis = nodes.filter(n =>
    n.type === "SERVICE_ACCOUNT" || n.type === "WORKLOAD"
  );
  for (const nhi of nhis) {
    const hasAccessEdges = edges.some(e => e.source === nhi.id);
    if (!hasAccessEdges) continue;

    const hasHumanOwner = itNodes
      .filter(n => n.type === "HUMAN")
      .some(human => {
        const pathResults = findAllPathsBFS(human.id, nhi.id, edges, 4);
        return pathResults.length > 0;
      });

    if (!hasHumanOwner) {
      const outEdges = edges.filter(e => e.source === nhi.id);
      const allProvenance = outEdges.flatMap(e => e.provenance);
      const firstSeen = nhi.first_seen;
      const lastSeen = nhi.last_seen;
      const durationMs = new Date(lastSeen).getTime() - new Date(firstSeen).getTime();
      const durationHours = Math.round(durationMs / 3600000);

      threats.push({
        threat_id: `THREAT_ORPHAN_${++threatCounter}`,
        type: "ORPHAN_NHI",
        severity: durationHours > 24 ? "HIGH" : "MEDIUM",
        description: `Non-human identity "${nhi.id}" (${nhi.type}) has ${outEdges.length} outbound relationship(s) but no traceable human owner. Duration observed: ${durationHours}h.`,
        nodes_involved: [nhi.id, ...outEdges.map(e => e.target)],
        paths: [],
        evidence: {
          event_ids: Array.from(new Set(allProvenance)),
          first_seen: firstSeen,
          last_seen: lastSeen
        }
      });
    }
  }

  for (const node of nodes) {
    if (node.type !== "SERVICE_ACCOUNT" && node.type !== "WORKLOAD") continue;
    const delegationEdges = edges.filter(e =>
      e.source === node.id && (e.label === "ASSUMES" || e.label === "CONTROLS" || e.label === "ACCESSES")
    );
    if (delegationEdges.length < 4) continue;

    const chain = [node.id, ...delegationEdges.map(e => e.target)];
    const allProvenance = delegationEdges.flatMap(e => e.provenance);
    const allFirstSeen = delegationEdges.map(e => e.first_seen).sort();
    const allLastSeen = delegationEdges.map(e => e.last_seen).sort();

    threats.push({
      threat_id: `THREAT_DELEG_${++threatCounter}`,
      type: "EXCESSIVE_DELEGATION",
      severity: delegationEdges.length >= 6 ? "HIGH" : "MEDIUM",
      description: `Identity "${node.id}" has ${delegationEdges.length} transitive delegation relationships. Delegation depth exceeds safe threshold.`,
      nodes_involved: chain,
      paths: [chain],
      evidence: {
        event_ids: Array.from(new Set(allProvenance)),
        first_seen: allFirstSeen[0] || "",
        last_seen: allLastSeen[allLastSeen.length - 1] || ""
      }
    });
  }

  for (const node of nodes) {
    if (node.lifecycle_state !== "DECOMMISSIONED") continue;
    const activeEdges = edges.filter(e => e.source === node.id);
    if (activeEdges.length === 0) continue;

    const allProvenance = [...node.provenance, ...activeEdges.flatMap(e => e.provenance)];
    const reachableTargets = activeEdges.map(e => e.target);

    threats.push({
      threat_id: `THREAT_DORMANT_${++threatCounter}`,
      type: "DORMANT_REACTIVATION",
      severity: "CRITICAL",
      description: `Decommissioned identity "${node.id}" (${node.type}) still maintains ${activeEdges.length} active relationship(s). Possible unauthorized reactivation.`,
      nodes_involved: [node.id, ...reachableTargets],
      paths: activeEdges.map(e => [node.id, e.target]),
      evidence: {
        event_ids: Array.from(new Set(allProvenance)),
        first_seen: node.first_seen,
        last_seen: node.last_seen
      }
    });
  }

  threats.sort((a, b) => {
    const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.threat_id.localeCompare(b.threat_id);
  });

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const t of threats) {
    byType[t.type] = (byType[t.type] || 0) + 1;
    bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
  }

  return {
    timestamp,
    threats,
    summary: {
      total: threats.length,
      by_type: byType,
      by_severity: bySeverity
    }
  };
}
