import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { ArrowRight, Network, Clock, Shield, Layers, GitBranch, Zap, ChevronDown, Code2 } from "lucide-react";

function MathBlock({ title, formula, explanation, codeRef }: { title: string; formula: string; explanation: string; codeRef?: string }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full text-left py-2 group" data-testid={`toggle-math-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        Show formal definition
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 space-y-3 pb-4">
          <div className="font-mono text-sm bg-muted/50 border border-border rounded-md p-4 whitespace-pre-wrap leading-relaxed" data-testid={`math-formula-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {formula}
          </div>
          {codeRef && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              <Code2 className="w-3 h-3" />
              <span>Implementation: {codeRef}</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MathSymbol({ symbol, meaning }: { symbol: string; meaning: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="font-mono text-primary cursor-help border-b border-dotted border-primary/40">{symbol}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs max-w-[200px]">{meaning}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <section className="relative px-8 py-16 md:py-24 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="font-mono text-[10px] tracking-wider" data-testid="badge-prototype">
            Research Prototype
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight" data-testid="text-research-title">
            Temporal Identity Graph Model for Analyzing Non-Human Identity Paths in IT-OT Convergent Environments
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A graph-based approach to modeling how identity relationships evolve over time,
            enabling path-based risk analysis across cloud, CI/CD, Kubernetes, and operational technology systems.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <Link href="/dashboard">
              <Button size="lg" data-testid="button-explore-dashboard">
                Explore Interactive Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" data-testid="button-about-author">
                About the Author
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-8 py-12 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">The Problem</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Traditional IAM tools answer "who has access right now?" but fail to capture the
            historical context that matters for security investigations and risk assessment.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Temporal Blindness</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Static permission snapshots miss transient access paths that attackers
                exploit. Access relationships that existed hours ago may still pose risk.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">NHI Complexity</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Non-human identities (tokens, service accounts, certificates) operate at
                different time scales and lifecycle patterns than human users.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">IT-OT Convergence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Identity paths that bridge IT and OT environments create critical risk vectors
                that span organizational boundaries and trust domains.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      <section className="px-8 py-12 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Research Approach</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            This prototype demonstrates a temporal graph model where identity relationships
            carry explicit time bounds, enabling analysis at any point in history.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/15">
            <CardHeader className="pb-2 gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Network className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-sm">Temporal Identity Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Identities and relationships are modeled as a property graph with temporal metadata
                (first_seen, last_seen). The graph state can be reconstructed at any timestamp through
                deterministic event replay.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/15">
            <CardHeader className="pb-2 gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-sm">Path-Based Risk Derivation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Risk is computed from the structure of identity paths, not from static permissions.
                Threats are derived by analyzing reachability, blast radius, and temporal coexistence
                of identity relationships.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/15">
            <CardHeader className="pb-2 gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-sm">Unified Identity Model</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                IT identities (users, service accounts), cloud workloads, CI/CD pipelines, and
                OT devices (PLCs, HMIs) are represented in a single graph framework, enabling
                cross-domain analysis.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/15">
            <CardHeader className="pb-2 gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-sm">Explainability over Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The system prioritizes understanding why access existed and what paths were reachable,
                rather than predicting future behavior. All findings include traceable evidence
                paths back to source events.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      <section className="px-8 py-12 max-w-5xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-center">Research Contributions</h2>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          <AccordionItem value="temporal">
            <AccordionTrigger className="text-sm">Temporal Identity Graph Model</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              A graph-based representation of identities and relationships with explicit temporal bounds
              (first_seen, last_seen) that captures how access evolves over time. The model supports
              deterministic reconstruction of identity state at any historical timestamp.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="replay">
            <AccordionTrigger className="text-sm">Event-Sourced, Replayable Analysis</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              An append-only event store that enables deterministic reconstruction of identity state
              at any point in time. Events are normalized across heterogeneous identity sources into
              a unified schema, enabling cross-platform analysis.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="risk">
            <AccordionTrigger className="text-sm">Deterministic Risk Annotation</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Risk annotations that are computed from explicit structural rules and temporal patterns.
              Annotations do not mutate the underlying graph and can be independently verified
              and reproduced.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="explainability">
            <AccordionTrigger className="text-sm">Focus on Explainability</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              Every finding is accompanied by a complete evidence chain: the identity path, the events
              that created each relationship, and the time windows during which the path was active.
              No black-box scoring or opaque ML predictions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ai-usage">
            <AccordionTrigger className="text-sm">Use of Artificial Intelligence</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm space-y-2">
              <p>AI-assisted tools were used for: code scaffolding, UI layout assistance, and documentation drafting.</p>
              <p>AI is <strong>NOT</strong> used for: security decision-making, risk scoring, threat prediction, or policy enforcement.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      <section className="px-8 py-12 max-w-5xl mx-auto w-full space-y-6">
        <Collapsible>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-math-heading">Formal Model and Mathematical Foundations</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              The formal definitions below map directly to implemented code. Each formula corresponds to
              a specific function in the graph engine.
            </p>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2" data-testid="button-toggle-math">
                <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                Show Mathematical Foundations
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="mt-8 space-y-8 max-w-3xl mx-auto">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">1. Identity Graph Definition</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The system models identity as a graph. Nodes represent identities or resources.
                  Edges represent observed relationships. Time determines when a node or relationship is considered active.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <MathSymbol symbol="G" meaning="The identity graph containing all nodes and edges" /> = (<MathSymbol symbol="V" meaning="Set of vertices (identities and resources)" />, <MathSymbol symbol="E" meaning="Set of directed, labeled edges (relationships)" />, <MathSymbol symbol="\u03C4" meaning="Temporal function assigning validity intervals" />)
                </p>
                <MathBlock
                  title="Identity Graph Definition"
                  formula={`G = (V, E, \u03C4)

Where:
  V = V_I \u222A V_R
    is the set of vertices representing identities and resources

  E \u2286 V \u00D7 V \u00D7 \u039B
    is the set of directed, labeled edges

  \u039B = {AUTHENTICATES_WITH, ASSUMES, ACCESSES, COMMUNICATES_WITH, CONTROLS}
    is the finite set of relationship labels

  \u03C4 : (V \u222A E) \u2192 T \u00D7 T
    assigns temporal validity intervals [first_seen, last_seen]`}
                  explanation="The graph captures all observed identity relationships with temporal bounds."
                  codeRef="server/graph_engine.ts \u2014 GraphEngine class (nodes Map, edges Map)"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">2. Temporal Semantics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This defines the identity graph at a specific moment in time.
                  Only identities and relationships active at time <MathSymbol symbol="T" meaning="A specific point in time for graph projection" /> are included.
                  This enables point-in-time reconstruction and forensic reasoning.
                </p>
                <MathBlock
                  title="Temporal Projection"
                  formula={`G(T) = (V_T, E_T)

Where:
  V_T = { v \u2208 V | \u03C4(v).first_seen \u2264 T }
  E_T = { e \u2208 E | \u03C4(e).first_seen \u2264 T }`}
                  explanation="The temporal projection filters the graph to show only elements that existed at time T."
                  codeRef="server/graph_engine.ts \u2014 getFilteredState(atTimestamp)"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">3. Event-Sourced Graph Update</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Identity state is built by replaying events, not by mutating a database.
                  Replaying the same events always produces the same graph.
                  <MathSymbol symbol="U" meaning="Deterministic, idempotent update function" /> is deterministic and idempotent.
                </p>
                <MathBlock
                  title="Update Function"
                  formula={`U(G, e_t) \u2192 G\u2032

Where e_t is a normalized identity event at time t.

Algorithm:
  If v \u2209 V:
    create v with \u03C4.first_seen = t
  \u03C4(v).last_seen = max(\u03C4(v).last_seen, t)

  For each relationship r in e_t:
    If (v, r.target, r.label) \u2209 E:
      create edge with \u03C4.first_seen = t
    \u03C4(edge).last_seen = max(\u03C4(edge).last_seen, t)`}
                  explanation="Events are replayed in order. Each event creates or updates nodes and edges with temporal metadata."
                  codeRef="server/graph_engine.ts \u2014 processEvent(event)"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">4. Reachability (Path-Based Access)</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An identity can reach a resource if a continuous chain of relationships exists at time <MathSymbol symbol="T" meaning="Point-in-time for reachability check" />.
                  This captures indirect and transitive access.
                </p>
                <MathBlock
                  title="Reachability"
                  formula={`\u2203 p = (v\u2080, v\u2081, \u2026, v\u2096) such that:
  v\u2080 = i (source identity),
  v\u2096 = r (target resource),
  \u2200 j, (v\u2C7C, v\u2C7C\u208A\u2081) \u2208 E_T`}
                  explanation="A path exists when every consecutive pair of nodes is connected by an active edge at time T."
                  codeRef="server/graph_engine.ts \u2014 findPaths(sourceId, targetId, maxHops, atTimestamp)"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">5. Blast Radius</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Blast radius is the set of identities and resources reachable from a compromised identity
                  within <MathSymbol symbol="k" meaning="Maximum number of hops from the source" /> steps.
                  This is computed structurally, not heuristically.
                </p>
                <MathBlock
                  title="Blast Radius"
                  formula={`BR(i, k, T) = { v \u2208 V_T | dist(i, v) \u2264 k }

Where dist is the shortest path length in G(T).`}
                  explanation="All nodes within k directed hops from the source identity at time T."
                  codeRef="server/graph_engine.ts \u2014 calculateBlastRadius(sourceId, maxHops, atTimestamp)"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">6. Non-Human and OT Identity Modeling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  OT and non-human identities are inferred from observed interactions,
                  enabling reasoning across IT, cloud, and OT domains.
                </p>
                <MathBlock
                  title="NHI Modeling"
                  formula={`v \u2208 V_I may be of type:
  HUMAN | WORKLOAD | SERVICE_ACCOUNT | PLC | HMI

Node type determines platform context:
  enterprise | aws | ci_cd | k8s | ot`}
                  explanation="Node types capture the heterogeneous identity landscape spanning IT and OT."
                  codeRef="shared/schema.ts \u2014 NodeTypes, NodePlatforms"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">7. Non-Claims (Formal Boundary)</h3>
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      This model does not define:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><span className="text-destructive">&#x2022;</span> attack detection</li>
                      <li className="flex items-center gap-2"><span className="text-destructive">&#x2022;</span> likelihood estimation</li>
                      <li className="flex items-center gap-2"><span className="text-destructive">&#x2022;</span> probabilistic inference</li>
                      <li className="flex items-center gap-2"><span className="text-destructive">&#x2022;</span> enforcement decisions</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section className="px-8 py-10 max-w-3xl mx-auto w-full text-center space-y-4">
        <div className="p-6 rounded-md bg-primary/5 border border-primary/15">
          <p className="text-base italic text-foreground leading-relaxed">
            "Identity security is not about who has permission. It is about what paths exist, when they exist, and what they can reach."
          </p>
        </div>
      </section>

      <Separator className="max-w-5xl mx-auto" />

      <section className="px-8 py-8 max-w-5xl mx-auto w-full space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-center">Scope and Responsible Use</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed text-center">
              This system is a research prototype intended for education and analytical experimentation.
              All datasets are synthetic. No real credentials, systems, or environments are represented.
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="px-8 py-6 border-t border-border max-w-5xl mx-auto w-full">
        <div className="grid gap-4 md:grid-cols-2 text-xs text-muted-foreground">
          <div>
            <h4 className="font-semibold mb-1 uppercase tracking-wider text-[10px]">Ethics & Responsible Use</h4>
            <p>No real credentials used. Synthetic datasets only. Intended for research, education, and analytical experimentation.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1 uppercase tracking-wider text-[10px]">Attribution</h4>
            <p>Concepts influenced by temporal graph theory, event-sourced design, and formal access control models (RBAC/ABAC).</p>
          </div>
        </div>
        <p className="text-center pt-4 text-xs text-muted-foreground opacity-60">
          Licensed under Apache 2.0. This is a research prototype and does not represent a commercial product.
        </p>
      </footer>
    </div>
  );
}
