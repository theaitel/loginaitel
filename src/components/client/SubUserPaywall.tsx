import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CheckCircle,
  CreditCard,
  Loader2,
  Plus,
  Minus,
  Gift,
  Clock,
  AlertTriangle,
  Zap,
  Calendar,
  Shield
} from "lucide-react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { toast } from "sonner";

interface SubUserPaywallProps {
  currentSeats: number;
  onPurchaseComplete?: () => void;
  onTrialStart?: () => void;
}

const SEAT_PRICE = 300;
const TRIAL_DAYS = 7;
const TRIAL_SEATS = 10;

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
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_trial: boolean | null;
  autopay_enabled: boolean | null;
  autopay_setup_at: string | null;
  created_at: string;
  updated_at: string;
}

export function SubUserPaywall({ currentSeats, onPurchaseComplete, onTrialStart }: SubUserPaywallProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [seatsToBuy, setSeatsToBuy] = useState(Math.max(1, currentSeats));
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

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

  const isOnTrial = subscription?.is_trial === true;
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const now = new Date();
  const trialExpired = trialEndsAt ? now >= trialEndsAt : false;
  const trialDaysRemaining = trialEndsAt ? Math.max(0, differenceInDays(trialEndsAt, now)) : 0;
  const trialHoursRemaining = trialEndsAt ? Math.max(0, differenceInHours(trialEndsAt, now)) : 0;
  const autopayEnabled = subscription?.autopay_enabled === true;
  const paidSeats = subscription?.seats_count || 0;

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

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const { data, error } = await supabase.functions.invoke("start-seat-trial");
      
      if (error) throw error;
      
      if (data.success) {
        toast.success("🎉 Free trial started!", {
          description: `Add up to ${TRIAL_SEATS} team members for ${TRIAL_DAYS} days free.`
        });
        refetch();
        queryClient.invalidateQueries({ queryKey: ["seat-subscription"] });
        queryClient.invalidateQueries({ queryKey: ["client-sub-users"] });
        onTrialStart?.();
      } else if (data.error === "trial_expired") {
        toast.error("Trial expired. Set up autopay to continue.");
      } else {
        throw new Error(data.message || "Failed to start trial");
      }
    } catch (error: any) {
      console.error("Trial start error:", error);
      toast.error(error.message || "Failed to start trial");
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleSetupAutopay = async () => {
    if (seatsToBuy < 1) {
      toast.error("Select at least 1 seat");
      return;
    }

    setIsLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load payment gateway");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please login to continue");

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "setup-seat-autopay",
        { body: { seats: seatsToBuy } }
      );

      if (orderError || !orderData) throw new Error(orderError?.message || "Failed to create order");

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Aitel Team Seats",
        description: `${seatsToBuy} seat(s) × ₹${SEAT_PRICE}/month`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              "razorpay-verify-seat-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  seats: seatsToBuy,
                  isAutopaySetup: true,
                },
              }
            );

            if (verifyError) throw new Error(verifyError.message);

            toast.success("Autopay activated!", {
              description: `${seatsToBuy} seat(s) ready. You can now add team members.`
            });
            refetch();
            queryClient.invalidateQueries({ queryKey: ["seat-subscription"] });
            queryClient.invalidateQueries({ queryKey: ["seat-payments"] });
            queryClient.invalidateQueries({ queryKey: ["client-sub-users"] });
            onPurchaseComplete?.();
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: { email: session.user.email },
        theme: { color: "#000000" },
        modal: { ondismiss: () => setIsLoading(false) },
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalAmount = seatsToBuy * SEAT_PRICE;

  // No subscription - Show trial start
  if (!subscription) {
    return (
      <Card className="border-2 border-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Gift className="h-5 w-5 text-primary" />
              Start Your Free Trial
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Try team management features free for {TRIAL_DAYS} days
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary">{TRIAL_DAYS}</div>
              <div className="text-xs text-muted-foreground mt-1">Days Free</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{TRIAL_SEATS}</div>
              <div className="text-xs text-muted-foreground mt-1">Team Members</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">₹0</div>
              <div className="text-xs text-muted-foreground mt-1">No Card Needed</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Add up to {TRIAL_SEATS} team members</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>All roles: Telecaller, Lead Manager, Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No payment required to start</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            After trial, set up autopay (₹{SEAT_PRICE}/seat/month) to continue.
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStartTrial} 
            className="w-full h-12 text-base" 
            disabled={isStartingTrial}
          >
            {isStartingTrial ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Starting...</>
            ) : (
              <><Gift className="h-4 w-4 mr-2" />Start {TRIAL_DAYS}-Day Free Trial</>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Active trial or expired trial without autopay
  if (isOnTrial || (subscription.trial_started_at && !autopayEnabled)) {
    const trialProgress = trialEndsAt 
      ? Math.min(100, Math.max(0, ((TRIAL_DAYS - trialDaysRemaining) / TRIAL_DAYS) * 100))
      : 0;

    return (
      <Card className={trialExpired ? "border-2 border-destructive" : "border border-border"}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                {trialExpired ? (
                  <><AlertTriangle className="h-5 w-5 text-destructive" />Trial Expired</>
                ) : (
                  <><Clock className="h-5 w-5 text-primary" />Free Trial Active</>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {trialExpired 
                  ? "Set up autopay to continue using team features"
                  : `${trialDaysRemaining} days remaining (${trialHoursRemaining}h)`
                }
              </p>
            </div>
            {!trialExpired && (
              <Badge variant="outline" className="border-primary text-primary">
                <Clock className="h-3 w-3 mr-1" />Trial
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trial Progress */}
          {!trialExpired && trialEndsAt && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trial Progress</span>
                <span className="font-medium">{trialDaysRemaining} days left</span>
              </div>
              <Progress value={trialProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Expires on {format(trialEndsAt, "MMM dd, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}

          {/* Seat Usage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg border">
              <div className="text-3xl font-bold">{currentSeats}</div>
              <div className="text-xs text-muted-foreground mt-1">Current Members</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg border">
              <div className="text-3xl font-bold">{trialExpired ? 0 : TRIAL_SEATS}</div>
              <div className="text-xs text-muted-foreground mt-1">Available Seats</div>
            </div>
          </div>

          {/* Expired Warning */}
          {trialExpired && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Team Features Locked</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your trial has ended. Set up autopay to unlock team features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Autopay Setup */}
          <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {trialExpired ? "Set Up Autopay to Continue" : "Set Up Autopay Now"}
            </h4>
            
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap text-sm">Seats:</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSeatsToBuy(Math.max(1, seatsToBuy - 1))}
                  disabled={seatsToBuy <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={seatsToBuy}
                  onChange={(e) => setSeatsToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSeatsToBuy(seatsToBuy + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">× ₹{SEAT_PRICE}/month</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Monthly total</span>
              <span className="text-2xl font-bold">₹{totalAmount}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Billed monthly via Razorpay</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span>All roles included</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSetupAutopay} 
            className="w-full h-12 text-base"
            disabled={isLoading}
            variant={trialExpired ? "destructive" : "default"}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><CreditCard className="h-4 w-4 mr-2" />Set Up Autopay - ₹{totalAmount}/month</>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Active paid subscription with autopay
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Subscription Active
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {paidSeats} seat(s) • ₹{paidSeats * SEAT_PRICE}/month
            </p>
          </div>
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />Autopay
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seat Usage */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="text-3xl font-bold">{currentSeats}</div>
            <div className="text-xs text-muted-foreground mt-1">Used</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="text-3xl font-bold">{paidSeats}</div>
            <div className="text-xs text-muted-foreground mt-1">Paid Seats</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg border">
            <div className="text-3xl font-bold text-green-600">{paidSeats - currentSeats}</div>
            <div className="text-xs text-muted-foreground mt-1">Available</div>
          </div>
        </div>

        {/* Next billing */}
        {subscription.next_billing_date && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Next billing</span>
            </div>
            <span className="font-medium">
              {format(new Date(subscription.next_billing_date), "MMM dd, yyyy")}
            </span>
          </div>
        )}

        {/* Add more seats */}
        {currentSeats >= paidSeats && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Seat limit reached</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Purchase additional seats to add more members.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase more */}
        <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add More Seats
          </h4>
          
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap text-sm">Seats:</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSeatsToBuy(Math.max(1, seatsToBuy - 1))}
                disabled={seatsToBuy <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={100}
                value={seatsToBuy}
                onChange={(e) => setSeatsToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSeatsToBuy(seatsToBuy + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">× ₹{SEAT_PRICE}/month</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Additional monthly cost</span>
            <span className="text-xl font-bold">₹{totalAmount}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSetupAutopay} 
          className="w-full h-11"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" />Add {seatsToBuy} Seat(s) - ₹{totalAmount}/month</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export { SEAT_PRICE, TRIAL_DAYS, TRIAL_SEATS };
