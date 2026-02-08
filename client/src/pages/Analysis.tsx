import { useState } from "react";
import { useReachability, useBlastRadius } from "@/hooks/use-analysis";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Search, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Analysis() {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");
  const [analyzeReachability, setAnalyzeReachability] = useState(false);
  const [analyzeBlast, setAnalyzeBlast] = useState(false);

  const { data: reachability, isLoading: loadingReachability } = useReachability(
    sourceNode, targetNode, 5, analyzeReachability
  );

  const { data: blastRadius, isLoading: loadingBlast } = useBlastRadius(
    sourceNode, 3, analyzeBlast
  );

  const handleReachabilitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzeReachability(true);
  };

  const handleBlastSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzeBlast(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-mono font-bold tracking-tight mb-2">Graph Analysis</h2>
        <p className="text-muted-foreground">Perform deep-dive analysis on identity relationships and potential attack paths.</p>
      </div>

      <Tabs defaultValue="reachability" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="reachability" className="font-mono text-xs">Path Reachability</TabsTrigger>
          <TabsTrigger value="blast" className="font-mono text-xs">Blast Radius</TabsTrigger>
        </TabsList>

        <TabsContent value="reachability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Path Analysis
              </CardTitle>
              <CardDescription>
                Determine if a compromised source node can laterally move to a target critical asset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReachabilitySearch} className="flex gap-4 items-end">
                <div className="grid w-full gap-2">
                  <Label htmlFor="source">Source Node ID</Label>
                  <Input 
                    id="source" 
                    placeholder="e.g., user-alice" 
                    value={sourceNode}
                    onChange={e => { setSourceNode(e.target.value); setAnalyzeReachability(false); }}
                    className="font-mono"
                  />
                </div>
                <div className="flex items-center pb-3 text-muted-foreground">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <div className="grid w-full gap-2">
                  <Label htmlFor="target">Target Node ID</Label>
                  <Input 
                    id="target" 
                    placeholder="e.g., plc-reactor-core" 
                    value={targetNode}
                    onChange={e => { setTargetNode(e.target.value); setAnalyzeReachability(false); }}
                    className="font-mono"
                  />
                </div>
                <Button type="submit" disabled={loadingReachability} className="min-w-[120px]">
                  {loadingReachability ? "Analyzing..." : "Trace Path"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {reachability && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "p-4 rounded-lg border flex items-center gap-4",
                reachability.found ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"
              )}>
                {reachability.found ? (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <h4 className="font-bold text-lg">
                    {reachability.found ? "Attack Path Detected" : "No Direct Path Found"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {reachability.found 
                      ? "A valid traversal path exists between the specified nodes." 
                      : "Target is isolated from the source within the search depth."}
                  </p>
                </div>
              </div>

              {reachability.paths.map((path, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardHeader className="py-3 bg-muted/30">
                    <CardTitle className="text-sm font-mono text-muted-foreground">
                      Path Variant #{idx + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono">{sourceNode}</Badge>
                      {path.map((segment, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <div className="h-px w-8 bg-border relative">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground uppercase whitespace-nowrap">
                              {segment.label}
                            </span>
                          </div>
                          <Badge variant={sIdx === path.length -1 ? "destructive" : "secondary"} className="font-mono">
                            {segment.target}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Blast Radius Calculation
              </CardTitle>
              <CardDescription>
                Visualize all reachable nodes from a compromised identity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBlastSearch} className="flex gap-4 items-end">
                <div className="grid w-full gap-2">
                  <Label htmlFor="blast-source">Compromised Node ID</Label>
                  <Input 
                    id="blast-source" 
                    placeholder="e.g., service-account-deployer" 
                    value={sourceNode}
                    onChange={e => { setSourceNode(e.target.value); setAnalyzeBlast(false); }}
                    className="font-mono"
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={loadingBlast} className="min-w-[120px]">
                  {loadingBlast ? "Calculating..." : "Calculate Impact"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {blastRadius && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in zoom-in-95 duration-500">
              {blastRadius.reachable_nodes.map((node) => (
                <Card key={node.id} className="border-border/50 hover:border-accent transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="font-mono text-xs">{node.distance} Hops</Badge>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded",
                        node.risk > 7 ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        RISK: {node.risk.toFixed(1)}
                      </span>
                    </div>
                    <CardTitle className="font-mono text-sm pt-2 truncate" title={node.id}>
                      {node.id}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
