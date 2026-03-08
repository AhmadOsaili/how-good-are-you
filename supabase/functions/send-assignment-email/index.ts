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

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { lead_id, company_id, notify = "both" } = await req.json();
    // notify: "both" | "company" | "lead"

    // Fetch lead and company details
    const [leadRes, companyRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", lead_id).single(),
      supabase.from("companies").select("*").eq("id", company_id).single(),
    ]);

    if (leadRes.error || companyRes.error) {
      throw new Error("Failed to fetch lead or company data");
    }

    const lead = leadRes.data;
    const company = companyRes.data;
    const emails: Promise<Response>[] = [];

    // Email to the company (if they have an email)
    if (company.email) {
      emails.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RoofConnect <onboarding@resend.dev>",
            to: [company.email],
            subject: `New Lead Assigned: ${lead.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1a1a1a; font-size: 24px;">New Lead Assigned to You</h1>
                <p style="color: #555; font-size: 16px;">A new homeowner lead has been assigned to your company.</p>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 0;">Lead Details</h2>
                  <table style="width: 100%; font-size: 14px; color: #333;">
                    <tr><td style="padding: 6px 0; font-weight: bold;">Name:</td><td>${lead.name}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${lead.email}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Phone:</td><td>${lead.phone}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Address:</td><td>${lead.address}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">ZIP Code:</td><td>${lead.zip_code}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Roof Age:</td><td>${lead.roof_age}</td></tr>
                    ${lead.concerns ? `<tr><td style="padding: 6px 0; font-weight: bold;">Concerns:</td><td>${lead.concerns}</td></tr>` : ""}
                  </table>
                </div>
                <p style="color: #555; font-size: 14px;">Please reach out to this homeowner as soon as possible.</p>
              </div>
            `,
          }),
        })
      );
    }

    // Email to the homeowner
    emails.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "RoofConnect <onboarding@resend.dev>",
          to: [lead.email],
          subject: "Great News! A Roofing Expert Will Contact You Soon",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px;">You're in Good Hands!</h1>
              <p style="color: #555; font-size: 16px;">Hi ${lead.name},</p>
              <p style="color: #555; font-size: 16px;">
                Thank you for reaching out about your roofing needs. We've matched you with 
                <strong>${company.name}</strong>, a trusted roofing company in your area.
              </p>
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #333; font-size: 14px; margin: 0;">
                  <strong>${company.name}</strong> will be reaching out to you shortly to discuss your roofing project.
                </p>
              </div>
              <p style="color: #555; font-size: 14px;">
                If you have any questions in the meantime, feel free to reply to this email.
              </p>
              <p style="color: #555; font-size: 14px;">Best regards,<br/>The RoofConnect Team</p>
            </div>
          `,
        }),
      })
    );

    const results = await Promise.all(emails);
    const errors: string[] = [];

    for (const res of results) {
      if (!res.ok) {
        const body = await res.text();
        errors.push(`Resend API error [${res.status}]: ${body}`);
      }
    }

    if (errors.length > 0) {
      console.error("Email send errors:", errors);
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent: results.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
