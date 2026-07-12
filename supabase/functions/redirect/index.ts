
import { createClient } from "@supabase/supabase-js"
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
    
    console.log("Processing short code:", shortCode);

    if (!shortCode || shortCode === "favicon.ico") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(" Missing Supabase credentials");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (linkError) {
      console.error(" Database error:", linkError);
      return new Response(JSON.stringify({ error: "Database error", details: linkError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!link) {
      console.error(" Link not found:", shortCode);
      
      const apiKey = Deno.env.get("SHORTIO_API_KEY") || Deno.env.get("VITE_SHORTIO_API_KEY");
      if (apiKey) {
        const shortioResponse = await fetch(
          `https://api.short.io/links/expand?domain=s.linkforge.website&path=${shortCode}`,
          {
            headers: { 'accept': 'application/json', 'authorization': apiKey },
          }
        );
        const shortioData = await shortioResponse.json();
        console.log("🔍 Short.io check:", shortioData);
      }
      
      return new Response(JSON.stringify({ 
        error: "Link not found",
        shortCode: shortCode,
        suggestion: "Make sure the link exists in Supabase"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(" Link found:", link.id, link.original_url);

    if (!link.is_active) {
      return new Response(JSON.stringify({ error: "Link is inactive" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📝 Recording click for link:", link.id);
    
    const clickData = {
      link_id: link.id,
      clicked_at: new Date().toISOString(),
      user_agent: req.headers.get("user-agent") || "Unknown",
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      referrer: req.headers.get("referer") || null,
    };
    
    console.log("📊 Click data:", clickData);
    
    const { error: clickError } = await supabase.from("clicks").insert(clickData);

    if (clickError) {
      console.error(" Click recording error:", clickError);
    } else {
      console.log(" Click recorded successfully!");
      
      const { error: updateError } = await supabase
        .from("links")
        .update({ clicks: supabase.rpc('increment_clicks', { row_id: link.id }) })
        .eq("id", link.id);
        
      if (updateError) {
        console.error(" Update error:", updateError);
      } else {
        console.log(" Clicks count updated!");
      }
    }

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
    console.error(" Error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});