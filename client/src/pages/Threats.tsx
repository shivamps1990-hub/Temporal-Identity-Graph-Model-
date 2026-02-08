import { useThreats } from "@/hooks/use-analysis";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Fingerprint, Network, Terminal, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Threats() {
  const { data: threats, isLoading } = useThreats();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      default: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getThreatIcon = (type: string) => {
    if (type === "over-delegation") return <Fingerprint className="w-5 h-5" />;
    if (type === "it-ot-bridge") return <Network className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-mono font-bold tracking-tight mb-2">Active Threats</h2>
        <p className="text-muted-foreground">Automated detection of security anomalies and graph policy violations.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-lg bg-card/50 border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {threats?.map((threat, idx) => (
            <Card key={idx} className="flex flex-col border-border/50 hover:border-border transition-all hover:shadow-lg hover:shadow-black/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={cn("font-mono font-bold", getSeverityColor(threat.severity))}>
                    {threat.severity}
                  </Badge>
                  <div className="text-muted-foreground">
                    {getThreatIcon(threat.type)}
                  </div>
                </div>
                <CardTitle className="text-lg font-medium">{threat.type.replace(/-/g, ' ').toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {threat.description}
                </p>
                
                <div className="space-y-2">
                  <div className="text-xs font-mono text-muted-foreground uppercase">Involved Nodes</div>
                  <div className="flex flex-wrap gap-2">
                    {threat.involved_nodes.slice(0, 3).map(node => (
                      <Badge key={node} variant="secondary" className="font-mono text-[10px] truncate max-w-[150px]">
                        {node}
                      </Badge>
                    ))}
                    {threat.involved_nodes.length > 3 && (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        +{threat.involved_nodes.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-border/50 bg-muted/20">
                <div className="w-full flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    {threat.evidence.length} Evidence Logs
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs hover:text-primary">
                    View Graph Context
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {(!threats || threats.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <ShieldCheck className="w-12 h-12 mb-4 text-green-500/50" />
              <h3 className="text-lg font-medium text-foreground">No Threats Detected</h3>
              <p className="text-sm mt-1">System appears to be operating within baseline parameters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
