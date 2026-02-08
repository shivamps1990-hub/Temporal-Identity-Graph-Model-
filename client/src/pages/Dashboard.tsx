import { useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ReplayControls } from "@/components/ReplayControls";
import { NodeDetails } from "@/components/NodeDetails";
import { useGraphSnapshot, useResetGraph } from "@/hooks/use-graph";
import { useReplayEvents } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, PlayCircle, Info } from "lucide-react";
import { type GraphNode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 flex-1">
          <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
            <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-border bg-black/20">
              <GraphCanvas 
                nodes={snapshot?.nodes || []} 
                edges={snapshot?.edges || []}
                isLoading={isLoading || isResetting || isReplaying}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-6 overflow-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  RESEARCH CONTEXT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The Temporal Gap</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Traditional IAM models are static. This prototype explores how access <strong>emerges from paths over time</strong>, especially for non-human identities.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Blast Radius</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    In a graph model, blast radius is a reachability problem. We compute structural impact across IT, Cloud, and OT domains.
                  </p>
                </div>
                <Link href="/about">
                  <Button variant="link" className="p-0 h-auto text-xs text-primary hover:text-primary/80">
                    Read the full research paper →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">SCENARIOS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start font-mono text-[10px]"
                  onClick={() => handleScenarioLoad('cicd_compromise')}
                  disabled={isReplaying}
                >
                  CICD_COMPROMISE.ndjson
                </Button>
                <p className="text-[10px] text-muted-foreground italic px-1">
                  Trace: Human → Jenkins → Cloud Role → K8s Admin → OT Gateway → PLC
                </p>
              </CardContent>
            </Card>
          </div>
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
