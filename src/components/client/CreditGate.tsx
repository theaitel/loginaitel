import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreditGateProps {
  children: React.ReactNode;
  requiredCredits?: number;
  featureName?: string;
}

export function CreditGate({ children, requiredCredits = 1, featureName = "this feature" }: CreditGateProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: creditData, isLoading } = useQuery({
    queryKey: ["client-credits-gate", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credits")
        .select("balance")
        .eq("client_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return { balance: data?.balance || 0 };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasCredits = (creditData?.balance || 0) >= requiredCredits;

  if (!hasCredits) {
    return (
      <Card className="border-2 border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            No Credits Available
          </CardTitle>
          <CardDescription className="text-base">
            You need at least {requiredCredits} credit{requiredCredits > 1 ? "s" : ""} to access {featureName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-background border-2 border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
            <p className="text-3xl font-bold text-destructive">{creditData?.balance || 0}</p>
            <p className="text-xs text-muted-foreground">credits</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Purchase credits to unlock calling features and start making AI-powered calls.
            </p>
            <Button onClick={() => navigate("/client/billing")} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Credits Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
