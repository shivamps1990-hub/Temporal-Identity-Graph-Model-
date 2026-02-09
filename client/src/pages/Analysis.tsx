import { useState, useCallback, useMemo } from "react";
import { useReachability, useBlastRadius } from "@/hooks/use-analysis";
import { useGraphSnapshot } from "@/hooks/use-graph";
import { GraphCanvas } from "@/components/GraphCanvas";
import { ReplayControls } from "@/components/ReplayControls";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, Search, Zap, ChevronRight, Download, Info, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Analysis() {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");
  const [maxHops, setMaxHops] = useState(5);
  const [blastSource, setBlastSource] = useState("");
  const [blastDepth, setBlastDepth] = useState(3);
  const [activeTab, setActiveTab] = useState<"path" | "blast">("path");
  const [runReachability, setRunReachability] = useState(false);
  const [runBlast, setRunBlast] = useState(false);
  const [replayTimestamp, setReplayTimestamp] = useState<string | null>(null);
  const [selectedPathIdx, setSelectedPathIdx] = useState(0);

  const { data: snapshot } = useGraphSnapshot(replayTimestamp);
  const { data: events } = useQuery<{ event_id: string; timestamp: string }[]>({
    queryKey: ['/api/events'],
  });

  const { data: reachability, isLoading: loadingReach } = useReachability(
    sourceNode, targetNode, maxHops, runReachability, replayTimestamp
  );

  const { data: blastRadius, isLoading: loadingBlast } = useBlastRadius(
    blastSource, blastDepth, runBlast, replayTimestamp
  );

  const nodeList = useMemo(() => (snapshot?.nodes || []).map(n => n.id).sort(), [snapshot]);

  const handlePathSearch = () => {
    setRunReachability(false);
    setTimeout(() => setRunReachability(true), 50);
    setSelectedPathIdx(0);
  };

  const handleBlastSearch = () => {
    setRunBlast(false);
    setTimeout(() => setRunBlast(true), 50);
  };

  const handleTimestampChange = useCallback((ts: string | null) => {
    setReplayTimestamp(ts);
    setRunReachability(false);
    setRunBlast(false);
  }, []);

  const highlightedPath = useMemo(() => {
    if (activeTab === "path" && reachability?.found && reachability.paths[selectedPathIdx]) {
      return reachability.paths[selectedPathIdx].map((seg: any) => ({
        source: seg.source,
        target: seg.target,
        label: seg.label,
      }));
    }
    return null;
  }, [activeTab, reachability, selectedPathIdx]);

  const highlightedBlast = useMemo(() => {
    if (activeTab === "blast" && blastRadius?.reachable_nodes) {
      return {
        source: blastSource,
        nodes: blastRadius.reachable_nodes as { id: string; distance: number; risk: number; type?: string }[],
      };
    }
    return null;
  }, [activeTab, blastRadius, blastSource]);

  const handleExportSnapshot = () => {
    const ts = replayTimestamp ? `?timestamp=${encodeURIComponent(replayTimestamp)}` : '';
    window.open(`/export/graph-snapshot${ts}`, '_blank');
  };

  const handleExportPathEvidence = () => {
    if (!reachability?.found || !reachability.paths[selectedPathIdx]) return;
    const path = reachability.paths[selectedPathIdx];
    const nodeSequence = [path[0].source, ...path.map((s: any) => s.target)];
    fetch('/export/path-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: nodeSequence, timestamp: replayTimestamp })
    })
    .then(res => res.json())
    .then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `path_evidence_${sourceNode}_to_${targetNode}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const blastByDistance = useMemo(() => {
    if (!blastRadius?.reachable_nodes) return new Map<number, any[]>();
    const map = new Map<number, any[]>();
    for (const n of blastRadius.reachable_nodes) {
      if (!map.has(n.distance)) map.set(n.distance, []);
      map.get(n.distance)!.push(n);
    }
    return map;
  }, [blastRadius]);

  const blastByType = useMemo(() => {
    if (!blastRadius?.reachable_nodes) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const n of blastRadius.reachable_nodes) {
      const t = n.type || 'UNKNOWN';
      map.set(t, (map.get(t) || 0) + 1);
    }
    return map;
  }, [blastRadius]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-analysis-title">Path & Blast Radius Analysis</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Explore identity paths and blast radius at any point in time.
              All results are derived from the temporal graph state at the selected timestamp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportSnapshot} data-testid="button-export-snapshot">
                  <Download className="w-4 h-4 mr-1.5" />
                  Export Graph Snapshot
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">Download the identity graph state at the selected time for offline analysis.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex gap-1 mb-4">
          <Button
            variant={activeTab === "path" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("path")}
            data-testid="tab-path"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Path Explorer
          </Button>
          <Button
            variant={activeTab === "blast" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("blast")}
            data-testid="tab-blast"
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Blast Radius
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-0">
        <div className="w-[380px] shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
          {activeTab === "path" && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Path Explorer</CardTitle>
                  <CardDescription className="text-xs">
                    Find identity paths between a source and target at the current time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Source Identity</Label>
                    <Select value={sourceNode} onValueChange={v => { setSourceNode(v); setRunReachability(false); }}>
                      <SelectTrigger className="font-mono text-xs" data-testid="select-path-source">
                        <SelectValue placeholder="Select source node" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeList.map(n => <SelectItem key={n} value={n} className="font-mono text-xs">{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Target Identity</Label>
                    <Select value={targetNode} onValueChange={v => { setTargetNode(v); setRunReachability(false); }}>
                      <SelectTrigger className="font-mono text-xs" data-testid="select-path-target">
                        <SelectValue placeholder="Select target node" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeList.map(n => <SelectItem key={n} value={n} className="font-mono text-xs">{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Path Length: {maxHops}</Label>
                    <Slider value={[maxHops]} min={2} max={10} step={1} onValueChange={v => setMaxHops(v[0])} />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handlePathSearch}
                    disabled={!sourceNode || !targetNode || loadingReach}
                    data-testid="button-show-paths"
                  >
                    {loadingReach ? "Searching..." : "Show Paths"}
                  </Button>
                </CardContent>
              </Card>

              {reachability && (
                <Card data-testid="panel-path-results">
                  <CardContent className="pt-4 space-y-3">
                    <div className={cn(
                      "p-3 rounded-md border text-sm",
                      reachability.found ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
                    )}>
                      {reachability.found
                        ? `${reachability.paths.length} path(s) found from ${sourceNode} to ${targetNode}`
                        : "No valid identity path exists at this time."}
                    </div>

                    {reachability.found && reachability.paths.map((path: any[], idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-md border cursor-pointer hover-elevate",
                          idx === selectedPathIdx ? "border-primary bg-primary/5" : "border-border"
                        )}
                        onClick={() => setSelectedPathIdx(idx)}
                        data-testid={`path-result-${idx}`}
                      >
                        <div className="text-xs text-muted-foreground mb-2">Path {idx + 1} of {reachability.paths.length}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[10px]">{path[0]?.source}</Badge>
                          {path.map((seg: any, i: number) => (
                            <span key={i} className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              <Badge
                                variant={i === path.length - 1 ? "destructive" : "secondary"}
                                className="font-mono text-[10px]"
                              >
                                {seg.target}
                              </Badge>
                            </span>
                          ))}
                        </div>
                        {path[0]?.first_seen && (
                          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Active: {path[0].first_seen?.substring(0, 16)} - {path[path.length - 1]?.last_seen?.substring(0, 16)}
                          </div>
                        )}
                      </div>
                    ))}

                    {reachability.found && (
                      <>
                        <Separator />
                        <div className="bg-muted/30 rounded-md p-3 border border-border">
                          <p className="text-[10px] text-muted-foreground leading-relaxed flex items-center gap-1.5">
                            <Info className="w-3 h-3 shrink-0" />
                            This path exists because all identity relationships were active during the selected time window.
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full" onClick={handleExportPathEvidence} data-testid="button-export-path">
                              <Download className="w-4 h-4 mr-1.5" />
                              Export Path Evidence
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-[200px]">Download the identity path and event evidence shown in this visualization.</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeTab === "blast" && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Blast Radius</CardTitle>
                  <CardDescription className="text-xs">
                    Calculate all identities reachable from a compromised source node.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Source Identity</Label>
                    <Select value={blastSource} onValueChange={v => { setBlastSource(v); setRunBlast(false); }}>
                      <SelectTrigger className="font-mono text-xs" data-testid="select-blast-source">
                        <SelectValue placeholder="Select source node" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeList.map(n => <SelectItem key={n} value={n} className="font-mono text-xs">{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Depth: {blastDepth}</Label>
                    <Slider value={[blastDepth]} min={1} max={6} step={1} onValueChange={v => setBlastDepth(v[0])} />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleBlastSearch}
                    disabled={!blastSource || loadingBlast}
                    data-testid="button-compute-blast"
                  >
                    {loadingBlast ? "Computing..." : "Compute Blast Radius"}
                  </Button>
                </CardContent>
              </Card>

              {blastRadius && (
                <Card data-testid="panel-blast-results">
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-md bg-muted/50 border border-border">
                        <div className="text-[10px] text-muted-foreground">Reachable</div>
                        <div className="text-xl font-mono font-semibold" data-testid="text-blast-count">
                          {blastRadius.reachable_nodes?.length || 0}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-md bg-muted/50 border border-border">
                        <div className="text-[10px] text-muted-foreground">Max Depth</div>
                        <div className="text-xl font-mono font-semibold">
                          {blastRadius.reachable_nodes?.length > 0
                            ? Math.max(...blastRadius.reachable_nodes.map((n: any) => n.distance))
                            : 0}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-1.5">By Identity Type</div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(blastByType.entries()).map(([type, count]) => (
                          <Badge key={type} variant="secondary" className="text-[10px] font-mono">
                            {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {Array.from(blastByDistance.entries()).map(([dist, nodes]) => (
                      <div key={dist}>
                        <div className="text-xs text-muted-foreground mb-1">Hop {dist}</div>
                        <div className="space-y-1">
                          {nodes.map((n: any) => (
                            <div
                              key={n.id}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border cursor-pointer hover-elevate"
                              onClick={() => {
                                setSourceNode(blastSource);
                                setTargetNode(n.id);
                                setActiveTab("path");
                                setRunReachability(false);
                                setTimeout(() => setRunReachability(true), 100);
                              }}
                              data-testid={`blast-node-${n.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-[10px]">{n.id}</Badge>
                                <span className="text-[10px] text-muted-foreground">{n.type || ''}</span>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">risk: {n.risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="bg-muted/30 rounded-md p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground leading-relaxed flex items-center gap-1.5">
                        <Info className="w-3 h-3 shrink-0" />
                        This highlight is derived from identity relationships active at this time.
                        Click any node to trace the path from source.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0 rounded-none overflow-hidden border-b border-border">
              <GraphCanvas
                nodes={snapshot?.nodes || []}
                edges={snapshot?.edges || []}
                isLoading={false}
                highlightedPath={highlightedPath}
                highlightedBlast={highlightedBlast}
                currentTime={replayTimestamp}
              />
            </div>
            {replayTimestamp && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-card/90 backdrop-blur border border-border rounded-md px-3 py-1.5 shadow-sm">
                <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-primary" />
                  Viewing at: {replayTimestamp.substring(0, 19)}
                </div>
              </div>
            )}
          </div>
          <Card className="rounded-none border-x-0 border-b-0">
            <CardContent className="p-0">
              <ReplayControls
                events={events || []}
                onTimestampChange={handleTimestampChange}
                onReset={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
