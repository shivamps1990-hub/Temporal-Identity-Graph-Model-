import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background bg-grid-pattern">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur shadow-2xl">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive animate-pulse">
              <AlertTriangle className="w-12 h-12" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-mono font-bold text-foreground">404</h1>
            <p className="text-lg text-muted-foreground font-mono">
              Identity Node Not Found
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            The requested resource has been decommissioned or never existed in the current timeline.
          </p>

          <Link href="/">
            <Button className="w-full font-mono mt-4">
              Return to Grid
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
