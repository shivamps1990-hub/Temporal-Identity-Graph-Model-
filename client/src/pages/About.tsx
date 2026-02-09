import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
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
      </div>
    </div>
  );
}
