import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shortCode = url.pathname.substring(1);
    
    console.log("Redirecting short code:", shortCode);

    if (!shortCode || shortCode === "favicon.ico") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up the link
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", shortCode)
      .single();

    if (linkError || !link) {
      console.error("Link not found:", shortCode);
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!link.is_active) {
      return new Response(JSON.stringify({ error: "Link is inactive" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse user agent
    const userAgent = req.headers.get("user-agent") || "";
    let browser = "Unknown", os = "Unknown", device_type = "Desktop";
    
    if (userAgent.includes("Firefox/")) browser = "Firefox";
    else if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("Chrome/") && userAgent.includes("Safari/")) browser = "Chrome";
    else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) browser = "Safari";
    
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS X") || userAgent.includes("Macintosh")) os = "macOS";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
    
    if (userAgent.includes("Mobile")) device_type = "Mobile";
    else if (userAgent.includes("iPad") || userAgent.includes("Tablet")) device_type = "Tablet";

    // Get IP and location
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const country = req.headers.get("x-country") || req.headers.get("cf-ipcountry") || null;
    const city = req.headers.get("x-city") || req.headers.get("cf-ipcity") || null;
    const referrer = req.headers.get("referer") || null;

    // Record the click
    await supabase.from("clicks").insert({
      link_id: link.id,
      browser,
      os,
      device_type,
      country,
      city,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
    });

    // Return 302 redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": link.original_url,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
