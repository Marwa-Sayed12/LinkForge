// supabase/functions/redirect/index.ts

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
    // ✅ FIX: Get the short code from the path correctly
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1];
    
    console.log("🔴 Redirecting short code:", shortCode);
    console.log("🔴 Full URL:", req.url);
    console.log("🔴 Path parts:", pathParts);

    if (!shortCode || shortCode === "favicon.ico" || shortCode === "redirect") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Use SERVICE_ROLE_KEY
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    console.log("🔑 Using service role key");
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ✅ Clean the short code
    const cleanShortCode = shortCode.trim().toLowerCase();
    console.log("🔍 Searching for short code:", cleanShortCode);

    // ✅ FIRST: Try exact match (case-sensitive)
    let { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", cleanShortCode)
      .maybeSingle();

    // ✅ SECOND: If not found, try case-insensitive
    if (!link && !linkError) {
      console.log("🔍 Exact match failed, trying case-insensitive...");
      const { data: linkCI, error: linkCIError } = await supabase
        .from("links")
        .select("id, original_url, is_active")
        .ilike("short_code", cleanShortCode)
        .maybeSingle();
      
      if (linkCIError) {
        console.error("❌ Case-insensitive error:", linkCIError);
      }
      
      if (linkCI) {
        link = linkCI;
        linkError = null;
        console.log("✅ Found with case-insensitive match");
      }
    }

    if (linkError) {
      console.error("❌ Database error:", linkError);
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: linkError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!link) {
      console.error("❌ Link not found:", cleanShortCode);
      
      // ✅ Get all links for debugging
      const { data: allLinks, error: listError } = await supabase
        .from("links")
        .select("short_code, original_url")
        .limit(20);
      
      console.log("📊 Links in database:", allLinks?.map(l => l.short_code));
      
      return new Response(JSON.stringify({ 
        error: "Link not found",
        shortCode: cleanShortCode,
        availableLinks: allLinks?.map(l => l.short_code) || [],
        details: "Check if your short code exists in the database"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Link found:", link.id, link.original_url);

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

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const country = req.headers.get("x-country") || req.headers.get("cf-ipcountry") || null;
    const city = req.headers.get("x-city") || req.headers.get("cf-ipcity") || null;
    const referrer = req.headers.get("referer") || null;

    // ✅ RECORD THE CLICK
    console.log("📝 Recording click for link:", link.id);
    
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
    });

    if (clickError) {
      console.error("❌ Error recording click:", clickError);
    } else {
      console.log("✅ Click recorded for:", cleanShortCode);
    }

    // ✅ Redirect to original URL
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