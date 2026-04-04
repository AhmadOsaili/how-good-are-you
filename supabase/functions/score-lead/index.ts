import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build AI prompt for scoring
    const scoringPrompt = `You are a lead scoring expert for a roofing company lead generation platform in Texas.

Analyze this lead and provide a quality score from 0-100 based on the following data:

**Lead Information:**
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone}
- Address: ${lead.address}
- City: ${lead.city}
- State: ${lead.state}
- ZIP Code: ${lead.zip_code}
- Roof Age: ${lead.roof_age}
- Concerns/Reason for new roof: ${lead.concerns || "Not provided"}
- Solar Interest: ${lead.solar_interest || "Not provided"}

**Scoring Criteria (weight each factor):**
1. **Roof Age (25%)**: Older roofs (15-20+ years) score higher — more likely to need replacement. 0-5 years is very low priority.
2. **Concerns/Urgency (25%)**: Active leaks, storm damage, insurance claims indicate high urgency. Cosmetic concerns or "just looking" are lower.
3. **Location Quality (15%)**: Texas locations in hail-prone areas (DFW, San Antonio, Austin corridor) or hurricane-prone coastal areas score higher.
4. **Contact Completeness (10%)**: Valid-looking email (not throwaway), complete phone, full address all indicate a serious lead.
5. **Solar Interest (10%)**: "Yes" or "Maybe" indicates a higher-value project (roof + solar bundle).
6. **Property Indicators (15%)**: Analyze the address — residential vs commercial area indicators, property location quality.

**Important:** Be data-driven. A lead with a 20+ year old roof, active leak concerns, in a hail-prone Texas city is a 85-95. A lead with a 0-5 year old roof and vague concerns is a 15-30.

Respond with ONLY valid JSON in this exact format:
{"score": <number 0-100>, "reasoning": "<2-3 sentence explanation of the score>"}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a lead scoring AI. Respond only with valid JSON." },
          { role: "user", content: scoringPrompt },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI scoring failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON response - handle markdown code blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let score: number;
    let reasoning: string;
    try {
      const parsed = JSON.parse(cleanContent);
      score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      reasoning = parsed.reasoning || "Score calculated based on lead data analysis.";
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback: simple rule-based scoring
      score = calculateFallbackScore(lead);
      reasoning = "Score calculated using rule-based analysis (AI parsing failed).";
    }

    // Update the lead with the score
    const { error: updateError } = await supabase
      .from("leads")
      .update({ lead_score: score, score_reasoning: reasoning })
      .eq("id", lead_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save score");
    }

    return new Response(
      JSON.stringify({ score, reasoning }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("score-lead error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateFallbackScore(lead: any): number {
  let score = 50; // base

  // Roof age scoring
  const roofAge = lead.roof_age;
  if (roofAge === "20+") score += 20;
  else if (roofAge === "15-20") score += 15;
  else if (roofAge === "10-15") score += 10;
  else if (roofAge === "5-10") score += 5;
  else if (roofAge === "0-5") score -= 15;

  // Concerns boost
  if (lead.concerns) {
    const concerns = lead.concerns.toLowerCase();
    if (concerns.includes("leak") || concerns.includes("damage") || concerns.includes("storm")) score += 15;
    if (concerns.includes("insurance") || concerns.includes("claim")) score += 10;
    if (concerns.includes("emergency") || concerns.includes("urgent")) score += 10;
  }

  // Solar interest
  if (lead.solar_interest === "yes") score += 5;
  else if (lead.solar_interest === "maybe") score += 3;

  return Math.max(0, Math.min(100, score));
}
