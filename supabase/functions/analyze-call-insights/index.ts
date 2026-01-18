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

interface AnalysisRequest {
  clientId?: string;
  campaignId?: string;
  analysisType: "comprehensive" | "sales_pitch" | "questions" | "objections" | "interest_triggers";
  dateRange?: { start: string; end: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");

    // Verify user
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    let userId: string;
    if (claimsError || !claimsData?.claims) {
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

    // Check user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const allowedRoles = ["admin", "client"];
    if (!roleData?.role || !allowedRoles.includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { clientId, campaignId, analysisType, dateRange }: AnalysisRequest = await req.json();

    // Determine which client to analyze
    let targetClientId = clientId;
    if (roleData.role === "client") {
      targetClientId = userId;
    }

    console.log(`Analyzing calls for client: ${targetClientId}, campaign: ${campaignId}, type: ${analysisType}`);

    // Fetch calls with transcripts
    let query = supabase
      .from("calls")
      .select(`
        id,
        transcript,
        summary,
        sentiment,
        duration_seconds,
        connected,
        status,
        created_at,
        lead_id
      `)
      .not("transcript", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (targetClientId) {
      query = query.eq("client_id", targetClientId);
    }

    if (dateRange?.start) {
      query = query.gte("created_at", dateRange.start);
    }
    if (dateRange?.end) {
      query = query.lte("created_at", dateRange.end);
    }

    const { data: calls, error: callsError } = await query;

    if (callsError) {
      console.error("Error fetching calls:", callsError);
      throw callsError;
    }

    if (!calls || calls.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No calls with transcripts found for analysis",
          insights: null 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lead info for context
    const leadIds = [...new Set(calls.map(c => c.lead_id).filter(Boolean))];
    let leadsData: { id: string; interest_level: string | null; stage: string }[] = [];
    
    if (leadIds.length > 0) {
      const { data: leads } = await supabase
        .from("campaign_leads")
        .select("id, interest_level, stage")
        .in("id", leadIds);
      leadsData = leads || [];
    }

    // Build lead interest map
    const leadInterestMap = new Map(leadsData.map(l => [l.id, { interest: l.interest_level, stage: l.stage }]));

    // Categorize calls
    const interestedCalls = calls.filter(c => {
      const leadInfo = leadInterestMap.get(c.lead_id);
      return leadInfo?.interest === "interested" || leadInfo?.stage === "interested";
    });

    const notInterestedCalls = calls.filter(c => {
      const leadInfo = leadInterestMap.get(c.lead_id);
      return leadInfo?.interest === "not_interested" || leadInfo?.stage === "lost" || c.sentiment === "negative";
    });

    const partialCalls = calls.filter(c => {
      const leadInfo = leadInterestMap.get(c.lead_id);
      return leadInfo?.interest === "partially_interested" || leadInfo?.stage === "callback";
    });

    // Prepare transcript samples for AI analysis
    const transcriptSamples = calls
      .slice(0, 50)
      .map(c => `[Call ID: ${c.id.slice(0, 8)}, Sentiment: ${c.sentiment || "unknown"}, Duration: ${c.duration_seconds || 0}s]\n${c.transcript || c.summary}`)
      .join("\n\n---\n\n");

    const interestedSamples = interestedCalls
      .slice(0, 20)
      .map(c => c.transcript || c.summary)
      .filter(Boolean)
      .join("\n\n---\n\n");

    const notInterestedSamples = notInterestedCalls
      .slice(0, 20)
      .map(c => c.transcript || c.summary)
      .filter(Boolean)
      .join("\n\n---\n\n");

    // Build the comprehensive analysis prompt
    const systemPrompt = `You are an expert sales call analyst and coach. Analyze call transcripts to extract actionable insights. Always respond with valid JSON only, no markdown.`;

    const userPrompt = `Analyze these sales call transcripts and provide comprehensive insights.

CALL STATISTICS:
- Total Calls Analyzed: ${calls.length}
- Interested Leads: ${interestedCalls.length}
- Not Interested: ${notInterestedCalls.length}
- Partial Interest: ${partialCalls.length}
- Avg Duration: ${Math.round(calls.reduce((a, c) => a + (c.duration_seconds || 0), 0) / calls.length)}s

ALL CALL TRANSCRIPTS:
${transcriptSamples}

${interestedSamples ? `\nSUCCESSFUL (INTERESTED) CALL TRANSCRIPTS:\n${interestedSamples}` : ""}

${notInterestedSamples ? `\nUNSUCCESSFUL (NOT INTERESTED) CALL TRANSCRIPTS:\n${notInterestedSamples}` : ""}

Return this exact JSON structure:
{
  "bestSalesPitch": {
    "openingLines": ["Best opening lines that worked"],
    "valuePropositions": ["Key value propositions that resonated"],
    "closingTechniques": ["Effective closing techniques"],
    "recommendedCallFlow": [
      {"step": 1, "action": "Greeting", "script": "Recommended script", "timing": "0-15s"},
      {"step": 2, "action": "Introduction", "script": "...", "timing": "15-30s"}
    ],
    "toneGuidelines": ["Tone recommendations"]
  },
  "customerQuestions": {
    "mostAsked": [
      {"question": "Question text", "frequency": 45, "suggestedAnswer": "Best answer", "category": "Pricing/Features/Process/Support"}
    ],
    "criticalQuestions": ["Questions that lead to conversion if answered well"],
    "questionPatterns": ["Pattern insights"]
  },
  "objectionHandling": {
    "topObjections": [
      {"objection": "Objection text", "frequency": 30, "bestRebuttal": "Effective response", "successRate": "70%"}
    ],
    "objectionCategories": [
      {"category": "Price", "count": 25, "handlingStrategy": "Strategy"}
    ],
    "killerRebuttals": ["Rebuttals that converted objections to interest"]
  },
  "interestTriggers": {
    "whatWorked": [
      {"trigger": "What made leads interested", "frequency": 20, "context": "When this worked"}
    ],
    "buyingSignals": ["Phrases indicating purchase intent"],
    "engagementPeaks": ["Moments when engagement spiked"],
    "emotionalTriggers": ["Emotional appeals that worked"]
  },
  "callFlowAnalysis": {
    "optimalDuration": "Recommended call duration",
    "criticalMoments": ["Key decision points in calls"],
    "dropoffPoints": ["Where calls typically fail"],
    "recoveryTechniques": ["How to recover failing calls"]
  },
  "performanceInsights": {
    "conversionPatterns": ["Patterns in successful conversions"],
    "failurePatterns": ["Patterns in failed calls"],
    "improvementAreas": ["Specific areas to improve"],
    "trainingRecommendations": ["Training suggestions for team"]
  },
  "aiRecommendations": {
    "immediate": ["Actions to take immediately"],
    "shortTerm": ["Improvements for next week"],
    "longTerm": ["Strategic recommendations"],
    "scriptUpdates": ["Suggested script modifications"]
  }
}

Focus on actionable, specific insights. Quote actual phrases from transcripts where helpful. Be direct and practical.`;

    // Call Lovable AI
    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let insights;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("Raw response:", responseText);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis", raw: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add metadata
    const result = {
      insights,
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalCalls: calls.length,
        interestedCalls: interestedCalls.length,
        notInterestedCalls: notInterestedCalls.length,
        partialCalls: partialCalls.length,
        dateRange: dateRange || null,
        clientId: targetClientId,
        campaignId: campaignId || null,
      }
    };

    console.log("Analysis complete:", result.metadata);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
