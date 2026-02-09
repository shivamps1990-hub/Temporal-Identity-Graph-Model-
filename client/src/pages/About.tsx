import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import shivamPhoto from "@/assets/images/shivam.png";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <Avatar className="w-48 h-48 border-2 border-primary/20 shadow-xl">
          <AvatarImage src={shivamPhoto} alt="Shivam Pratap Singh" className="object-cover" />
          <AvatarFallback className="text-4xl">SS</AvatarFallback>
        </Avatar>
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-primary mono-font">Shivam Pratap Singh</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Identity and Access Management (IAM) practitioner with more than a decade of experience designing, implementing, and operating IAM and access governance solutions in large enterprise environments.
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.linkedin.com/in/shivam-pratap-singh/" target="_blank" rel="noopener noreferrer">
                LinkedIn Profile
              </a>
            </Button>
            <Link href="/">
              <Button size="sm">
                Explore Interactive Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl mono-font">Professional Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              His professional background includes hands-on responsibility for IAM governance frameworks, access control operations, audit and compliance activities, security incident investigation, and the delivery of identity platforms across cloud, on-prem, and hybrid environments.
            </p>
            <p className="text-sm leading-relaxed italic text-muted-foreground">
              "This application and the associated research prototype are the result of practical observations made while operating IAM systems under real-world constraints, audits, and incident scenarios."
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl mono-font">Core Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-xs space-y-2 text-muted-foreground">
              <li>IAM governance and access control frameworks</li>
              <li>Recertification, reconciliation, and audit readiness</li>
              <li>Incident investigation related to access control violations</li>
              <li>Conditional Access and risk-based access controls</li>
              <li>SCIM provisioning and enterprise application onboarding</li>
              <li>Integration: SAP, Azure AD / Entra ID, Keycloak, etc.</li>
              <li>Team leadership (10–15 IAM/WAM engineers)</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-primary/10" />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mono-font">Research Motivation</h2>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Traditional identity and access management tools primarily answer the question: <strong>"Who has access right now?"</strong> but fail to capture the historical context that matters for security.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Real incidents exploit historical or transient identity paths that may not be visible in current permission snapshots. Attackers leverage expired credentials, revoked trust relationships, and temporary access grants that were never properly decommissioned.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Non-human identities (tokens, service accounts, certificates, OT identities) require different modeling approaches because they operate at different time scales and have different lifecycle patterns.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mono-font">Research Overview</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-muted/30 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Temporal Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Identities and relationships modeled with explicit time bounds.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Path-Based Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Risk computed from identity paths, not static permissions.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Unified Model</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">IT, cloud, CI/CD, and OT identities in a single framework.</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="p-6 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <p className="text-lg font-mono text-primary">
            "Identity security is not about who has permission. It is about what paths exist, when they exist, and what they can reach."
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mono-font">Research Contribution</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="temporal">
            <AccordionTrigger className="mono-font text-primary">Temporal Identity Graph Model</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              A graph-based representation of identities and relationships with explicit temporal bounds (valid_from, valid_to) that captures how access evolves over time.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="replay">
            <AccordionTrigger className="mono-font text-primary">Event-sourced, replayable analysis</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              An append-only event store that enables deterministic reconstruction of identity state at any point in time.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="risk">
            <AccordionTrigger className="mono-font text-primary">Deterministic risk annotation</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Risk annotations that are computed from explicit rules and do not mutate the underlying graph.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="explainability">
            <AccordionTrigger className="mono-font text-primary">Focus on explainability over prediction</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              The system prioritizes understanding why access was granted rather than predicting future behavior. Provides explanations with traceable evidence paths.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ai-usage">
            <AccordionTrigger className="mono-font text-primary">Use of Artificial Intelligence</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm space-y-2">
              <p>AI-assisted tools were used for: Code scaffolding, UI layout assistance, and documentation drafting.</p>
              <p>AI is <strong>NOT</strong> used for: Security decision-making, risk scoring, threat prediction, or policy enforcement.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <footer className="pt-8 text-xs text-muted-foreground border-t border-primary/10 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-bold mb-1 uppercase tracking-tighter">Ethics & Responsible Use</h4>
            <p>No real credentials used. Synthetic datasets only. Intended for research, education, and analytical experimentation.</p>
          </div>
          <div>
            <h4 className="font-bold mb-1 uppercase tracking-tighter">Attribution</h4>
            <p>Concepts influenced by temporal graph theory, event-sourced design, and formal access control models (RBAC/ABAC).</p>
          </div>
        </div>
        <p className="text-center pt-4 opacity-50">Licensed under Apache 2.0. This is a research prototype and does not represent a commercial product.</p>
      </footer>
    </div>
  );
}
