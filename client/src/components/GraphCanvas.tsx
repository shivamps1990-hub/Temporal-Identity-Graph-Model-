import { useEffect, useRef, useMemo, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { type GraphNode, type GraphEdge } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Maximize2, Loader2 } from "lucide-react";

interface PathSegment {
  source: string;
  target: string;
  label: string;
}

interface BlastHighlight {
  source: string;
  nodes: { id: string; distance: number; risk: number; type?: string }[];
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  isLoading?: boolean;
  highlightedPath?: PathSegment[] | null;
  highlightedBlast?: BlastHighlight | null;
  currentTime?: string | null;
  replaySpeed?: number;
  showDebugOverlay?: boolean;
}

const NODE_COLORS: Record<string, string> = {
  HUMAN: "#3B82F6",
  WORKLOAD: "#059669",
  SERVICE_ACCOUNT: "#7C3AED",
  PLC: "#DC2626",
  HMI: "#EA580C",
  RESOURCE: "#6B7280",
  IDENTITY: "#6B7280",
};

const NODE_VAL: Record<string, number> = {
  HUMAN: 5,
  WORKLOAD: 4,
  SERVICE_ACCOUNT: 4,
  PLC: 7,
  HMI: 6,
};

const BLAST_RING_COLORS = ['#3B82F6', '#7C3AED', '#DC2626', '#EA580C', '#059669', '#D97706'];

