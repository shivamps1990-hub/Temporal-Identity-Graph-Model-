import React, { useEffect, useRef, useMemo, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject, type LinkObject } from "react-force-graph-2d";
import { useTheme } from "next-themes";
import { type GraphNode, type GraphEdge } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2, Loader2 } from "lucide-react";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  isLoading?: boolean;
}

// Map schema types to internal visualization types
const NODE_COLORS: Record<string, string> = {
  HUMAN: "#3B82F6", // Blue
  WORKLOAD: "#10B981", // Green
  SERVICE_ACCOUNT: "#8B5CF6", // Purple
  PLC: "#EF4444", // Red
  HMI: "#F97316", // Orange
};

const NODE_VAL: Record<string, number> = {
  HUMAN: 5,
  WORKLOAD: 4,
  SERVICE_ACCOUNT: 4,
  PLC: 6,
  HMI: 6,
};

export function GraphCanvas({ nodes, edges, onNodeClick, isLoading }: GraphCanvasProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Transform data for force-graph (it mutates, so we create fresh objects)
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

  const bgColor = theme === "light" ? "#ffffff" : "#020817"; // matches zinc-950
  const txtColor = theme === "light" ? "#000000" : "#ffffff";
  const linkColor = theme === "light" ? "#e5e7eb" : "#1e293b";

  return (
    <div className="relative w-full h-full bg-grid-pattern rounded-lg overflow-hidden border border-border bg-card/50" ref={containerRef}>
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="font-mono text-sm text-muted-foreground">Initializing Neural Link...</span>
          </div>
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <Card className="p-3 bg-background/80 backdrop-blur border-border/50 shadow-xl">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Graph Stats</div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-foreground">{nodes.length}</span>
                <span className="text-[10px] text-muted-foreground">NODES</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold font-mono text-foreground">{edges.length}</span>
                <span className="text-[10px] text-muted-foreground">EDGES</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
         <div className="flex flex-col gap-1 p-2 rounded bg-background/80 backdrop-blur border border-border/50">
           {Object.entries(NODE_COLORS).map(([type, color]) => (
             <div key={type} className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
               <span className="text-[10px] font-mono text-muted-foreground">{type}</span>
             </div>
           ))}
         </div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={bgColor}
        nodeLabel={(node: any) => `${node.id} [${node.type}]`}
        nodeColor={(node: any) => NODE_COLORS[node.type] || "#888"}
        linkColor={() => linkColor}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => onNodeClick?.(node as unknown as GraphNode)}
        
        // Visual polish
        nodeRelSize={6}
        linkWidth={1.5}
        linkCurvature={0.2}
        cooldownTicks={100}
        d3VelocityDecay={0.4}
      />
      
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => graphRef.current?.zoomToFit(400)}
          className="bg-background/80 backdrop-blur"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
