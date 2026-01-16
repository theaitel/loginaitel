import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Lock, 
  CheckCircle,
  IndianRupee,
  Calendar,
  CreditCard,
  Loader2,
  Plus,
  Minus
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface SubUserPaywallProps {
  currentSeats: number;
  maxFreeSeats?: number;
  onPurchaseComplete?: () => void;
}

const SEAT_PRICE = 300; // ₹300 per seat per month

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SeatSubscription {
  id: string;
  client_id: string;
  seats_count: number;
  status: string;
  razorpay_subscription_id: string | null;
  next_billing_date: string | null;
  last_payment_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SeatPayment {
  id: string;
  client_id: string;
  seats_count: number;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  status: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export function SubUserPaywall({ currentSeats, maxFreeSeats = 0, onPurchaseComplete }: SubUserPaywallProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [seatsToBuy, setSeatsToBuy] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch seat subscription data using raw query for new tables
  const { data: subscription, isLoading: loadingSubscription, refetch } = useQuery({
    queryKey: ["seat-subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seat_subscriptions" as any)
        .select("*")
        .eq("client_id", user!.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as unknown as SeatSubscription | null;
    },
  });

  // Fetch seat payment history
  const { data: paymentHistory } = useQuery({
    queryKey: ["seat-payments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seat_payments" as any)
        .select("*")
        .eq("client_id", user!.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as unknown as SeatPayment[];
    },
  });

  const paidSeats = subscription?.seats_count || 0;
  const totalAllowedSeats = maxFreeSeats + paidSeats;
  const canAddMore = currentSeats < totalAllowedSeats;
  const needsMoreSeats = !canAddMore;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchaseSeats = async () => {
    if (seatsToBuy < 1) {
      toast.error("Please select at least 1 seat");
      return;
    }

    setIsLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please login to continue");
      }

      // Create seat order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "razorpay-seat-order",
        {
          body: { seats: seatsToBuy },
        }
      );

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create order");
      }

      // Initialize Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Aitel Team Seats",
        description: `Purchase ${seatsToBuy} team seat(s) - ₹${SEAT_PRICE}/seat/month`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "razorpay-verify-seat-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  seats: seatsToBuy,
                },
              }
            );

            if (verifyError) {
              throw new Error(verifyError.message);
            }

            toast.success(`Successfully purchased ${seatsToBuy} seat(s)!`);
            refetch();
            queryClient.invalidateQueries({ queryKey: ["seat-subscription"] });
            queryClient.invalidateQueries({ queryKey: ["seat-payments"] });
            queryClient.invalidateQueries({ queryKey: ["client-sub-users"] });
            onPurchaseComplete?.();
            setSeatsToBuy(1);
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalAmount = seatsToBuy * SEAT_PRICE;

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
          {subscription && subscription.status === "active" && (
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
        {subscription && subscription.status === "active" && (
          <div className="p-4 bg-primary/5 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Subscription Active</span>
              </div>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            {subscription.next_billing_date && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Next Billing</span>
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(subscription.next_billing_date), "MMM dd, yyyy")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                <span className="text-sm">Monthly Cost</span>
              </div>
              <span className="text-sm font-bold">₹{paidSeats * SEAT_PRICE}</span>
            </div>
          </div>
        )}

        {/* Purchase Seats Section */}
        <div className="p-4 bg-muted/50 border-2 border-border space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Purchase Additional Seats
          </h4>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="seats" className="whitespace-nowrap">Number of Seats:</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSeatsToBuy(Math.max(1, seatsToBuy - 1))}
                disabled={seatsToBuy <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="seats"
                type="number"
                min={1}
                max={100}
                value={seatsToBuy}
                onChange={(e) => setSeatsToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSeatsToBuy(seatsToBuy + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {seatsToBuy} seat(s) × ₹{SEAT_PRICE}/month
            </span>
            <span className="text-xl font-bold text-primary">₹{totalAmount}</span>
          </div>
        </div>

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
                  You've used all available seats. Purchase additional seats to add more team members.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        {paymentHistory && paymentHistory.length > 0 && (
          <div className="p-4 bg-muted/50 border-2 border-border">
            <h4 className="font-semibold mb-2">Recent Payments</h4>
            <div className="space-y-2">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {payment.seats_count} seat(s) - {format(new Date(payment.created_at), "MMM dd, yyyy")}
                  </span>
                  <span className="font-medium">₹{payment.amount}</span>
                </div>
              ))}
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
            <li>• Billed monthly via Razorpay</li>
            <li>• All roles included (Telecaller, Lead Manager, Monitoring)</li>
            <li>• Access to assigned leads and call features</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePurchaseSeats} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ₹{totalAmount} for {seatsToBuy} Seat(s)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export { SEAT_PRICE };
