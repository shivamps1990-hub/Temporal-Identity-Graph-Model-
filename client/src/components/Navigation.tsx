import { Link, useLocation } from "wouter";
import { LayoutDashboard, Network, AlertTriangle, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Live Graph", icon: LayoutDashboard },
  { href: "/analysis", label: "Analysis", icon: Network },
  { href: "/threats", label: "Threats", icon: AlertTriangle },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="w-64 border-r border-border bg-card p-4 flex flex-col h-screen sticky top-0">
      <div className="mb-8 px-2">
        <h1 className="font-mono font-bold text-xl text-primary tracking-tighter">
          TEMPORAL<br/>IDENTITY
        </h1>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
          Research Prototype v0.1
        </p>
      </div>

      <div className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  "hover:bg-accent/10 hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary/10 text-primary border-r-2 border-primary" 
                    : "text-muted-foreground"
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Online
          </div>
        </div>
      </div>
    </nav>
  );
}