export function GraphCanvas({ nodes, edges, onNodeClick, isLoading, highlightedPath, highlightedBlast, currentTime, replaySpeed = 1, showDebugOverlay = false }: GraphCanvasProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const prevVisibleRef = useRef<{ nodes: Set<string>; edges: Set<string> }>({ nodes: new Set(), edges: new Set() });
  const opacityMapRef = useRef<Map<string, number>>(new Map());

  const pathNodeSet = useMemo(() => {
    if (!highlightedPath) return new Set<string>();
    const set = new Set<string>();
    for (const seg of highlightedPath) {
      set.add(seg.source);
      set.add(seg.target);
    }
    return set;
  }, [highlightedPath]);

  const pathEdgeSet = useMemo(() => {
    if (!highlightedPath) return new Set<string>();
    return new Set(highlightedPath.map(s => `${s.source}|${s.target}`));
  }, [highlightedPath]);

  const blastNodeMap = useMemo(() => {
    if (!highlightedBlast) return new Map<string, number>();
    const m = new Map<string, number>();
    m.set(highlightedBlast.source, 0);
    for (const n of highlightedBlast.nodes) {
      m.set(n.id, n.distance);
    }
    return m;
  }, [highlightedBlast]);

  const hasHighlight = !!highlightedPath || !!highlightedBlast;

  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!currentTime) {
      return {
        visibleNodes: new Set(nodes.map(n => n.id)),
        visibleEdges: new Set(edges.map(e => `${e.source}|${e.target}|${e.label}`))
      };
    }

    const t = new Date(currentTime).getTime();
    const vNodes = new Set<string>();
    const vEdges = new Set<string>();

    for (const node of nodes) {
      const fs = new Date(node.first_seen).getTime();
      const ls = new Date(node.last_seen).getTime();
      if (fs <= t && t <= ls) {
        vNodes.add(node.id);
      }
    }

    for (const edge of edges) {
      const fs = new Date(edge.first_seen).getTime();
      const ls = new Date(edge.last_seen).getTime();
      if (fs <= t && t <= ls && vNodes.has(edge.source) && vNodes.has(edge.target)) {
        vEdges.add(`${edge.source}|${edge.target}|${edge.label}`);
      }
    }

    return { visibleNodes: vNodes, visibleEdges: vEdges };
  }, [nodes, edges, currentTime]);

  useEffect(() => {
    const prev = prevVisibleRef.current;
    const om = opacityMapRef.current;

    Array.from(visibleNodes).forEach(nodeId => {
      if (!prev.nodes.has(nodeId)) {
        om.set(`node:${nodeId}`, 0.3);
      }
    });

    Array.from(prev.nodes).forEach(nodeId => {
      if (!visibleNodes.has(nodeId)) {
        om.set(`node:${nodeId}`, 0.1);
      }
    });

    prevVisibleRef.current = { nodes: new Set(visibleNodes), edges: new Set(visibleEdges) };
  }, [visibleNodes, visibleEdges]);

  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n, id: n.id, group: n.type, val: NODE_VAL[n.type] || 3 })),
      links: edges.map(e => ({ ...e, source: e.source, target: e.target }))
    };
  }, [nodes, edges]);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNodeOpacity = (node: any): number => {
    if (currentTime) {
      const isVisible = visibleNodes.has(node.id);
      const om = opacityMapRef.current;
      const key = `node:${node.id}`;
      const prevOpacity = om.get(key);

      if (isVisible) {
        const targetOpacity = 1;
        const current = prevOpacity !== undefined ? prevOpacity : 0;
        const lerpFactor = Math.min(0.15 + replaySpeed * 0.08, 0.6);
        const lerped = current + (targetOpacity - current) * lerpFactor;
        om.set(key, lerped);

        if (highlightedPath) {
          return pathNodeSet.has(node.id) ? lerped : lerped * 0.12;
        }
        if (highlightedBlast) {
          return blastNodeMap.has(node.id) ? lerped : lerped * 0.12;
        }
        return lerped;
      } else {
        const targetOpacity = 0;
        const current = prevOpacity !== undefined ? prevOpacity : 0;
        const fadeOutFactor = Math.min(0.1 + replaySpeed * 0.06, 0.5);
        const lerped = current + (targetOpacity - current) * fadeOutFactor;
        om.set(key, lerped);
        return lerped;
      }
    }

    if (highlightedPath) {
      return pathNodeSet.has(node.id) ? 1 : 0.12;
    }
    if (highlightedBlast) {
      return blastNodeMap.has(node.id) ? 1 : 0.12;
    }
    return 1;
  };

  const getEdgeOpacity = (edgeKey: string): number => {
    if (currentTime) {
      const parts = edgeKey.split("|");
      const fullKey = parts.length >= 3 ? edgeKey : undefined;
      if (!fullKey) return 0;
      return visibleEdges.has(fullKey) ? 1 : 0;
    }
    return 1;
  };

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const opacity = getNodeOpacity(node);
    if (opacity <= 0.01) return;

    const color = NODE_COLORS[node.type] || "#9CA3AF";
    let size = (NODE_VAL[node.type] || 3) * 1.5;
    const x = node.x || 0;
    const y = node.y || 0;

    const isPathNode = pathNodeSet.has(node.id);
    const blastDist = blastNodeMap.get(node.id);
    const isBlastSource = highlightedBlast?.source === node.id;

    if (isPathNode) size *= 1.3;
    if (isBlastSource) size *= 1.5;

    if (currentTime && visibleNodes.has(node.id)) {
      const om = opacityMapRef.current;
      const prevVal = om.get(`node:${node.id}`) || 0;
      if (prevVal < 0.9) {
        const scaleFactor = 0.9 + prevVal * 0.1;
        size *= scaleFactor;
      }
    }

    ctx.globalAlpha = opacity;

    if (isBlastSource) {
      ctx.beginPath();
      ctx.arc(x, y, size + 8, 0, 2 * Math.PI);
      ctx.fillStyle = BLAST_RING_COLORS[0] + '15';
      ctx.fill();
      ctx.strokeStyle = BLAST_RING_COLORS[0] + '40';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (blastDist !== undefined && blastDist > 0) {
      const ringColor = BLAST_RING_COLORS[Math.min(blastDist - 1, BLAST_RING_COLORS.length - 1)];
      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = ringColor + '60';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    if (node.platform === 'ot') {
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
    } else if (node.platform === 'k8s') {
      ctx.rect(x - size, y - size, size * 2, size * 2);
    } else {
      ctx.arc(x, y, size, 0, 2 * Math.PI);
    }

    ctx.fillStyle = color;
    ctx.fill();

    if (isPathNode) {
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (node.risk_score >= 70) {
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = color + "44";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const label = node.id;
    const fontSize = Math.max(10 / globalScale, 3);
    ctx.font = `${fontSize}px 'IBM Plex Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isPathNode ? '#1E40AF' : '#64748B';
    ctx.fillText(label, x, y + size + 2);

    if (blastDist !== undefined) {
      const distFontSize = Math.max(8 / globalScale, 3);
      ctx.font = `bold ${distFontSize}px 'IBM Plex Mono', monospace`;
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = BLAST_RING_COLORS[Math.min(blastDist, BLAST_RING_COLORS.length - 1)];
      ctx.fillText(blastDist === 0 ? 'SRC' : `+${blastDist}`, x, y - size - 2);
    }

    ctx.globalAlpha = 1;
  };

  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number') return;

    const srcId = typeof start === 'object' ? start.id : start;
    const tgtId = typeof end === 'object' ? end.id : end;
    const edgeKey = `${srcId}|${tgtId}`;
    const label = link.label || '';
    const fullEdgeKey = `${srcId}|${tgtId}|${label}`;
    const isPathEdge = pathEdgeSet.has(edgeKey);

    if (currentTime) {
      let edgeVisible = visibleEdges.has(fullEdgeKey);
      if (!edgeVisible && label === '') {
        const prefix = `${srcId}|${tgtId}|`;
        edgeVisible = Array.from(visibleEdges).some(k => k.startsWith(prefix));
      }
      if (!edgeVisible) return;
    }

    let alpha = 1;
    if (hasHighlight && !isPathEdge) {
      if (highlightedBlast) {
        alpha = (blastNodeMap.has(srcId) && blastNodeMap.has(tgtId)) ? 0.6 : 0.08;
      } else {
        alpha = 0.08;
      }
    }

    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    if (isPathEdge) {
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLen = isPathEdge ? 8 : 5;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - arrowLen * Math.cos(angle - Math.PI / 6), end.y - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - arrowLen * Math.cos(angle + Math.PI / 6), end.y - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = isPathEdge ? '#2563EB' : '#94A3B8';
    ctx.fill();

    if (globalScale > 1.2 || isPathEdge) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const labelSize = isPathEdge ? Math.max(9 / globalScale, 3.5) : Math.max(7 / globalScale, 2.5);
      ctx.font = `${isPathEdge ? 'bold ' : ''}${labelSize}px 'IBM Plex Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isPathEdge ? '#1E40AF' : '#94A3B8';
      ctx.fillText(label, midX, midY - 4);
    }

    ctx.globalAlpha = 1;
  };

  const visibleNodeCount = visibleNodes.size;
  const visibleEdgeCount = visibleEdges.size;
  const activePathCount = highlightedPath ? highlightedPath.length : 0;

  return (
    <div className="relative w-full h-full bg-grid-pattern" ref={containerRef} data-testid="graph-canvas">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Processing graph...</span>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="flex flex-col gap-1 p-2.5 rounded-md bg-card/90 backdrop-blur border border-border shadow-sm">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Legend</div>
          {Object.entries(NODE_COLORS).filter(([type]) => type !== 'IDENTITY' && type !== 'RESOURCE').map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{type}</span>
            </div>
          ))}
          <div className="mt-1 pt-1 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rotate-45 bg-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground">OT Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground">K8s Platform</span>
            </div>
          </div>
          {highlightedPath && (
            <div className="mt-1 pt-1 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 bg-blue-600" />
                <span className="text-[10px] text-blue-700 font-medium">Active Path</span>
              </div>
            </div>
          )}
          {highlightedBlast && (
            <div className="mt-1 pt-1 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500/30 border border-blue-500" />
                <span className="text-[10px] text-blue-700 font-medium">Blast Radius</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodeLabel={(node: any) => `${node.id} [${node.type}] risk:${node.risk_score}`}
        onNodeClick={(node) => onNodeClick?.(node as unknown as GraphNode)}
        nodeRelSize={6}
        cooldownTicks={100}
        d3VelocityDecay={0.4}
      />

      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={() => graphRef.current?.zoomToFit(400)}
          className="bg-card/90 backdrop-blur shadow-sm"
          data-testid="button-zoom-fit"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute bottom-3 right-3 z-10 bg-card/90 backdrop-blur border border-border rounded-md px-2.5 py-1.5 shadow-sm">
        <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
          <div>Nodes: {nodes.length}</div>
          <div>Edges: {edges.length}</div>
          {currentTime && <div>T: {currentTime.substring(11, 19)}</div>}
        </div>
      </div>

      {showDebugOverlay && (
        <div className="absolute bottom-3 left-3 z-10 bg-card/95 backdrop-blur border border-border rounded-md px-3 py-2 shadow-sm" data-testid="debug-overlay">
          <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider font-medium text-primary mb-1">Debug</div>
            <div>Replay Time: {currentTime || "LIVE"}</div>
            <div>Visible Nodes: {visibleNodeCount}</div>
            <div>Visible Edges: {visibleEdgeCount}</div>
            <div>Active Paths: {activePathCount}</div>
            <div>Replay Speed: {replaySpeed}x</div>
          </div>
        </div>
      )}
    </div>
  );
}
