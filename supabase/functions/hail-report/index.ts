import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify caller is authenticated admin
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
  if (!ihmAccessKey || !ihmAccessSecret) {
    return new Response(JSON.stringify({ error: "IHM credentials not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { address } = await req.json();
    if (!address) {
      return new Response(JSON.stringify({ error: "address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const basicAuth = btoa(`${ihmAccessKey}:${ihmAccessSecret}`);

    // Step 1: Geocode the address using IHM's address search
    const geocodeUrl = `https://api.interactivehailmaps.com/v1/address/search?query=${encodeURIComponent(address)}`;
    const geocodeRes = await fetch(geocodeUrl, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });

    if (!geocodeRes.ok) {
      const errText = await geocodeRes.text();
      console.error("IHM geocode error:", geocodeRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to geocode address", details: errText }),
        { status: geocodeRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geocodeData = await geocodeRes.json();

    // Extract coordinates from geocode result
    let lat: number | null = null;
    let lng: number | null = null;

    if (Array.isArray(geocodeData) && geocodeData.length > 0) {
      lat = geocodeData[0].latitude ?? geocodeData[0].lat;
      lng = geocodeData[0].longitude ?? geocodeData[0].lng ?? geocodeData[0].lon;
    } else if (geocodeData.latitude || geocodeData.lat) {
      lat = geocodeData.latitude ?? geocodeData.lat;
      lng = geocodeData.longitude ?? geocodeData.lng ?? geocodeData.lon;
    }

    if (lat == null || lng == null) {
      return new Response(
        JSON.stringify({ error: "Could not geocode address", geocode_response: geocodeData }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get hail history for the coordinates
    const hailUrl = `https://api.interactivehailmaps.com/v1/hail/history?lat=${lat}&lng=${lng}`;
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
      JSON.stringify({ success: true, address, lat, lng, hail_data: hailData }),
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
