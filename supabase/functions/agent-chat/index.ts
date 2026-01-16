import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    
    // Verify user using getClaims (works with signing-keys)
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    let userId: string;
    if (claimsError || !claimsData?.claims) {
      // Fallback to getUser for backward compatibility
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;
    } else {
      userId = claimsData.claims.sub as string;
    }
    
    // Create user object for compatibility
    const user = { id: userId };

    // Check user role - engineers, admins, and clients can use this
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const allowedRoles = ["admin", "engineer", "client"];
    if (!roleData?.role || !allowedRoles.includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { agentId, systemPrompt, userMessage, conversationHistory } = await req.json();

    if (!systemPrompt || !userMessage) {
      return new Response(
        JSON.stringify({ error: "systemPrompt and userMessage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages array
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a voice AI agent. Respond naturally as if you're in a phone conversation. Keep responses concise and conversational (1-3 sentences typically). Don't use markdown formatting or special characters - just plain spoken text.

${systemPrompt}

Important guidelines:
- Speak naturally as if on a phone call
- Keep responses brief and to the point
- Ask clarifying questions when needed
- Be helpful and professional
- Don't use bullet points, numbers, or formatting
- Don't say things like "As an AI" or reference being an AI unless asked`,
      },
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Call Lovable AI
    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Log test call for analytics (ignore errors if table doesn't exist)
    try {
      await supabase.from("test_call_logs").insert({
        user_id: user.id,
        agent_id: agentId,
        user_message: userMessage,
        agent_response: response,
      });
    } catch {
      // Table might not exist yet, that's fine
    }

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
