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

  // Verify caller is authenticated
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
    const { street, city, state, zip } = await req.json();
    if (!street || !zip) {
      return new Response(JSON.stringify({ error: "street and zip are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const basicAuth = btoa(`${ihmAccessKey}:${ihmAccessSecret}`);

    // Step 1: Create/update address marker to get AddressMarker_id
    const markerRes = await fetch(`${IHM_BASE}/AddressMonitoringImport2g`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        street,
        city: city || "",
        state: state || "TX",
        zip,
        customer_name: "",
        customer_phone: "",
        customer_mobile: "",
        customer_email: "",
        comment1: "",
        comment2: "",
        comment3: "",
        address_monitoring_size: 0,
        status: "Monitoring",
        salesman_email: "",
        AddressMarker_id: "",
        external_key: "",
        integration_partner: 2,
        latitude: "",
        longitude: "",
      }),
    });

    if (!markerRes.ok) {
      const errText = await markerRes.text();
      console.error("IHM marker error:", markerRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to create address marker", details: errText }),
        { status: markerRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markerData = await markerRes.json();
    if (!markerData.success || !markerData.AddressMarker_id) {
      return new Response(
        JSON.stringify({ error: "Failed to create address marker", details: markerData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markerId = markerData.AddressMarker_id;

    // Step 2: Get hail impact history for the marker (last 60 months)
    const hailUrl = `${IHM_BASE}/ImpactDatesForAddressMarker?AddressMarker_id=${markerId}&Months=60`;
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
        address: `${street}, ${city || ""} ${state || ""} ${zip}`.trim(),
        marker_id: markerId,
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
