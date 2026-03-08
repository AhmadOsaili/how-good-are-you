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

  // Diagnostic: log credential lengths (not values)
  console.log("IHM_ACCESS_KEY length:", ihmAccessKey.length);
  console.log("IHM_ACCESS_SECRET length:", ihmAccessSecret.length);
  console.log("IHM_ACCESS_KEY first 4 chars:", ihmAccessKey.substring(0, 4));

  try {
    const { street, city, state, zip } = await req.json();
    if (!street || !zip) {
      return new Response(JSON.stringify({ error: "street and zip are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const basicAuth = btoa(`${ihmAccessKey}:${ihmAccessSecret}`);
    console.log("Basic auth token length:", basicAuth.length);

    // Step 1: Create/update address marker via AddressMonitoringImport2g
    const importUrl = `${IHM_BASE}/AddressMonitoringImport2g`;
    const importBody = {
      street,
      city: city || "",
      state: state || "",
      zip,
    };

    console.log("Calling AddressMonitoringImport2g with:", JSON.stringify(importBody));
    console.log("URL:", importUrl);

    const importRes = await fetch(importUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(importBody),
    });

    console.log("IHM response status:", importRes.status);
    console.log("IHM response headers:", JSON.stringify(Object.fromEntries(importRes.headers.entries())));

    const responseText = await importRes.text();
    console.log("IHM response body (first 500 chars):", responseText.substring(0, 500));

    if (!importRes.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to create address marker", 
          status: importRes.status,
          details: responseText.substring(0, 200),
        }),
        { status: importRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let importData;
    try {
      importData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON response from IHM", details: responseText.substring(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    console.log("Fetching hail history from:", hailUrl);

    const hailRes = await fetch(hailUrl, {
      headers: {
        "Authorization": `Basic ${basicAuth}`,
      },
    });

    if (!hailRes.ok) {
      const errText = await hailRes.text();
      console.error("IHM hail history error:", hailRes.status, errText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to fetch hail history", details: errText.substring(0, 200) }),
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
