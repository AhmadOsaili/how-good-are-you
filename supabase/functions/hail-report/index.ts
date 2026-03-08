import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IHM_BASE = "https://maps.interactivehailmaps.com/ExternalApi";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ihmAccessKey = Deno.env.get("IHM_ACCESS_KEY");
  const ihmAccessSecret = Deno.env.get("IHM_ACCESS_SECRET");
  const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

  if (!ihmAccessKey || !ihmAccessSecret) {
    return new Response(JSON.stringify({ error: "IHM credentials not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!googleApiKey) {
    return new Response(JSON.stringify({ error: "Google API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { street, city, state, zip } = await req.json();
    if (!street || !zip) {
      return new Response(JSON.stringify({ error: "street and zip are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const addressParts = [street, city, state, zip].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    // Step 1: Geocode with Google to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not geocode address" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Step 2: Get hail impact history from IHM using lat/lng
    const basicAuth = btoa(`${ihmAccessKey}:${ihmAccessSecret}`);
    const hailUrl = `${IHM_BASE}/ImpactDatesForLatLong?Lat=${lat}&Long=${lng}&Months=60`;
    const hailRes = await fetch(hailUrl, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });

    if (!hailRes.ok) {
      const errText = await hailRes.text();
      console.error("IHM hail history error:", hailRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch hail history", details: errText }),
        { status: hailRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hailData = await hailRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        address: fullAddress,
        lat,
        lng,
        hail_data: hailData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Hail report error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
