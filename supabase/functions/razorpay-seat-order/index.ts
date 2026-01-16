import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEAT_PRICE = 300; // ₹300 per seat per month

interface SeatOrderRequest {
  seats: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    let userId: string;
    if (claimsError || !claimsData?.claims) {
      const { data: { user: userData }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userData) {
        throw new Error("Unauthorized");
      }
      userId = userData.id;
    } else {
      userId = claimsData.claims.sub as string;
    }

    const { seats }: SeatOrderRequest = await req.json();

    if (!seats || seats <= 0) {
      throw new Error("Invalid number of seats");
    }

    const amount = seats * SEAT_PRICE;
    console.log(`Creating seat order: ${seats} seats for ₹${amount}`);

    // Create Razorpay order
    const receiptId = `seat_${Date.now().toString(36)}`;
    const orderData = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: receiptId,
      notes: {
        client_id: userId,
        seats: seats.toString(),
        type: "seat_subscription",
      },
    };

    const authString = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay error:", errorText);
      throw new Error("Failed to create Razorpay order");
    }

    const order = await razorpayResponse.json();
    console.log("Razorpay order created:", order.id);

    // Use service role to store the seat payment record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate billing period (1 month from now)
    const now = new Date();
    const billingEnd = new Date(now);
    billingEnd.setMonth(billingEnd.getMonth() + 1);

    // Create seat payment record
    const { error: insertError } = await supabaseAdmin
      .from("seat_payments")
      .insert({
        client_id: userId,
        seats_count: seats,
        amount: amount,
        razorpay_order_id: order.id,
        status: "pending",
        billing_period_start: now.toISOString(),
        billing_period_end: billingEnd.toISOString(),
      });

    if (insertError) {
      console.error("Error creating seat payment record:", insertError);
      throw new Error("Failed to create payment record");
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        seats,
        seatPrice: SEAT_PRICE,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating seat order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
