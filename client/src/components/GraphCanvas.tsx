import { useEffect, useRef, useMemo, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { type GraphNode, type GraphEdge } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Maximize2, Loader2 } from "lucide-react";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  isLoading?: boolean;
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

export function GraphCanvas({ nodes, edges, onNodeClick, isLoading }: GraphCanvasProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

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

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const color = NODE_COLORS[node.type] || "#9CA3AF";
    const size = (NODE_VAL[node.type] || 3) * 1.5;
    const x = node.x || 0;
    const y = node.y || 0;

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

    if (node.risk_score >= 70) {
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
    ctx.fillStyle = '#64748B';
    ctx.fillText(label, x, y + size + 2);
  };

  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number') return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLen = 5;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - arrowLen * Math.cos(angle - Math.PI / 6), end.y - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - arrowLen * Math.cos(angle + Math.PI / 6), end.y - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#94A3B8';
    ctx.fill();

    if (globalScale > 1.2) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const labelSize = Math.max(7 / globalScale, 2.5);
      ctx.font = `${labelSize}px 'IBM Plex Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(link.label || '', midX, midY - 4);
    }
  };

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
          {Object.entries(NODE_COLORS).filter(([type]) => type !== 'IDENTITY').map(([type, color]) => (
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
    </div>
  );
}
