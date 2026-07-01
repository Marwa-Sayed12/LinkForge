// supabase/functions/redirect/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Short.io API config
const SHORTIO_API_KEY = Deno.env.get('SHORTIO_API_KEY') || '';
const SHORTIO_DOMAIN = Deno.env.get('VITE_SHORTIO_DOMAIN') || 's.linkforge.website';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shortCode = url.pathname.substring(1);
    
    console.log("🔄 Redirecting short code:", shortCode);

    if (!shortCode || shortCode === "favicon.ico") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ STEP 1: Look up the link in Supabase first
    let { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", shortCode)
      .single();

    let originalUrl = null;
    let linkId = null;

    // ✅ STEP 2: If not in Supabase, try Short.io
    if (linkError || !link) {
      console.log("🔍 Link not in Supabase, checking Short.io:", shortCode);
      
      try {
        // Get link from Short.io
        const linkInfoResponse = await fetch(
          `https://api.short.io/links/expand?domain=${SHORTIO_DOMAIN}&path=${shortCode}`,
          {
            headers: {
              'accept': 'application/json',
              'authorization': SHORTIO_API_KEY,
            },
          }
        );

        if (!linkInfoResponse.ok) {
          console.error("❌ Link not found in Short.io:", shortCode);
          return new Response(JSON.stringify({ error: "Link not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const linkData = await linkInfoResponse.json();
        originalUrl = linkData.originalURL;
        linkId = linkData.id;

        // ✅ STEP 3: Save the link to Supabase for future
        console.log("💾 Saving link to Supabase:", shortCode);
        
        const { error: insertError } = await supabase.from("links").insert({
          short_code: shortCode,
          original_url: originalUrl,
          short_url: `https://${SHORTIO_DOMAIN}/${shortCode}`,
          is_active: true,
          clicks: 0,
          user_id: null, // Will be null since we don't know who created it
        });

        if (insertError) {
          console.error("⚠️ Could not save to Supabase:", insertError);
        } else {
          console.log("✅ Link saved to Supabase:", shortCode);
        }

        // Get the newly inserted link
        const { data: newLink } = await supabase
          .from("links")
          .select("id")
          .eq("short_code", shortCode)
          .single();

        if (newLink) {
          linkId = newLink.id;
        }

      } catch (shortioError) {
        console.error("❌ Short.io error:", shortioError);
        return new Response(JSON.stringify({ error: "Link not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Link found in Supabase
      originalUrl = link.original_url;
      linkId = link.id;
      
      if (!link.is_active) {
        return new Response(JSON.stringify({ error: "Link is inactive" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!originalUrl || !linkId) {
      console.error("❌ Could not get original URL for:", shortCode);
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Link found:", linkId, originalUrl);

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

    // ✅ RECORD THE CLICK
    console.log("📝 Recording click for link:", linkId);
    
    const { error: clickError } = await supabase.from("clicks").insert({
      link_id: linkId,
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
      console.log("✅ Click recorded for:", shortCode);
    }

    // ✅ Redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": originalUrl,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});