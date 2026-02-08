import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function About() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary mono-font">About the Author & Research</h1>
        <p className="text-xl text-muted-foreground">
          Temporal Identity Graph Analysis for Non-Human Identities (NHIs)
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-2xl mono-font">Shivam Pratap Singh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              Identity and Access Management (IAM) practitioner with over a decade of experience designing, implementing, and operating IAM solutions in large enterprise environments.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              "This research prototype is the result of practical observations made while operating IAM systems under real-world constraints, audits, and incident scenarios."
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl mono-font">Expertise Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
              <li>IAM Governance & Access Control</li>
              <li>Incident Investigation & Risk Control</li>
              <li>Azure AD / Entra ID, Keycloak, SAP</li>
              <li>SCIM Provisioning & App Onboarding</li>
              <li>Conditional Access Frameworks</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-primary/10" />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mono-font">Research Motivation</h2>
        <div className="grid gap-6">
          <Card className="bg-muted/10 border-none shadow-none">
            <CardContent className="pt-6">
              <p className="leading-relaxed text-muted-foreground">
                Traditional IAM tools primarily answer "Who has access right now?" but fail to capture historical context. 
                Real incidents exploit historical or transient identity paths that may not be visible in current snapshots. 
                Non-human identities (tokens, service accounts) operate at different time scales and require different modeling approaches.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mono-font">Research Contributions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-bold mb-2 text-primary">Temporal Graph Model</h3>
            <p className="text-sm text-muted-foreground">Graph-based representation with explicit temporal bounds (valid_from, valid_to).</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-bold mb-2 text-primary">Event-Sourced Analysis</h3>
            <p className="text-sm text-muted-foreground">Append-only event store for deterministic reconstruction of state at any point.</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-bold mb-2 text-primary">Deterministic Risk</h3>
            <p className="text-sm text-muted-foreground">Rule-based risk annotations that do not mutate the underlying identity graph.</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-bold mb-2 text-primary">Explainable Decisions</h3>
            <p className="text-sm text-muted-foreground">Policy evaluation providing evidence paths for every access decision.</p>
          </div>
        </div>
      </section>

      <footer className="pt-8 text-xs text-muted-foreground border-t border-primary/10">
        <p>This is a research prototype and does not represent a commercial product. All security logic is rule-based and deterministic.</p>
      </footer>
    </div>
  );
}
