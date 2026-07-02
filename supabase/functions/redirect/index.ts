// supabase/functions/redirect/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1];
    
    console.log("🔴 Redirecting short code:", shortCode);

    if (!shortCode || shortCode === "favicon.ico" || shortCode === "redirect") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with SERVICE_ROLE_KEY (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ✅ Step 1: Find the link in database
    let { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", shortCode)
      .maybeSingle();

    // If not found, try case-insensitive
    if (!link) {
      console.log("🔍 Trying case-insensitive search...");
      const { data: linkCI } = await supabase
        .from("links")
        .select("id, original_url, is_active")
        .ilike("short_code", shortCode)
        .maybeSingle();
      
      if (linkCI) {
        link = linkCI;
        console.log("✅ Found with case-insensitive match");
      }
    }

    if (!link) {
      console.error("❌ Link not found:", shortCode);
      return new Response(JSON.stringify({ 
        error: "Link not found",
        shortCode: shortCode 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Link found:", link.id);

    if (!link.is_active) {
      return new Response(JSON.stringify({ error: "Link is inactive" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Step 2: RECORD THE CLICK (before redirecting)
    console.log("📝 Recording click for link:", link.id);
    
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

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const country = req.headers.get("x-country") || req.headers.get("cf-ipcountry") || null;
    const city = req.headers.get("x-city") || req.headers.get("cf-ipcity") || null;
    const referrer = req.headers.get("referer") || null;

    // Insert the click
    const { error: clickError } = await supabase.from("clicks").insert({
      link_id: link.id,
      browser,
      os,
      device_type,
      country,
      city,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
      clicked_at: new Date().toISOString(),
    });

    if (clickError) {
      console.error("❌ Click recording error:", clickError);
    } else {
      console.log("✅ Click recorded successfully!");
    }

    // ✅ Step 3: Redirect to original URL
    console.log("➡️ Redirecting to:", link.original_url);
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": link.original_url,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});