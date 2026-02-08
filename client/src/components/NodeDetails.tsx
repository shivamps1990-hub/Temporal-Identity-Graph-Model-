import { type GraphNode } from "@shared/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, ShieldAlert, Cpu, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface NodeDetailsProps {
  node: GraphNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodeDetails({ node, open, onOpenChange }: NodeDetailsProps) {
  if (!node) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] border-l border-border bg-card/95 backdrop-blur-sm p-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                {node.type}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {node.platform}
              </Badge>
            </div>
            <SheetTitle className="font-mono text-xl break-all">{node.id}</SheetTitle>
            <SheetDescription className="flex items-center gap-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${node.lifecycle_state === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`} />
              {node.lifecycle_state}
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 rounded-md bg-muted/50 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Risk Score
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {node.risk_score.toFixed(1)}
              </div>
            </div>
            <div className="p-3 rounded-md bg-muted/50 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Connectivity
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                High
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Temporal Metadata
              </h4>
              <div className="space-y-2 text-sm font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>First Seen</span>
                  <span className="text-foreground">{format(new Date(node.first_seen), "MMM d, HH:mm:ss")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Seen</span>
                  <span className="text-foreground">{format(new Date(node.last_seen), "MMM d, HH:mm:ss")}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3">Provenance</h4>
              <div className="space-y-2">
                {node.provenance.slice(0, 5).map((eventId) => (
                  <div key={eventId} className="text-xs font-mono bg-muted/30 p-2 rounded border border-border/50 truncate">
                    Event: {eventId}
                  </div>
                ))}
                {node.provenance.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    + {node.provenance.length - 5} more events
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
