import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LowBalanceRequest {
  clientId: string;
  balance: number;
  threshold: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { clientId, balance, threshold }: LowBalanceRequest = await req.json();

    // Fetch client profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", clientId)
      .single();

    if (profileError || !profile?.email) {
      throw new Error("Client profile not found");
    }

    // Check if we already sent an alert recently (within 24 hours)
    const { data: creditData } = await supabaseAdmin
      .from("client_credits")
      .select("last_low_balance_alert_at")
      .eq("client_id", clientId)
      .single();

    const lastAlertAt = creditData?.last_low_balance_alert_at;
    if (lastAlertAt) {
      const hoursSinceLastAlert = (Date.now() - new Date(lastAlertAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAlert < 24) {
        return new Response(
          JSON.stringify({ success: true, message: "Alert already sent within 24 hours" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Send email alert using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Aitel <onboarding@resend.dev>",
        to: [profile.email],
        subject: "⚠️ Low Credit Balance Alert",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">AITEL</h1>
              <p style="margin: 10px 0 0; opacity: 0.7;">Credit Balance Alert</p>
            </div>
            
            <div style="padding: 30px; background: #f5f5f5;">
              <p style="font-size: 16px; margin: 0 0 20px;">Hi ${profile.full_name || 'there'},</p>
              
              <div style="background: #fff; border: 2px solid #f59e0b; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Your credit balance is low</p>
                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold;">${balance} credits remaining</p>
                <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Alert threshold: ${threshold} credits</p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 0 0 20px;">
                To ensure uninterrupted service, please top up your credits soon. 
                Running out of credits will pause your AI calling campaigns.
              </p>
              
              <a href="https://loginaitel.lovable.app/client/billing" 
                 style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: 600;">
                Buy Credits Now
              </a>
            </div>
            
            <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p style="margin: 0;">You received this alert because low balance notifications are enabled.</p>
              <p style="margin: 5px 0 0;">Manage your alert settings in your billing dashboard.</p>
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Low balance alert sent:", emailResult);

    // Update last alert timestamp
    await supabaseAdmin
      .from("client_credits")
      .update({ last_low_balance_alert_at: new Date().toISOString() })
      .eq("client_id", clientId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending low balance alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
