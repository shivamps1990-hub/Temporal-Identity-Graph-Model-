import { 
  GraphNode, 
  GraphEdge, 
  NormalizedEvent, 
  GraphSnapshot, 
  NodeDataSchema, 
  EdgeDataSchema 
} from "@shared/schema";
import { createHash } from "crypto";

export class GraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map(); // Key: source|target|label
  private events: NormalizedEvent[] = [];
  
  // Provenance tracking
  private eventEffects: Map<string, { nodes: string[], edges: string[] }> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.nodes.clear();
    this.edges.clear();
    this.events = [];
    this.eventEffects.clear();
  }

  /**
   * U(G, event) - The deterministic update function
   */
  processEvent(event: NormalizedEvent): { nodesAdded: number, edgesAdded: number } {
    let nodesAdded = 0;
    let edgesAdded = 0;

    // Idempotency check: if we processed this exact event ID, skip or update?
    // For this prototype, we'll assume append-only log but process logic handles updates
    
    this.events.push(event);

    // 1. Process Subject Node
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
      // Update last_seen
      if (new Date(event.timestamp) > new Date(node.last_seen)) {
        node.last_seen = event.timestamp;
      }
      // Update first_seen if earlier (unlikely in stream but possible in batch)
      if (new Date(event.timestamp) < new Date(node.first_seen)) {
        node.first_seen = event.timestamp;
      }
      // Add provenance if new
      if (!node.provenance.includes(event.event_id)) {
        node.provenance.push(event.event_id);
      }
      // Update risk score (simple max rule for now)
      node.risk_score = Math.max(node.risk_score, subject.risk_score);
      node.lifecycle_state = subject.lifecycle_state; // State transitions?
    }

    // 2. Process Relationships (Edges)
    for (const rel of event.relationships) {
      // Ensure target node exists (implicit creation if missing details)
      if (!this.nodes.has(rel.target.id)) {
        this.nodes.set(rel.target.id, {
          id: rel.target.id,
          type: rel.target.type as any, // Cast for now, would refine with more info
          platform: "enterprise", // Default/Unknown
          lifecycle_state: "ACTIVE",
          risk_score: 0,
          first_seen: event.timestamp,
          last_seen: event.timestamp,
          provenance: [event.event_id]
        });
        nodesAdded++;
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
        if (!edge.provenance.includes(event.event_id)) {
          edge.provenance.push(event.event_id);
        }
      }
    }

    return { nodesAdded, edgesAdded };
  }

  getSnapshot(): GraphSnapshot {
    // Deterministic ordering for stable hashing
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = Array.from(this.edges.values()).sort((a, b) => 
      (a.source + a.target + a.label).localeCompare(b.source + b.target + b.label)
    );

    const content = JSON.stringify({ nodes: sortedNodes, edges: sortedEdges });
    const version = createHash('sha256').update(content).digest('hex');

    return {
      version,
      nodes: sortedNodes,
      edges: sortedEdges,
      stats: {
        node_count: this.nodes.size,
        edge_count: this.edges.size,
        event_count: this.events.length
      }
    };
  }

  // === Analysis Functions ===

  findPaths(sourceId: string, targetId: string, maxHops: number = 5): any[] {
    const paths: any[] = [];
    const queue: { id: string, path: any[] }[] = [{ id: sourceId, path: [] }];
    const visited = new Set<string>(); // Cycle detection per path? No, simpler BFS for now.

    // Simple BFS for reachability
    // Note: This is a basic implementation. For production, use specialized graph algos.
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      if (path.length >= maxHops) continue;

      if (id === targetId && path.length > 0) {
        paths.push(path);
        continue;
      }

      // Find outgoing edges
      for (const edge of Array.from(this.edges.values())) {
        if (edge.source === id) {
          // Avoid cycles in current path
          if (path.some(p => p.source === edge.target)) continue;

          const newPath = [...path, {
            source: edge.source,
            target: edge.target,
            label: edge.label,
            event_ids: edge.provenance
          }];
          
          queue.push({ id: edge.target, path: newPath });
        }
      }
    }
    return paths;
  }

  detectThreats(): any[] {
    const threats: any[] = [];
    
    // Example Threat 1: IT to OT Bridge
    // Look for paths from Platform=Enterprise/AWS -> Platform=OT
    for (const node of Array.from(this.nodes.values())) {
        if (node.platform === 'ot') {
            // Check incoming edges from non-OT
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

    return threats;
  }
}
