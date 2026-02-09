import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, ArrowRight, ChevronRight, AlertTriangle, Eye, Users, Link2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreatEvidence {
  event_ids: string[];
  first_seen: string;
  last_seen: string;
}

interface DerivedThreat {
  threat_id: string;
  type: "IT_TO_OT_PATH" | "ORPHAN_NHI" | "EXCESSIVE_DELEGATION" | "DORMANT_REACTIVATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  nodes_involved: string[];
  paths: string[][];
  evidence: ThreatEvidence;
}

interface ThreatMapResult {
  timestamp: string | null;
  threats: DerivedThreat[];
  summary: {
    total: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
  };
}

const THREAT_TYPE_LABELS: Record<string, string> = {
  IT_TO_OT_PATH: "IT to OT Identity Path",
  ORPHAN_NHI: "Orphan Non-Human Identity",
  EXCESSIVE_DELEGATION: "Excessive Delegation Chain",
  DORMANT_REACTIVATION: "Dormant Identity Reactivation",
};

const THREAT_TYPE_DESCRIPTIONS: Record<string, string> = {
  IT_TO_OT_PATH: "A continuous identity path exists between IT/Cloud entities and OT devices during the selected time window.",
  ORPHAN_NHI: "A non-human identity has active relationships but no traceable path from a human owner.",
  EXCESSIVE_DELEGATION: "A delegation chain exceeds the safe depth threshold, indicating over-provisioned access.",
  DORMANT_REACTIVATION: "A previously decommissioned identity has been observed with active relationships.",
};

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  CRITICAL: { badge: "bg-red-100 text-red-700 border-red-200", border: "border-l-red-500" },
  HIGH: { badge: "bg-orange-100 text-orange-700 border-orange-200", border: "border-l-orange-500" },
  MEDIUM: { badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-l-amber-500" },
  LOW: { badge: "bg-blue-100 text-blue-700 border-blue-200", border: "border-l-blue-500" },
};

export default function Threats() {
  const [selectedThreat, setSelectedThreat] = useState<DerivedThreat | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: threatMap, isLoading } = useQuery<ThreatMapResult>({
    queryKey: ['/api/analysis/threat-map'],
    refetchInterval: 10000,
  });

  const handleThreatClick = (threat: DerivedThreat) => {
    setSelectedThreat(threat);
    setDrawerOpen(true);
  };

  const summary = threatMap?.summary;
  const threats = threatMap?.threats || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-threats-title">Derived Threat Map</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Threats shown here are derived interpretations of the identity graph at the current point in time.
          They emerge from observed identity paths and temporal overlap, not from static permissions.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="threat-summary">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="text-xs text-muted-foreground mb-1">Total Derived Threats</div>
                <div className="text-3xl font-mono font-semibold" data-testid="text-threat-count">{summary?.total || 0}</div>
              </CardContent>
            </Card>
            {[
              { key: "IT_TO_OT_PATH", label: "IT to OT Paths", icon: ArrowRight },
              { key: "ORPHAN_NHI", label: "Orphan NHIs", icon: Users },
              { key: "EXCESSIVE_DELEGATION", label: "Excessive Delegation", icon: Link2 },
            ].map(item => (
              <Card key={item.key}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </div>
                  <div className="text-3xl font-mono font-semibold">{summary?.by_type?.[item.key] || 0}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {threats.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">No Threats Derived</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  The current graph state does not contain structural patterns that match any threat derivation rules.
                  Load a scenario with known attack chains to see threats.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Click a threat to view the identity path, timing evidence, and supporting events.
                </p>
                <div className="flex gap-1.5">
                  {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(sev => {
                    const count = summary?.by_severity?.[sev] || 0;
                    if (count === 0) return null;
                    const style = SEVERITY_STYLES[sev];
                    return (
                      <Badge key={sev} variant="outline" className={cn("text-[10px] font-mono", style.badge)}>
                        {sev}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                {threats.map((threat) => {
                  const style = SEVERITY_STYLES[threat.severity];
                  return (
                    <Card
                      key={threat.threat_id}
                      className={cn("cursor-pointer hover-elevate border-l-4", style.border)}
                      onClick={() => handleThreatClick(threat)}
                      data-testid={`threat-card-${threat.threat_id}`}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0", style.badge)}>
                                {threat.severity}
                              </Badge>
                              <span className="text-sm font-medium truncate">{THREAT_TYPE_LABELS[threat.type]}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{threat.description}</p>
                            {threat.paths.length > 0 && threat.paths[0].length > 0 && (
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {threat.paths[0].slice(0, 5).map((nodeId, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-[10px] font-mono">{nodeId}</Badge>
                                    {i < Math.min(threat.paths[0].length, 5) - 1 && (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </span>
                                ))}
                                {threat.paths[0].length > 5 && (
                                  <span className="text-[10px] text-muted-foreground">+{threat.paths[0].length - 5} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[440px] border-l border-border bg-card p-0 flex flex-col">
          {selectedThreat && (
            <>
              <div className="p-6 border-b border-border">
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn("font-mono text-xs", SEVERITY_STYLES[selectedThreat.severity].badge)}>
                      {selectedThreat.severity}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-xs">{selectedThreat.type}</Badge>
                  </div>
                  <SheetTitle className="text-lg">{THREAT_TYPE_LABELS[selectedThreat.type]}</SheetTitle>
                  <SheetDescription className="text-sm leading-relaxed mt-2">
                    {THREAT_TYPE_DESCRIPTIONS[selectedThreat.type]}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Why this is considered risky</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedThreat.description}
                    </p>
                  </div>

                  {selectedThreat.paths.length > 0 && selectedThreat.paths[0].length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Identity Path</h4>
                      <div className="bg-muted/50 rounded-md p-3 border border-border">
                        <div className="flex flex-col gap-1">
                          {selectedThreat.paths[0].map((nodeId, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground ml-2" />}
                              <Badge variant={i === selectedThreat.paths[0].length - 1 ? "destructive" : "secondary"} className="font-mono text-xs">
                                {nodeId}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Temporal Validity
                    </h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">First observed</span>
                        <span className="font-mono text-xs">{selectedThreat.evidence.first_seen || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last observed</span>
                        <span className="font-mono text-xs">{selectedThreat.evidence.last_seen || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Supporting Events</h4>
                    <div className="space-y-1">
                      {selectedThreat.evidence.event_ids.slice(0, 8).map(eid => (
                        <div key={eid} className="text-xs font-mono bg-muted/40 p-1.5 rounded border border-border truncate">
                          {eid}
                        </div>
                      ))}
                      {selectedThreat.evidence.event_ids.length > 8 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          + {selectedThreat.evidence.event_ids.length - 8} more events
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted/30 rounded-md p-3 border border-border">
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      This is an analytical interpretation based on identity relationships and timing.
                      It does not indicate malicious activity or policy violation.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
