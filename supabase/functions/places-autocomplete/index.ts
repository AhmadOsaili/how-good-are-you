const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Google Places API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, input, place_id } = await req.json();

    if (action === "autocomplete") {
      if (!input) {
        return new Response(JSON.stringify({ predictions: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      return new Response(JSON.stringify({ predictions: data.predictions || [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      if (!place_id) {
        return new Response(JSON.stringify({ error: "place_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=address_components,formatted_address&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      const components = data.result?.address_components || [];
      const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";
      const getShort = (type: string) => components.find((c: any) => c.types.includes(type))?.short_name || "";

      return new Response(JSON.stringify({
        formatted_address: data.result?.formatted_address || "",
        street: `${get("street_number")} ${get("route")}`.trim(),
        city: get("locality") || get("sublocality"),
        state: getShort("administrative_area_level_1"),
        zip: get("postal_code"),
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Places API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
