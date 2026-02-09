import { 
  GraphNode, 
  GraphEdge, 
  NormalizedEvent, 
  GraphSnapshot, 
} from "@shared/schema";
import { createHash } from "crypto";

export class GraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private events: NormalizedEvent[] = [];
  private currentScenario: string = "cicd_compromise";
  private currentSeed: number = 42;

  constructor() {
    this.reset();
  }

  reset() {
    this.nodes.clear();
    this.edges.clear();
    this.events = [];
  }

  setScenarioInfo(scenario: string, seed: number) {
    this.currentScenario = scenario;
    this.currentSeed = seed;
  }

  getScenarioInfo() {
    return { scenario: this.currentScenario, seed: this.currentSeed };
  }

  getEvents(): NormalizedEvent[] {
    return [...this.events];
  }

  processEvent(event: NormalizedEvent): { nodesAdded: number, edgesAdded: number } {
    let nodesAdded = 0;
    let edgesAdded = 0;

    this.events.push(event);

    const subject = event.subject;
    if (!this.nodes.has(subject.id)) {
      this.nodes.set(subject.id, {
        ...subject,
        first_seen: event.timestamp,
        last_seen: event.timestamp,
        provenance: [event.event_id]
      });
      nodesAdded++;
    } else {
      const node = this.nodes.get(subject.id)!;
      if (new Date(event.timestamp) > new Date(node.last_seen)) {
        node.last_seen = event.timestamp;
      }
      if (new Date(event.timestamp) < new Date(node.first_seen)) {
        node.first_seen = event.timestamp;
      }
      if (!node.provenance.includes(event.event_id)) {
        node.provenance.push(event.event_id);
      }
      node.risk_score = Math.max(node.risk_score, subject.risk_score);
      node.lifecycle_state = subject.lifecycle_state;
    }

    for (const rel of event.relationships) {
      if (!this.nodes.has(rel.target.id)) {
        this.nodes.set(rel.target.id, {
          id: rel.target.id,
          type: rel.target.type as any,
          platform: "enterprise",
          lifecycle_state: "ACTIVE",
          risk_score: 0,
          first_seen: event.timestamp,
          last_seen: event.timestamp,
          provenance: [event.event_id]
        });
        nodesAdded++;
      } else {
        const targetNode = this.nodes.get(rel.target.id)!;
        if (new Date(event.timestamp) > new Date(targetNode.last_seen)) {
          targetNode.last_seen = event.timestamp;
        }
        if (new Date(event.timestamp) < new Date(targetNode.first_seen)) {
          targetNode.first_seen = event.timestamp;
        }
        if (!targetNode.provenance.includes(event.event_id)) {
          targetNode.provenance.push(event.event_id);
        }
      }

      const edgeKey = `${subject.id}|${rel.target.id}|${rel.label}`;
      if (!this.edges.has(edgeKey)) {
        this.edges.set(edgeKey, {
          source: subject.id,
          target: rel.target.id,
          label: rel.label,
          first_seen: event.timestamp,
          last_seen: event.timestamp,
          provenance: [event.event_id]
        });
        edgesAdded++;
      } else {
        const edge = this.edges.get(edgeKey)!;
        if (new Date(event.timestamp) > new Date(edge.last_seen)) {
          edge.last_seen = event.timestamp;
        }
        if (new Date(event.timestamp) < new Date(edge.first_seen)) {
          edge.first_seen = event.timestamp;
        }
        if (!edge.provenance.includes(event.event_id)) {
          edge.provenance.push(event.event_id);
        }
      }
    }

    return { nodesAdded, edgesAdded };
  }

  private getFilteredState(atTimestamp?: string): { nodes: GraphNode[], edges: GraphEdge[] } {
    if (atTimestamp) {
      const t = new Date(atTimestamp).getTime();
      const filteredNodes = Array.from(this.nodes.values()).filter(n =>
        new Date(n.first_seen).getTime() <= t
      );
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = Array.from(this.edges.values()).filter(e =>
        new Date(e.first_seen).getTime() <= t && nodeIds.has(e.source) && nodeIds.has(e.target)
      );
      return { nodes: filteredNodes, edges: filteredEdges };
    }
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  getSnapshot(atTimestamp?: string): GraphSnapshot {
    const { nodes: filteredNodes, edges: filteredEdges } = this.getFilteredState(atTimestamp);

    const sortedNodes = filteredNodes.sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = filteredEdges.sort((a, b) => 
      (a.source + a.target + a.label).localeCompare(b.source + b.target + b.label)
    );

    const content = JSON.stringify({ nodes: sortedNodes, edges: sortedEdges });
    const version = createHash('sha256').update(content).digest('hex');

    return {
      version,
      nodes: sortedNodes,
      edges: sortedEdges,
      stats: {
        node_count: sortedNodes.length,
        edge_count: sortedEdges.length,
        event_count: this.events.length
      }
    };
  }

  findPaths(sourceId: string, targetId: string, maxHops: number = 5, atTimestamp?: string): any[] {
    const { nodes: filteredNodes, edges: filteredEdges } = this.getFilteredState(atTimestamp);
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const activeEdges = filteredEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return [];

    const paths: any[] = [];
    const queue: { id: string, path: any[] }[] = [{ id: sourceId, path: [] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      if (path.length > maxHops) continue;

      if (id === targetId && path.length > 0) {
        paths.push(path);
        continue;
      }

      for (const edge of activeEdges) {
        if (edge.source === id) {
          if (path.some(p => p.source === edge.target)) continue;
          if (id !== sourceId && path.some(p => p.target === edge.target)) continue;

          const newPath = [...path, {
            source: edge.source,
            target: edge.target,
            label: edge.label,
            first_seen: edge.first_seen,
            last_seen: edge.last_seen,
            event_ids: edge.provenance
          }];
          
          queue.push({ id: edge.target, path: newPath });
        }
      }
    }
    return paths;
  }

  calculateBlastRadius(sourceId: string, maxHops: number = 3, atTimestamp?: string): { id: string, distance: number, risk: number, type: string }[] {
    const { nodes: filteredNodes, edges: filteredEdges } = this.getFilteredState(atTimestamp);
    const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));
    const activeEdges = filteredEdges.filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));

    if (!nodeMap.has(sourceId)) return [];

    const visited = new Map<string, { distance: number, risk: number, type: string }>();
    const queue: { id: string, distance: number }[] = [{ id: sourceId, distance: 0 }];
    const srcNode = nodeMap.get(sourceId)!;
    visited.set(sourceId, { distance: 0, risk: srcNode.risk_score, type: srcNode.type });

    while (queue.length > 0) {
      const { id, distance } = queue.shift()!;
      if (distance >= maxHops) continue;

      for (const edge of activeEdges) {
        if (edge.source === id && !visited.has(edge.target)) {
          const targetNode = nodeMap.get(edge.target);
          if (targetNode) {
            visited.set(edge.target, { distance: distance + 1, risk: targetNode.risk_score, type: targetNode.type });
            queue.push({ id: edge.target, distance: distance + 1 });
          }
        }
      }
    }

    visited.delete(sourceId);

    return Array.from(visited.entries())
      .map(([id, data]) => ({ id, distance: data.distance, risk: data.risk, type: data.type }))
      .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
  }

  detectThreats(): any[] {
    const threats: any[] = [];
    
    for (const node of Array.from(this.nodes.values())) {
      if (node.platform === 'ot') {
        for (const edge of Array.from(this.edges.values())) {
          if (edge.target === node.id) {
            const sourceNode = this.nodes.get(edge.source);
            if (sourceNode && sourceNode.platform !== 'ot') {
              threats.push({
                type: 'it-ot-bridge',
                severity: 'HIGH',
                description: `IT/Cloud node ${sourceNode.id} (${sourceNode.type}) accesses OT node ${node.id}`,
                involved_nodes: [sourceNode.id, node.id],
                evidence: edge.provenance
              });
            }
          }
        }
      }
    }

    for (const node of Array.from(this.nodes.values())) {
      if (node.type === 'SERVICE_ACCOUNT' && node.risk_score >= 50) {
        const assumedRoles = Array.from(this.edges.values()).filter(e => e.source === node.id && e.label === 'ASSUMES');
        if (assumedRoles.length >= 3) {
          threats.push({
            type: 'over-delegation',
            severity: 'MEDIUM',
            description: `Service account ${node.id} assumes ${assumedRoles.length} roles (excessive privilege)`,
            involved_nodes: [node.id, ...assumedRoles.map(r => r.target)],
            evidence: assumedRoles.flatMap(r => r.provenance)
          });
        }
      }
    }

    for (const node of Array.from(this.nodes.values())) {
      if ((node.type === 'SERVICE_ACCOUNT' || node.type === 'WORKLOAD') && node.lifecycle_state === 'DECOMMISSIONED') {
        const recentEdges = Array.from(this.edges.values()).filter(e => e.source === node.id);
        if (recentEdges.length > 0) {
          threats.push({
            type: 'dormant-reactivation',
            severity: 'CRITICAL',
            description: `Decommissioned identity ${node.id} still has ${recentEdges.length} active relationship(s)`,
            involved_nodes: [node.id, ...recentEdges.map(e => e.target)],
            evidence: recentEdges.flatMap(e => e.provenance)
          });
        }
      }
    }

    return threats;
  }
}
