import { useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ReplayControls } from "@/components/ReplayControls";
import { NodeDetails } from "@/components/NodeDetails";
import { useGraphSnapshot, useResetGraph } from "@/hooks/use-graph";
import { useReplayEvents } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, PlayCircle } from "lucide-react";
import { type GraphNode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: snapshot, isLoading, refetch } = useGraphSnapshot();
  const { mutate: resetGraph, isPending: isResetting } = useResetGraph();
  const { mutate: replayScenario, isPending: isReplaying } = useReplayEvents();
  const { toast } = useToast();
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setIsDetailsOpen(true);
  };

  const handleReset = () => {
    resetGraph(undefined, {
      onSuccess: () => {
        toast({ title: "Graph Reset", description: "Identity graph has been cleared." });
        refetch();
      }
    });
  };

  const handleScenarioLoad = (scenario: string) => {
    replayScenario({ scenario, reset: true }, {
      onSuccess: (data) => {
        toast({ 
          title: "Scenario Loaded", 
          description: `Processed ${data.stats.events_processed} events. Found ${data.stats.final_nodes} nodes.` 
        });
        refetch();
      }
    });
  };

  // Mock time range for prototype
  const now = new Date();
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur">
        <div>
          <h2 className="text-2xl font-mono font-bold tracking-tight">Active Identity Graph</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time visualization of identity relationships and temporal flows.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleScenarioLoad('baseline')}
            disabled={isReplaying}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Load Baseline
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={isResetting}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            Reset Graph
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden p-6 flex flex-col gap-6">
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-border">
          <GraphCanvas 
            nodes={snapshot?.nodes || []} 
            edges={snapshot?.edges || []}
            isLoading={isLoading || isResetting || isReplaying}
            onNodeClick={handleNodeClick}
          />
        </div>

        <Card className="border-border bg-card/50">
          <ReplayControls 
            startTime={startTime} 
            endTime={now} 
            onReplay={(val) => console.log(val)} 
            onReset={handleReset}
          />
        </Card>
      </div>

      <NodeDetails 
        node={selectedNode} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
    </div>
  );
}
