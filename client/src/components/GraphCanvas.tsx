import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { type GraphNode, type GraphEdge } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const NODE_SIZES: Record<string, number> = {
  HUMAN: 5,
  WORKLOAD: 4,
  SERVICE_ACCOUNT: 4,
  PLC: 7,
  HMI: 6,
};

const BLAST_RING_COLORS = ['#60A5FA', '#A78BFA', '#F87171', '#FB923C', '#34D399', '#FBBF24'];

const APPEAR_DURATION_MS = 600;
const DISAPPEAR_DURATION_MS = 400;

interface AnimState {
  opacity: number;
  scale: number;
  glowRadius: number;
  phase: 'hidden' | 'appearing' | 'visible' | 'disappearing';
  phaseStartTime: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function GraphCanvas({
  nodes,
  edges,
  onNodeClick,
  isLoading,
  highlightedPath,
  highlightedBlast,
  currentTime,
  replaySpeed = 1,
  showDebugOverlay = false,
}: GraphCanvasProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const nodeAnimRef = useRef<Map<string, AnimState>>(new Map());
  const edgeAnimRef = useRef<Map<string, AnimState>>(new Map());
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const isReplayingRef = useRef(false);

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

  const visibleNodeIds = useMemo(() => {
    if (!currentTime) return new Set(nodes.map(n => n.id));
    const t = new Date(currentTime).getTime();
    const result = new Set<string>();
    for (const node of nodes) {
      if (new Date(node.first_seen).getTime() <= t && t <= new Date(node.last_seen).getTime()) {
        result.add(node.id);
      }
    }
    return result;
  }, [nodes, currentTime]);

  const visibleEdgeKeys = useMemo(() => {
    if (!currentTime) return new Set(edges.map(e => `${e.source}|${e.target}|${e.label}`));
    const t = new Date(currentTime).getTime();
    const result = new Set<string>();
    for (const edge of edges) {
      if (
        new Date(edge.first_seen).getTime() <= t &&
        t <= new Date(edge.last_seen).getTime() &&
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target)
      ) {
        result.add(`${edge.source}|${edge.target}|${edge.label}`);
      }
    }
    return result;
  }, [edges, currentTime, visibleNodeIds]);

  useEffect(() => {
    isReplayingRef.current = !!currentTime;
    const now = performance.now();
    const nam = nodeAnimRef.current;

    for (const node of nodes) {
      const shouldBeVisible = visibleNodeIds.has(node.id);
      const anim = nam.get(node.id);

      if (!anim) {
        nam.set(node.id, {
          opacity: shouldBeVisible ? 1 : 0,
          scale: shouldBeVisible ? 1 : 0,
          glowRadius: 0,
          phase: shouldBeVisible ? 'visible' : 'hidden',
          phaseStartTime: now,
        });
        continue;
      }

      if (shouldBeVisible && (anim.phase === 'hidden' || anim.phase === 'disappearing')) {
        anim.phase = 'appearing';
        anim.phaseStartTime = now;
        anim.glowRadius = 20;
      } else if (!shouldBeVisible && (anim.phase === 'visible' || anim.phase === 'appearing')) {
        anim.phase = 'disappearing';
        anim.phaseStartTime = now;
      }
    }

    const eam = edgeAnimRef.current;
    for (const edge of edges) {
      const key = `${edge.source}|${edge.target}|${edge.label}`;
      const shouldBeVisible = visibleEdgeKeys.has(key);
      const anim = eam.get(key);

      if (!anim) {
        eam.set(key, {
          opacity: shouldBeVisible ? 1 : 0,
          scale: 1,
          glowRadius: 0,
          phase: shouldBeVisible ? 'visible' : 'hidden',
          phaseStartTime: now,
        });
        continue;
      }

      if (shouldBeVisible && (anim.phase === 'hidden' || anim.phase === 'disappearing')) {
        anim.phase = 'appearing';
        anim.phaseStartTime = now;
      } else if (!shouldBeVisible && (anim.phase === 'visible' || anim.phase === 'appearing')) {
        anim.phase = 'disappearing';
        anim.phaseStartTime = now;
      }
    }
  }, [visibleNodeIds, visibleEdgeKeys, nodes, edges, currentTime]);

