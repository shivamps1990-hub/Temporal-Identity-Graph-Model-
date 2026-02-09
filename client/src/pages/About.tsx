import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, Scale } from "lucide-react";
import shivamPhoto from "@/assets/images/shivam.png";

export default function About() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="max-w-4xl mx-auto w-full py-10 px-8 space-y-10 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <Avatar className="w-40 h-40 border border-border shadow-sm shrink-0">
            <AvatarImage src={shivamPhoto} alt="Shivam Pratap Singh" className="object-cover" />
            <AvatarFallback className="text-3xl">SS</AvatarFallback>
          </Avatar>
          <div className="space-y-4 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-author-name">Shivam Pratap Singh</h1>
              <p className="text-sm text-muted-foreground mt-1">Author & Researcher</p>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Identity and Access Management (IAM) practitioner with more than a decade of experience designing,
              implementing, and operating IAM and access governance solutions in large enterprise environments.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.linkedin.com/in/shivam-pratap-singh-058a692b/" target="_blank" rel="noopener noreferrer" data-testid="link-linkedin">
                  LinkedIn Profile
                </a>
              </Button>
              <Link href="/dashboard">
                <Button size="sm" data-testid="button-goto-dashboard">
                  Explore Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <Separator />

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Professional Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                His professional background includes hands-on responsibility for IAM governance frameworks,
                access control operations, audit and compliance activities, security incident investigation,
                and the delivery of identity platforms across cloud, on-prem, and hybrid environments.
              </p>
              <p className="text-sm leading-relaxed italic text-muted-foreground">
                "This application and the associated research prototype are the result of practical observations
                made while operating IAM systems under real-world constraints, audits, and incident scenarios."
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Core Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-xs space-y-2 text-muted-foreground">
                <li>IAM governance and access control frameworks</li>
                <li>Recertification, reconciliation, and audit readiness</li>
                <li>Incident investigation related to access control violations</li>
                <li>Conditional Access and risk-based access controls</li>
                <li>SCIM provisioning and enterprise application onboarding</li>
                <li>Integration: SAP, Azure AD / Entra ID, Keycloak, etc.</li>
                <li>Team leadership (10-15 IAM/WAM engineers)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Domain Experience</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Identity Governance", "Access Management", "Cloud IAM", "Privileged Access",
              "OT Security", "SCIM", "RBAC/ABAC", "Zero Trust", "Azure AD / Entra ID",
              "Keycloak", "SAP Security", "Compliance & Audit"
            ].map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs font-mono">
                {skill}
              </Badge>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">About This Project</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This research prototype was developed to demonstrate temporal identity graph concepts through a
                working, interactive system that practitioners can use to explore identity path analysis firsthand.
                All datasets are synthetic. No real credentials, systems, or environments are represented.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4" data-testid="section-license">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-tight">License and Usage</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This research prototype is released under the Apache License, Version 2.0.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You may use, modify, and distribute this software in accordance with the terms of the license.
                The software is provided on an "AS IS" basis, without warranties or conditions of any kind.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This application is intended for research, education, and analytical experimentation.
                It is not a production system and does not provide security guarantees.
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" data-testid="link-license-text">
                    View full license text
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-mono text-muted-foreground" data-testid="text-copyright">
                Copyright &copy; 2026 Shivam
              </p>
              <p className="text-sm font-mono text-muted-foreground mt-1">
                Licensed under the Apache License, Version 2.0.
              </p>
            </CardContent>
          </Card>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground py-2">
              <ChevronDown className="w-3.5 h-3.5" />
              Notice
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This product includes software developed for open research purposes.
                    All datasets used in this application are synthetic and generated for demonstration and reproducibility.
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </section>
      </div>
    </div>
  );
}
