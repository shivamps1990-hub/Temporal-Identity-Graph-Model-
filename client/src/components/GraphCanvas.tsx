import { useEffect, useRef, useMemo, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { type GraphNode, type GraphEdge } from "@shared/schema";
import { Card } from "@/components/ui/card";
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
  WORKLOAD: "#10B981",
  SERVICE_ACCOUNT: "#8B5CF6",
  PLC: "#EF4444",
  HMI: "#F97316",
  RESOURCE: "#6B7280",
};

const PLATFORM_SHAPES: Record<string, string> = {
  ot: "diamond",
  k8s: "square",
  ci_cd: "triangle",
  aws: "circle",
  enterprise: "circle",
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
    const color = NODE_COLORS[node.type] || "#888";
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
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = color + "66";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const label = node.id;
    const fontSize = Math.max(10 / globalScale, 3);
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(label, x, y + size + 2);
  };

  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (!start || !end || typeof start.x !== 'number') return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLen = 6;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - arrowLen * Math.cos(angle - Math.PI / 6), end.y - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - arrowLen * Math.cos(angle + Math.PI / 6), end.y - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#475569';
    ctx.fill();

    if (globalScale > 1.2) {
      const labelSize = Math.max(8 / globalScale, 2.5);
      ctx.font = `${labelSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#64748b';
      ctx.fillText(link.label || '', midX, midY - 4);
    }
  };

  return (
    <div className="relative w-full h-full bg-grid-pattern rounded-lg overflow-hidden border border-border bg-card/50" ref={containerRef} data-testid="graph-canvas">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="font-mono text-sm text-muted-foreground">Processing Graph...</span>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <Card className="p-3 bg-background/80 backdrop-blur border-border/50 shadow-xl">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Graph State</div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-foreground" data-testid="text-node-count">{nodes.length}</span>
                <span className="text-[10px] text-muted-foreground">NODES</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-foreground" data-testid="text-edge-count">{edges.length}</span>
                <span className="text-[10px] text-muted-foreground">EDGES</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="flex flex-col gap-1 p-2 rounded bg-background/80 backdrop-blur border border-border/50">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-mono text-muted-foreground">{type}</span>
            </div>
          ))}
          <div className="mt-1 pt-1 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rotate-45 bg-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">OT Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">K8s Platform</span>
            </div>
          </div>
        </div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#020817"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodeLabel={(node: any) => `${node.id} [${node.type}] risk:${node.risk_score}`}
        onNodeClick={(node) => onNodeClick?.(node as unknown as GraphNode)}
        nodeRelSize={6}
        cooldownTicks={100}
        d3VelocityDecay={0.4}
      />
      
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => graphRef.current?.zoomToFit(400)}
          className="bg-background/80 backdrop-blur"
          data-testid="button-zoom-fit"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
