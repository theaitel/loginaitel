import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Lock, 
  Mail, 
  CheckCircle,
  IndianRupee,
  Clock,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface SubUserPaywallProps {
  currentSeats: number;
  maxFreeSeats?: number;
  onContactSales: () => void;
}

const SEAT_PRICE = 300; // ₹300 per seat per month

interface SeatSubscription {
  id: string;
  client_id: string;
  seats_count: number;
  status: string;
  next_billing_date: string | null;
  created_at: string;
}

export function SubUserPaywall({ currentSeats, maxFreeSeats = 0, onContactSales }: SubUserPaywallProps) {
  const { user } = useAuth();

  // Fetch seat subscription data from client_credits (we'll use a simple approach)
  const { data: seatData, isLoading } = useQuery({
    queryKey: ["client-seat-subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // For now, we check if the client has purchased seats through payments
      // This could be expanded to a dedicated table later
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("client_id", user!.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      // Calculate paid seats based on client_credits or a custom field
      // For now, allow unlimited seats if they have any credits
      return data?.[0] ? { has_subscription: true } : null;
    },
  });

  // For simplicity: clients need to contact sales for seats (no free seats)
  const paidSeats = seatData ? 999 : 0; // If they've paid anything, allow team members
  const totalAllowedSeats = maxFreeSeats + paidSeats;
  const canAddMore = currentSeats < totalAllowedSeats || paidSeats > 0;
  const needsMoreSeats = !canAddMore;

  const calculateMonthlyCost = (seats: number) => {
    const billableSeats = Math.max(0, seats - maxFreeSeats);
    return billableSeats * SEAT_PRICE;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className={needsMoreSeats ? "border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Seats
            </CardTitle>
            <CardDescription>
              Manage your team member subscriptions
            </CardDescription>
          </div>
          {seatData && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active Subscription
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seat Usage */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-muted/50 border-2 border-border text-center">
            <p className="text-2xl font-bold">{currentSeats}</p>
            <p className="text-xs text-muted-foreground">Current Members</p>
          </div>
          <div className="p-3 bg-muted/50 border-2 border-border text-center">
            <p className="text-2xl font-bold">{paidSeats}</p>
            <p className="text-xs text-muted-foreground">Paid Seats</p>
          </div>
          <div className="p-3 bg-muted/50 border-2 border-border text-center">
            <p className="text-2xl font-bold text-primary">₹{SEAT_PRICE}</p>
            <p className="text-xs text-muted-foreground">Per Seat/Month</p>
          </div>
        </div>

        {/* Subscription Info */}
        {seatData && (
          <div className="p-4 bg-primary/5 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Subscription Status</span>
              </div>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Monthly Cost</span>
              </div>
              <span className="text-sm font-bold">₹{calculateMonthlyCost(currentSeats)}</span>
            </div>
          </div>
        )}

        {/* Warning/Action */}
        {needsMoreSeats && (
          <div className="p-4 bg-amber-100 dark:bg-amber-900/20 border-2 border-amber-500/50">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  Seat Limit Reached
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You've used all available seats. To add more team members, purchase additional seats at ₹{SEAT_PRICE}/seat/month.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Info */}
        <div className="p-4 bg-muted/50 border-2 border-border">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Seat Pricing
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ₹{SEAT_PRICE} per team member per month</li>
            <li>• Billed monthly, cancel anytime</li>
            <li>• All roles included (Telecaller, Lead Manager, Monitoring)</li>
            <li>• Access to assigned leads and call features</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onContactSales} className="w-full" disabled={canAddMore && currentSeats > 0}>
          <Mail className="h-4 w-4 mr-2" />
          {needsMoreSeats ? "Purchase More Seats" : currentSeats === 0 ? "Get Started" : "Manage Subscription"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export { SEAT_PRICE };
