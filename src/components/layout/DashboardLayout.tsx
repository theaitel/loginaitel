import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  Bot,
  ClipboardList,
  CreditCard,
  Tag,
  Phone,
  Settings,
  LogOut,
  Menu,
  X,
  Trophy,
  Clock,
  Megaphone,
  TrendingUp,
  Package,
  Shield,
  UserPlus,
  Headphones,
  UserCheck,
  Monitor,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "engineer" | "client";
}

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Prompt Engineers", href: "/admin/engineers" },
  { icon: TrendingUp, label: "Performance", href: "/admin/performance" },
  { icon: Users, label: "Clients", href: "/admin/clients" },
  { icon: ClipboardList, label: "Tasks", href: "/admin/tasks" },
  { icon: Bot, label: "Agents", href: "/admin/agents" },
  { icon: Brain, label: "AI Insights", href: "/admin/ai-insights" },
  { icon: Phone, label: "Make Call", href: "/admin/make-call" },
  { icon: Phone, label: "Calls", href: "/admin/calls" },
  { icon: Phone, label: "Phone Numbers", href: "/admin/phone-numbers" },
  { icon: Package, label: "Packages", href: "/admin/packages" },
  { icon: CreditCard, label: "Credits", href: "/admin/credits" },
  { icon: CreditCard, label: "Payments", href: "/admin/payments" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const engineerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/engineer" },
  { icon: ClipboardList, label: "My Tasks", href: "/engineer/tasks" },
  { icon: Bot, label: "My Workspace", href: "/engineer/agents" },
  { icon: Settings, label: "Agent Config", href: "/engineer/agent-config" },
  { icon: Phone, label: "Make Call", href: "/engineer/make-call" },
  { icon: Phone, label: "Demo Call Logs", href: "/engineer/demo-calls" },
  { icon: Trophy, label: "Leaderboard", href: "/engineer/leaderboard" },
  { icon: Clock, label: "Time Tracker", href: "/engineer/time" },
  { icon: Settings, label: "Settings", href: "/engineer/settings" },
];

const clientNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/client" },
  { icon: Megaphone, label: "Campaigns", href: "/client/campaigns" },
  { icon: Bot, label: "My Agents", href: "/client/agents" },
  { icon: Brain, label: "AI Insights", href: "/client/ai-insights" },
  { icon: Phone, label: "Make Call", href: "/client/make-call" },
  { icon: Phone, label: "Call History", href: "/client/calls" },
  { icon: Phone, label: "Phone Numbers", href: "/client/phone-numbers" },
  { icon: UserPlus, label: "Team Management", href: "/client/team" },
  { icon: Headphones, label: "Telecaller View", href: "/client/telecaller" },
  { icon: UserCheck, label: "Lead Manager", href: "/client/lead-manager" },
  { icon: Monitor, label: "Monitoring", href: "/client/monitoring" },
  { icon: Tag, label: "Pricing Plans", href: "/client/pricing" },
  { icon: CreditCard, label: "Credits & Billing", href: "/client/billing" },
  { icon: Shield, label: "Data Security", href: "/client/security" },
  { icon: Settings, label: "Settings", href: "/client/settings" },
];

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Enable 20-minute session timeout
  useSessionTimeout();

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "engineer"
        ? engineerNavItems
        : clientNavItems;

  const roleLabel =
    role === "admin"
      ? "Admin Portal"
      : role === "engineer"
        ? "Engineer Portal"
        : "Client Portal";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const NavItem = ({ item, location }: { item: any; location: any }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium border-2 transition-all group",
          isActive
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "border-transparent hover:bg-accent hover:border-border text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className={cn(
          "h-4 w-4 transition-transform group-hover:scale-110",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
        )} />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Aitel" className="h-6 w-6 rounded" />
          <span className="font-bold">Telecalling Console</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r-2 border-border transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-2 border-border bg-accent/20">
            <Link to="/" className="flex items-center gap-2 hover:scale-[1.02] transition-transform">
              <div className="status-pulse">
                <img src="/logo.jpg" alt="Aitel" className="h-8 w-8 rounded" />
              </div>
              <div>
                <span className="font-bold text-lg block leading-none">Aitel Console</span>
                <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-semibold">{roleLabel}</span>
              </div>
            </Link>
          </div>

          {/* Navigation with scroll */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {/* Grouped Navigation Logic */}
              {role === "admin" && (
                <>
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Management</p>
                    {[adminNavItems[0], adminNavItems[1], adminNavItems[2], adminNavItems[3], adminNavItems[4], adminNavItems[5]].map((item) => (
                      <NavItem key={item.href} item={item} location={location} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Operations</p>
                    {[adminNavItems[6], adminNavItems[7], adminNavItems[8], adminNavItems[9]].map((item) => (
                      <NavItem key={item.href} item={item} location={location} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Billing & Settings</p>
                    {[adminNavItems[10], adminNavItems[11], adminNavItems[12], adminNavItems[13]].map((item) => (
                      <NavItem key={item.href} item={item} location={location} />
                    ))}
                  </div>
                </>
              )}

              {role === "client" && (
                <>
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Strategy</p>
                    {[clientNavItems[0], clientNavItems[1], clientNavItems[2], clientNavItems[3]].map((item) => (
                      <NavItem key={item.href} item={item} location={location} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Voice & Ops</p>
                    {[clientNavItems[4], clientNavItems[5], clientNavItems[6], clientNavItems[7], clientNavItems[8], clientNavItems[9], clientNavItems[10]].map((item) => (
                      <NavItem key={item.href} item={item} location={location} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Subscription</p>
                    {[clientNavItems[11], clientNavItems[12], clientNavItems[13], clientNavItems[14]].map((item) => (
                      <NavItem key={item.href} item={item} location={location} />
                    ))}
                  </div>
                </>
              )}

              {role === "engineer" && (
                <div className="space-y-1">
                  {engineerNavItems.map((item) => (
                    <NavItem key={item.href} item={item} location={location} />
                  ))}
                </div>
              )}
            </nav>
          </ScrollArea>

          {/* Logout */}
          <div className="p-4 border-t-2 border-border bg-accent/10">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 btn-tactile border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