  const tickAnimations = useCallback((now: number) => {
    const speedFactor = Math.max(replaySpeed, 0.5);
    const nam = nodeAnimRef.current;

    nam.forEach((anim) => {
      const elapsed = (now - anim.phaseStartTime) * speedFactor;

      if (anim.phase === 'appearing') {
        const t = Math.min(elapsed / APPEAR_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        anim.opacity = eased;
        anim.scale = 0.3 + 0.7 * eased;
        anim.glowRadius = 20 * (1 - eased);
        if (t >= 1) {
          anim.phase = 'visible';
          anim.opacity = 1;
          anim.scale = 1;
          anim.glowRadius = 0;
        }
      } else if (anim.phase === 'disappearing') {
        const t = Math.min(elapsed / DISAPPEAR_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        anim.opacity = 1 - eased;
        anim.scale = 1 - 0.3 * eased;
        if (t >= 1) {
          anim.phase = 'hidden';
          anim.opacity = 0;
          anim.scale = 0;
        }
      }
    });

    const eam = edgeAnimRef.current;
    eam.forEach((anim) => {
      const elapsed = (now - anim.phaseStartTime) * speedFactor;

      if (anim.phase === 'appearing') {
        const t = Math.min(elapsed / (APPEAR_DURATION_MS * 0.8), 1);
        anim.opacity = t;
        if (t >= 1) {
          anim.phase = 'visible';
          anim.opacity = 1;
        }
      } else if (anim.phase === 'disappearing') {
        const t = Math.min(elapsed / (DISAPPEAR_DURATION_MS * 0.6), 1);
        anim.opacity = 1 - t;
        if (t >= 1) {
          anim.phase = 'hidden';
          anim.opacity = 0;
        }
      }
    });
  }, [replaySpeed]);

  useEffect(() => {
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      if (now - lastFrameTimeRef.current > 16) {
        tickAnimations(now);
        lastFrameTimeRef.current = now;
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [tickAnimations]);

  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n, id: n.id, group: n.type, val: NODE_SIZES[n.type] || 3 })),
      links: edges.map(e => ({ ...e, source: e.source, target: e.target })),
    };
  }, [nodes, edges]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function updateDimensions() {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        if (w > 0 && h > 0) {
          setDimensions({ width: w, height: h });
        }
      }
    }

    updateDimensions();

    const ro = new ResizeObserver(() => updateDimensions());
    ro.observe(el);
    window.addEventListener('resize', updateDimensions);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const getNodeAnim = (nodeId: string): AnimState => {
    return nodeAnimRef.current.get(nodeId) || {
      opacity: 1, scale: 1, glowRadius: 0, phase: 'visible' as const, phaseStartTime: 0,
    };
  };

  const getEdgeAnim = (edgeKey: string, srcId: string, tgtId: string): AnimState => {
    let anim = edgeAnimRef.current.get(edgeKey);
    if (anim) return anim;
    const prefix = `${srcId}|${tgtId}|`;
    const entries = Array.from(edgeAnimRef.current.entries());
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][0].startsWith(prefix)) return entries[i][1];
    }
    return { opacity: 1, scale: 1, glowRadius: 0, phase: 'visible' as const, phaseStartTime: 0 };
  };

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const anim = getNodeAnim(node.id);

    if (!currentTime) {
      let finalOpacity = 1;
      if (highlightedPath) finalOpacity = pathNodeSet.has(node.id) ? 1 : 0.08;
      else if (highlightedBlast) finalOpacity = blastNodeMap.has(node.id) ? 1 : 0.08;
      drawNode(node, ctx, globalScale, finalOpacity, 1, 0);
      return;
    }

    if (anim.opacity <= 0.01) return;

    let finalOpacity = anim.opacity;
    if (highlightedPath) finalOpacity *= pathNodeSet.has(node.id) ? 1 : 0.08;
    else if (highlightedBlast) finalOpacity *= blastNodeMap.has(node.id) ? 1 : 0.08;

    drawNode(node, ctx, globalScale, finalOpacity, anim.scale, anim.glowRadius);
  }, [currentTime, highlightedPath, highlightedBlast, pathNodeSet, blastNodeMap]);

  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number, opacity: number, scale: number, glowRadius: number) => {
    const color = NODE_COLORS[node.type] || "#9CA3AF";
    let baseSize = (NODE_SIZES[node.type] || 3) * 1.5;
    const x = node.x || 0;
    const y = node.y || 0;

    const isPathNode = pathNodeSet.has(node.id);
    const blastDist = blastNodeMap.get(node.id);
    const isBlastSource = highlightedBlast?.source === node.id;

    if (isPathNode) baseSize *= 1.3;
    if (isBlastSource) baseSize *= 1.5;

    const size = baseSize * scale;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (glowRadius > 1) {
      ctx.beginPath();
      ctx.arc(x, y, size + glowRadius, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(color, 0.15 * (glowRadius / 20));
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, size + glowRadius * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(color, 0.25 * (glowRadius / 20));
      ctx.fill();
    }

    if (isBlastSource) {
      ctx.beginPath();
      ctx.arc(x, y, size + 10, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(BLAST_RING_COLORS[0], 0.15);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(BLAST_RING_COLORS[0], 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, size + 14, 0, 2 * Math.PI);
      ctx.strokeStyle = hexToRgba(BLAST_RING_COLORS[0], 0.2);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (blastDist !== undefined && blastDist > 0) {
      const ringColor = BLAST_RING_COLORS[Math.min(blastDist - 1, BLAST_RING_COLORS.length - 1)];
      ctx.beginPath();
      ctx.arc(x, y, size + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = hexToRgba(ringColor, 0.6);
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
      ctx.strokeStyle = "#60A5FA";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (node.risk_score >= 70) {
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = hexToRgba(color, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const label = node.id;
    const fontSize = Math.max(10 / globalScale, 3);
    ctx.font = `${fontSize}px 'IBM Plex Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = isPathNode ? '#93C5FD' : '#94A3B8';
    ctx.fillText(label, x, y + size + 2);

    if (blastDist !== undefined) {
      const distFontSize = Math.max(8 / globalScale, 3);
      ctx.font = `bold ${distFontSize}px 'IBM Plex Mono', monospace`;
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = BLAST_RING_COLORS[Math.min(blastDist, BLAST_RING_COLORS.length - 1)];
      ctx.fillText(blastDist === 0 ? 'SRC' : `+${blastDist}`, x, y - size - 2);
    }

    ctx.restore();
  };

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number') return;

    const srcId = typeof start === 'object' ? start.id : start;
    const tgtId = typeof end === 'object' ? end.id : end;
    const label = link.label || '';
    const edgeKey = `${srcId}|${tgtId}|${label}`;
    const isPathEdge = pathEdgeSet.has(`${srcId}|${tgtId}`);

    let baseAlpha = 1;

    if (currentTime) {
      const anim = getEdgeAnim(edgeKey, srcId, tgtId);
      if (anim.opacity <= 0.01) return;
      baseAlpha = anim.opacity;
    }

    if (hasHighlight && !isPathEdge) {
      if (highlightedBlast) {
        baseAlpha *= (blastNodeMap.has(srcId) && blastNodeMap.has(tgtId)) ? 0.7 : 0.04;
      } else {
        baseAlpha *= 0.04;
      }
    }

    ctx.save();
    ctx.globalAlpha = baseAlpha;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    const nodeSize = (NODE_SIZES[end.type] || 3) * 1.5;
    const endX = end.x - Math.cos(angle) * nodeSize;
    const endY = end.y - Math.sin(angle) * nodeSize;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(endX, endY);

    if (isPathEdge) {
      ctx.strokeStyle = hexToRgba('#60A5FA', 0.2);
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    const arrowLen = isPathEdge ? 8 : 5;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowLen * Math.cos(angle - Math.PI / 6), endY - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - arrowLen * Math.cos(angle + Math.PI / 6), endY - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = isPathEdge ? '#60A5FA' : '#64748B';
    ctx.fill();

    if (globalScale > 1.2 || isPathEdge) {
      const midX = (start.x + endX) / 2;
      const midY = (start.y + endY) / 2;
      const labelSize = isPathEdge ? Math.max(9 / globalScale, 3.5) : Math.max(7 / globalScale, 2.5);
      ctx.font = `${isPathEdge ? 'bold ' : ''}${labelSize}px 'IBM Plex Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isPathEdge ? '#93C5FD' : '#64748B';
      ctx.fillText(label, midX, midY - 4);
    }

    ctx.restore();
  }, [currentTime, hasHighlight, highlightedBlast, pathEdgeSet, blastNodeMap]);

  const visibleNodeCount = visibleNodeIds.size;
  const visibleEdgeCount = visibleEdgeKeys.size;
  const activePathCount = highlightedPath ? highlightedPath.length : 0;

  const animatingCount = useMemo(() => {
    let count = 0;
    nodeAnimRef.current.forEach(a => {
      if (a.phase === 'appearing' || a.phase === 'disappearing') count++;
    });
    return count;
  }, [visibleNodeIds]);

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
                <div className="w-2.5 h-0.5 bg-blue-400" />
                <span className="text-[10px] text-blue-300 font-medium">Active Path</span>
              </div>
            </div>
          )}
          {highlightedBlast && (
            <div className="mt-1 pt-1 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500/30 border border-blue-400" />
                <span className="text-[10px] text-blue-300 font-medium">Blast Radius</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentTime && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <Badge variant="outline" className="font-mono text-xs bg-card/90 backdrop-blur shadow-sm border-primary/40 text-primary px-3 py-1" data-testid="badge-replay-time">
            REPLAY {currentTime.substring(11, 19)}
          </Badge>
        </div>
      )}

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
          <div data-testid="text-total-nodes">Nodes: {nodes.length}</div>
          <div data-testid="text-total-edges">Edges: {edges.length}</div>
          {currentTime && (
            <div className="text-primary font-medium" data-testid="text-visible-count">
              Visible: {visibleNodeCount}N / {visibleEdgeCount}E
            </div>
          )}
        </div>
      </div>

      {showDebugOverlay && (
        <div className="absolute bottom-3 left-3 z-10 bg-card/95 backdrop-blur border border-border rounded-md px-3 py-2 shadow-sm" data-testid="debug-overlay">
          <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider font-medium text-primary mb-1">Debug</div>
            <div>Replay Time: {currentTime || "LIVE"}</div>
            <div>Visible Nodes: {visibleNodeCount} / {nodes.length}</div>
            <div>Visible Edges: {visibleEdgeCount} / {edges.length}</div>
            <div>Animating: {animatingCount}</div>
            <div>Active Paths: {activePathCount}</div>
            <div>Replay Speed: {replaySpeed}x</div>
          </div>
        </div>
      )}
    </div>
  );
}
