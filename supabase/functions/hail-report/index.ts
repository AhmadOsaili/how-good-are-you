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

    // Step 1: Create/update address marker via AddressMonitoringImport2g
    const importUrl = `${IHM_BASE}/AddressMonitoringImport2g`;
    const importBody = {
      street,
      city: city || "",
      state: state || "",
      zip,
      customer_name: null,
      customer_phone: null,
      customer_mobile: null,
      customer_email: null,
      comment1: null,
      comment2: null,
      comment3: null,
      address_monitoring_size: 0,
      status: null,
      salesman_email: null,
      AddressMarker_id: null,
      external_key: null,
      integration_partner: 2,
      latitude: null,
      longitude: null,
    };

    console.log("Calling AddressMonitoringImport2g with:", JSON.stringify(importBody));

    const importRes = await fetch(importUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        "User-Agent": "App",
        "X-Forwarded-For": "0.0.0.0",
      },
      body: JSON.stringify(importBody),
    });

    if (!importRes.ok) {
      const errText = await importRes.text();
      console.error("IHM import error:", importRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to create address marker", details: errText }),
        { status: importRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const importData = await importRes.json();
    console.log("AddressMonitoringImport2g response:", JSON.stringify(importData));

    if (!importData.success || !importData.AddressMarker_id) {
      return new Response(
        JSON.stringify({ error: "Failed to create address marker", details: importData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markerId = importData.AddressMarker_id;

    // Step 2: Get hail impact history using the marker ID
    const hailUrl = `${IHM_BASE}/ImpactDatesForAddressMarker?AddressMarker_id=${markerId}&Months=60`;
    const hailRes = await fetch(hailUrl, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "User-Agent": "App",
      },
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

    const addressParts = [street, city, state, zip].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    return new Response(
      JSON.stringify({
        success: true,
        address: fullAddress,
        address_marker_id: markerId,
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
