import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/pwa/DownloadButton";
import { SplashScreen } from "@/components/SplashScreen";
import { APP_VERSION } from "@/lib/version";
import {
  Phone,
  Users,
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Landing() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if user has seen splash in this session immediately
    const seen = sessionStorage.getItem("splash-seen");
    return !seen;
  });
  const navigate = useNavigate();

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("splash-seen", "true");
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2500} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="status-pulse">
            <img src="/logo.jpg" alt="Aitel" className="h-10 w-10 rounded-xl" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Aitel</h1>
            <p className="text-xs text-muted-foreground">Telecalling Console</p>
          </div>
        </div>
        <DownloadButton size="sm" variant="outline" className="btn-tactile border-2" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Welcome Section */}
        <div className="text-center mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Voice Platform
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to Aitel
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Build and manage intelligent voice agents with advanced analytics and enterprise security.
          </p>
        </div>

        {/* Login Options */}
        <div className="w-full max-w-sm space-y-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Link to="/login/admin" className="block">
            <Button
              variant="outline"
              className="w-full h-20 justify-between text-left px-5 card-tactile bg-card group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors border-2 border-transparent group-hover:border-primary">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-base">Admin Portal</div>
                  <div className="text-xs text-muted-foreground">Platform management</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link to="/login/engineer" className="block">
            <Button
              variant="outline"
              className="w-full h-20 justify-between text-left px-5 card-tactile bg-card group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1 group-hover:bg-chart-1 group-hover:text-white transition-colors border-2 border-transparent group-hover:border-chart-1">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-base">Engineer Portal</div>
                  <div className="text-xs text-muted-foreground">Build voice agents</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link to="/login/client" className="block">
            <Button
              variant="outline"
              className="w-full h-20 justify-between text-left px-5 card-tactile bg-card group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-chart-2/10 text-chart-2 group-hover:bg-chart-2 group-hover:text-white transition-colors border-2 border-transparent group-hover:border-chart-2">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-base">Client Portal</div>
                  <div className="text-xs text-muted-foreground">Manage campaigns</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Link to="/login">
            <Button size="lg" className="px-10 h-14 text-lg btn-tactile shadow-none border-2">
              Get Started
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <p className="text-xs text-muted-foreground">
          © 2024 Aitel Platform. All rights reserved.
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {APP_VERSION.full}
        </p>
      </footer>
    </div>
  );
}
