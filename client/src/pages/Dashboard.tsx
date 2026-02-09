import { useState, useCallback } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ReplayControls } from "@/components/ReplayControls";
import { NodeDetails } from "@/components/NodeDetails";
import { useGraphSnapshot, useResetGraph } from "@/hooks/use-graph";
import { useReplayEvents } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, PlayCircle, Hash, Users, Clock, GitBranch, Layers, Download, Bug } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type GraphNode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface Scenario {
  name: string;
  label: string;
  description: string;
  intent?: string;
  expected_threats?: string[];
}

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("cicd_compromise");
  const [replayTimestamp, setReplayTimestamp] = useState<string | null>(null);
  const [graphHash, setGraphHash] = useState<string | null>(null);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [showDebug, setShowDebug] = useState(false);

  const queryClient = useQueryClient();
  const { data: snapshot, isLoading } = useGraphSnapshot(replayTimestamp);
  const { mutate: resetGraph, isPending: isResetting } = useResetGraph();
  const { mutate: replayScenario, isPending: isReplaying } = useReplayEvents();
  const { toast } = useToast();

  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ['/api/scenarios'],
  });

  const { data: events } = useQuery<{ event_id: string; timestamp: string }[]>({
    queryKey: ['/api/events'],
  });

  const currentScenario = scenarios?.find(s => s.name === selectedScenario);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setIsDetailsOpen(true);
  };

  const invalidateAll = async () => {
    await queryClient.refetchQueries({ queryKey: ['/api/graph/snapshot'] });
    await queryClient.refetchQueries({ queryKey: ['/api/events'] });
    queryClient.invalidateQueries({ queryKey: ['/api/analysis/threat-map'] });
  };

  const handleReset = () => {
    resetGraph(undefined, {
      onSuccess: () => {
        toast({ title: "Graph Reset", description: "Identity graph has been cleared." });
        setGraphHash(null);
        setReplayTimestamp(null);
        invalidateAll();
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
        invalidateAll();
      }
    });
  };

  const handleTimestampChange = useCallback((ts: string | null) => {
    setReplayTimestamp(ts);
  }, []);

  const stats = snapshot?.stats;
  const nodeTypes = snapshot?.nodes ? new Map<string, number>() : null;
  const platforms = snapshot?.nodes ? new Set<string>() : null;
  if (snapshot?.nodes) {
    for (const n of snapshot.nodes) {
      nodeTypes!.set(n.type, (nodeTypes!.get(n.type) || 0) + 1);
      platforms!.add(n.platform);
    }
  }

  const humanCount = nodeTypes?.get("HUMAN") || 0;
  const nhiCount = (stats?.node_count || 0) - humanCount;

  const timestamps = (events || []).map(e => new Date(e.timestamp).getTime());
  const timeStart = timestamps.length ? new Date(Math.min(...timestamps)) : null;
  const timeEnd = timestamps.length ? new Date(Math.max(...timestamps)) : null;

  const edgeLabels = snapshot?.edges ? Array.from(new Set(snapshot.edges.map(e => e.label))) : [];

  return (
    <div className="flex flex-col min-h-full bg-background overflow-auto">
      <div className="p-6 pb-0 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Temporal Identity Graph</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Interactive visualization and temporal replay of identity relationships.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="w-[220px] text-sm" data-testid="select-scenario">
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
              variant="default"
              onClick={handleScenarioLoad}
              disabled={isReplaying}
              data-testid="button-load-scenario"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {isReplaying ? "Loading..." : "Load Scenario"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isResetting}
              data-testid="button-reset-graph"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
              Reset
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => window.open('/export/replay-dataset', '_blank')} data-testid="button-export-dataset">
                  <Download className="w-4 h-4 mr-1.5" />
                  Export Replay Dataset
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[220px]">Download the synthetic identity events used to construct the graph in this replay.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => window.open('/export/scenario-metadata', '_blank')} data-testid="button-export-metadata">
                  <Download className="w-4 h-4 mr-1.5" />
                  Export Scenario Metadata
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[220px]">Download metadata describing the experimental scenario and intended analysis points.</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDebug(d => !d)}
              className={showDebug ? 'border-primary text-primary' : ''}
              data-testid="button-toggle-debug"
            >
              <Bug className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card data-testid="panel-dataset-overview">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-semibold text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Dataset Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                This dataset consists of synthetic, time-ordered identity events used to construct a temporal identity graph.
                All identities, relationships, and timestamps are generated deterministically for reproducibility.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total events</span>
                  <span className="font-mono font-medium" data-testid="text-event-count">{stats?.event_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time span</span>
                  <span className="font-mono text-xs">
                    {timeStart ? format(timeStart, "MMM d HH:mm") : "--"} - {timeEnd ? format(timeEnd, "HH:mm") : "--"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Identities</span>
                  <span className="font-mono font-medium" data-testid="text-node-count">{stats?.node_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relationships</span>
                  <span className="font-mono font-medium" data-testid="text-edge-count">{stats?.edge_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Human</span>
                  <span className="font-mono">{humanCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Non-human</span>
                  <span className="font-mono">{nhiCount}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {edgeLabels.map(label => (
                  <Badge key={label} variant="secondary" className="text-[10px] font-mono">{label}</Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 italic">
                These statistics describe the dataset structure only and do not represent risk or severity.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="panel-scenario-description">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-semibold text-muted-foreground flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Scenario Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                This scenario is designed to illustrate a specific identity risk pattern through controlled event generation.
                Threats shown in this demo are derived from graph structure and timing, not from predefined rules or alerts.
              </p>
              {currentScenario && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground shrink-0">Scenario</span>
                    <span className="font-medium text-right">{currentScenario.label}</span>
                  </div>
                  {currentScenario.intent && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-muted-foreground shrink-0">Intent</span>
                      <span className="text-right text-xs">{currentScenario.intent}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground text-xs">Expected risk patterns:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(currentScenario.expected_threats || []).map(t => (
                        <Badge key={t} variant="outline" className="text-[10px] font-mono">{t}</Badge>
                      ))}
                      {(!currentScenario.expected_threats || currentScenario.expected_threats.length === 0) && (
                        <span className="text-[10px] text-muted-foreground italic">None expected (control scenario)</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {graphHash && (
                <div className="mt-3 pt-2 border-t border-border flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="truncate">graph_hash: {graphHash}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-3 italic">
                Scenarios are intentionally constructed to support analysis and explanation, not to simulate real incidents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-6 flex flex-col gap-4" style={{ minHeight: '500px' }}>
        <div className="flex-1 rounded-md overflow-hidden border border-border bg-card" style={{ minHeight: '350px' }}>
          <GraphCanvas
            nodes={snapshot?.nodes || []}
            edges={snapshot?.edges || []}
            isLoading={isLoading || isResetting || isReplaying}
            onNodeClick={handleNodeClick}
            currentTime={replayTimestamp}
            replaySpeed={replaySpeed}
            showDebugOverlay={showDebug}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <ReplayControls
              events={events || []}
              onTimestampChange={handleTimestampChange}
              onReset={handleReset}
              onSpeedChange={setReplaySpeed}
            />
          </CardContent>
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
