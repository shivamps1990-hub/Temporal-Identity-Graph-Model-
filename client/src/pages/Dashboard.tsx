import { useState, useCallback } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ReplayControls } from "@/components/ReplayControls";
import { NodeDetails } from "@/components/NodeDetails";
import { useGraphSnapshot, useResetGraph } from "@/hooks/use-graph";
import { useReplayEvents } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, PlayCircle, Hash } from "lucide-react";
import { type GraphNode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Scenario {
  name: string;
  label: string;
  description: string;
}

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("cicd_compromise");
  const [replayTimestamp, setReplayTimestamp] = useState<string | null>(null);
  const [graphHash, setGraphHash] = useState<string | null>(null);

  const { data: snapshot, isLoading, refetch } = useGraphSnapshot(replayTimestamp);
  const { mutate: resetGraph, isPending: isResetting } = useResetGraph();
  const { mutate: replayScenario, isPending: isReplaying } = useReplayEvents();
  const { toast } = useToast();

  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ['/api/scenarios'],
  });

  const { data: events } = useQuery<{ event_id: string; timestamp: string }[]>({
    queryKey: ['/api/events'],
  });

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setIsDetailsOpen(true);
  };

  const handleReset = () => {
    resetGraph(undefined, {
      onSuccess: () => {
        toast({ title: "Graph Reset", description: "Identity graph has been cleared." });
        setGraphHash(null);
        setReplayTimestamp(null);
        refetch();
      }
    });
  };

  const handleScenarioLoad = () => {
    replayScenario({ scenario: selectedScenario, reset: true }, {
      onSuccess: (data) => {
        toast({ 
          title: "Scenario Loaded", 
          description: `${data.stats.events_processed} events processed. ${data.stats.final_nodes} nodes, ${data.stats.final_edges} edges.` 
        });
        setGraphHash(data.graph_hash);
        setReplayTimestamp(null);
        refetch();
      }
    });
  };

  const handleTimestampChange = useCallback((ts: string | null) => {
    setReplayTimestamp(ts);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-mono font-bold tracking-tight" data-testid="text-page-title">Temporal Identity Graph</h2>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {replayTimestamp ? `Viewing at: ${replayTimestamp}` : "Live view"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedScenario} onValueChange={setSelectedScenario}>
            <SelectTrigger className="w-[200px] font-mono text-xs" data-testid="select-scenario">
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent>
              {(scenarios || []).map(s => (
                <SelectItem key={s.name} value={s.name} data-testid={`option-scenario-${s.name}`}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleScenarioLoad}
            disabled={isReplaying}
            data-testid="button-load-scenario"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {isReplaying ? "Loading..." : "Load"}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={isResetting}
            data-testid="button-reset-graph"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            Reset
          </Button>
        </div>
      </div>

      {graphHash && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <Hash className="w-3 h-3" />
          <span>graph_hash: {graphHash.substring(0, 16)}...{graphHash.substring(graphHash.length - 8)}</span>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden p-4 flex flex-col gap-4">
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-border bg-black/20">
          <GraphCanvas 
            nodes={snapshot?.nodes || []} 
            edges={snapshot?.edges || []}
            isLoading={isLoading || isResetting || isReplaying}
            onNodeClick={handleNodeClick}
          />
        </div>

        <Card className="border-border bg-card/50">
          <ReplayControls 
            events={events || []}
            onTimestampChange={handleTimestampChange}
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
