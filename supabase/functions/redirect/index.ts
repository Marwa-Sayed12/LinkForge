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
    const shortCode = url.pathname.split('/').filter(Boolean).pop();
    
    console.log("🔴 Processing short code:", shortCode);

    if (!shortCode || shortCode === "favicon.ico") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ✅ Find the link
    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (linkError || !link) {
      console.error("❌ Link not found:", shortCode);
      return new Response(JSON.stringify({ error: "Link not found" }), {
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

    // ✅ RECORD THE CLICK
    console.log("📝 Recording click for link:", link.id);
    
    const { error: clickError } = await supabase.from("clicks").insert({
      link_id: link.id,
      clicked_at: new Date().toISOString(),
      user_agent: req.headers.get("user-agent") || "Unknown",
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      referrer: req.headers.get("referer") || null,
    });

    if (clickError) {
      console.error("❌ Click recording error:", clickError);
      // Still redirect even if click recording fails
    } else {
      console.log("✅ Click recorded successfully!");
    }

    // ✅ Redirect to original URL
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