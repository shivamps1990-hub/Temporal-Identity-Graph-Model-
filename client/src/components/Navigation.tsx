import { Link, useLocation } from "wouter";
import { LayoutDashboard, Network, Shield, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analysis", label: "Analysis", icon: Network },
  { href: "/threats", label: "Threat Map", icon: Shield },
  { href: "/about", label: "About", icon: BookOpen },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="w-60 border-r border-border bg-card p-5 flex flex-col h-screen sticky top-0" data-testid="nav-sidebar">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-semibold text-foreground leading-tight tracking-tight">
          Temporal Identity Graph
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1.5 font-mono uppercase tracking-wider">
          Research Prototype v0.2
        </p>
      </div>

      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150",
                  isActive
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="px-3 py-2">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            All datasets are synthetic. No real credentials or systems are represented.
          </p>
        </div>
      </div>
    </nav>
  );
}
