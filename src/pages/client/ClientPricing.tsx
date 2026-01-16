import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Check,
  Zap,
  Building2,
  Crown,
  Rocket,
  Shield,
  Clock,
  PhoneOff,
  Users,
  MessageSquare,
  ArrowRight,
  Info,
  PhoneIncoming,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Package {
  id: string;
  name: string;
  calls: number;
  icon: React.ReactNode;
  description: string;
  concurrency: string;
  inboundCalls: boolean;
  popular?: boolean;
  enterprise?: boolean;
  features: string[];
}

const PACKAGES: Package[] = [
  {
    id: "trust-building",
    name: "Trust Building Pack",
    calls: 5000,
    icon: <Shield className="h-8 w-8" />,
    description: "Perfect for getting started and building trust with your customers",
    concurrency: "10 concurrent calls",
    inboundCalls: false,
    features: [
      "5,000 connected calls",
      "10 concurrent calls",
      "No charge for missed calls",
      "Basic analytics",
      "Email support",
      "45+ second call billing",
    ],
  },
  {
    id: "growth",
    name: "Growth Pack",
    calls: 30000,
    icon: <Rocket className="h-8 w-8" />,
    description: "Scale your operations with increased capacity",
    concurrency: "12 concurrent calls",
    inboundCalls: false,
    popular: true,
    features: [
      "30,000 connected calls",
      "12 concurrent calls",
      "No charge for missed calls",
      "Advanced analytics",
      "Priority email support",
      "45+ second call billing",
      "API access",
    ],
  },
  {
    id: "professional",
    name: "Professional Pack",
    calls: 50000,
    icon: <Crown className="h-8 w-8" />,
    description: "For established businesses with high call volumes",
    concurrency: "15 concurrent calls",
    inboundCalls: false,
    features: [
      "50,000 connected calls",
      "15 concurrent calls",
      "No charge for missed calls",
      "Full analytics suite",
      "Priority support",
      "45+ second call billing",
      "API access",
      "Custom integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    calls: 100000,
    icon: <Building2 className="h-8 w-8" />,
    description: "Ultimate solution for large-scale operations",
    concurrency: "20 concurrent calls",
    inboundCalls: true,
    enterprise: true,
    features: [
      "1,00,000 connected calls",
      "20 concurrent calls",
      "No charge for missed calls",
      "Full analytics suite",
      "Dedicated account manager",
      "45+ second call billing",
      "API access",
      "Custom integrations",
      "Inbound calls included",
      "SLA guarantee",
    ],
  },
];

export default function ClientPricing() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Fetch current client subscription/credits info
  const { data: clientData, isLoading } = useQuery({
    queryKey: ["client-credits-info", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credits")
        .select("balance, price_per_credit")
        .eq("client_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleSelectPackage = (packageId: string) => {
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (pkg?.enterprise) {
      // Contact sales for enterprise
      window.open("mailto:sales@aitel.com?subject=Enterprise Plan Inquiry", "_blank");
      toast.info("Opening email to contact our sales team...");
    } else {
      setSelectedPackage(packageId);
      toast.info(`Selected ${pkg?.name}. Contact sales to complete your subscription.`);
      // In a real app, this would open a payment flow or contact form
      window.open("mailto:sales@aitel.com?subject=" + encodeURIComponent(`${pkg?.name} Subscription`), "_blank");
    }
  };

  const handleContactSales = () => {
    window.open("mailto:sales@aitel.com?subject=Custom Plan / Increase Concurrency", "_blank");
    toast.info("Opening email to contact our sales team...");
  };

  return (
    <DashboardLayout role="client">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Select a package that fits your business needs. All plans include connected calls only - 
            we never charge for missed calls.
          </p>
        </div>

        {/* What is a Connected Call */}
        <Card className="border-primary/30 bg-primary/5 max-w-4xl mx-auto">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-4 bg-primary/10 border-2 border-primary/30">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-lg flex items-center gap-2 justify-center sm:justify-start">
                  What is a Connected Call?
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>A call is considered "connected" when the recipient answers and the conversation lasts 45 seconds or more.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-muted-foreground mt-1">
                  A <strong>connected call</strong> is when someone answers and talks for <strong>45 seconds or more</strong>. 
                  Missed calls, unanswered calls, and calls under 45 seconds are <strong>FREE</strong> - we don't charge you for them!
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30">
                <PhoneOff className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Missed calls = FREE</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative flex flex-col ${
                pkg.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
              } ${pkg.enterprise ? "border-amber-500/50" : ""}`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              {pkg.enterprise && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black">
                  Enterprise
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto p-4 mb-3 ${
                  pkg.popular ? "bg-primary/10 text-primary" : 
                  pkg.enterprise ? "bg-amber-500/10 text-amber-600" : 
                  "bg-muted"
                }`}>
                  {pkg.icon}
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{pkg.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                {/* Call Count */}
                <div className="text-center py-4 border-y-2 border-border">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-4xl font-bold">
                      {pkg.calls.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Connected Calls</p>
                </div>

                {/* Concurrency */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 border-2 border-border">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{pkg.concurrency}</span>
                </div>

                {/* Inbound Calls Badge */}
                {pkg.inboundCalls ? (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30">
                    <PhoneIncoming className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Inbound Calls Included</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border">
                    <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Outbound Only</span>
                  </div>
                )}

                {/* Features List */}
                <ul className="space-y-2">
                  {pkg.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {pkg.features.length > 5 && (
                    <li className="text-sm text-muted-foreground pl-6">
                      +{pkg.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  variant={pkg.enterprise ? "outline" : pkg.popular ? "default" : "secondary"}
                  onClick={() => handleSelectPackage(pkg.id)}
                >
                  {pkg.enterprise ? (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Sales
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Important Notes */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-600" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-border bg-background">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  No Downgrade Policy
                </h4>
                <p className="text-sm text-muted-foreground">
                  Once you choose a package, you cannot downgrade to a lower tier. You can always upgrade to a higher package.
                </p>
              </div>
              <div className="p-4 border-2 border-border bg-background">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Increase Concurrency
                </h4>
                <p className="text-sm text-muted-foreground">
                  Need more concurrent calls? Contact our sales team to increase your concurrency limits based on your requirements.
                </p>
              </div>
              <div className="p-4 border-2 border-border bg-background">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  45-Second Billing
                </h4>
                <p className="text-sm text-muted-foreground">
                  Calls are only counted when they last 45 seconds or more. Shorter calls and missed calls are completely free.
                </p>
              </div>
              <div className="p-4 border-2 border-border bg-background">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <PhoneIncoming className="h-4 w-4" />
                  Inbound Calls
                </h4>
                <p className="text-sm text-muted-foreground">
                  Inbound call support is available only for Enterprise plans. Contact sales for custom inbound solutions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need Help / Contact Sales */}
        <Card className="text-center">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold mb-2">Need a Custom Plan?</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Looking for custom call volumes, higher concurrency, or specific features? 
              Our sales team is here to help create a plan that fits your exact needs.
            </p>
            <Button size="lg" variant="outline" onClick={handleContactSales}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Sales Team
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="connected-call">
                <AccordionTrigger>What counts as a connected call?</AccordionTrigger>
                <AccordionContent>
                  A connected call is when the recipient answers and the conversation lasts for 45 seconds or more. 
                  Calls that go unanswered, reach voicemail, or last less than 45 seconds are not counted against your quota.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="missed-calls">
                <AccordionTrigger>Do you charge for missed calls?</AccordionTrigger>
                <AccordionContent>
                  <strong>No!</strong> We only charge for connected calls (45+ seconds). Missed calls, 
                  busy signals, unanswered calls, and short calls under 45 seconds are completely free.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="downgrade">
                <AccordionTrigger>Can I downgrade my plan?</AccordionTrigger>
                <AccordionContent>
                  No, once you select a package you cannot downgrade to a lower tier. However, you can always 
                  upgrade to a higher package at any time. This policy ensures commitment and better pricing for our customers.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="concurrency">
                <AccordionTrigger>What is concurrency and how does it work?</AccordionTrigger>
                <AccordionContent>
                  Concurrency refers to the number of calls that can be made simultaneously. For example, 
                  if you have 10 concurrent calls, you can have up to 10 active calls running at the same time. 
                  The concurrency level is based on your package size (10-20 calls). Need more? Contact sales!
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="inbound">
                <AccordionTrigger>What about inbound calls?</AccordionTrigger>
                <AccordionContent>
                  Inbound calls are included only in the Enterprise plan. For other plans, 
                  you can contact our sales team to discuss custom inbound call solutions based on your needs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rollover">
                <AccordionTrigger>Do unused calls roll over?</AccordionTrigger>
                <AccordionContent>
                  Unused calls do not automatically roll over. However, your purchased calls remain available 
                  until used. Contact our sales team for specific questions about call validity periods.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
