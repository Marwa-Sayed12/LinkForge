import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get short code from query parameter (this is what Netlify sends)
    let shortCode = url.searchParams.get("code");
    
    // If not in query, try path
    if (!shortCode) {
      shortCode = url.pathname.substring(1);
    }
    
    // Clean up - remove any extra prefixes
    if (shortCode) {
      // Remove any "redirect" prefix if it somehow gets added
      shortCode = shortCode.replace(/^redirect/, '');
      shortCode = shortCode.replace(/[/?#]/g, '').trim();
    }
    
    console.log("Short code received:", shortCode);

    if (!shortCode || shortCode === "" || shortCode === "favicon.ico") {
      return new Response(JSON.stringify({ error: "Missing short code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, original_url, is_active")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (linkError) {
      console.error("Database error:", linkError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!link) {
      console.error("Link not found for:", shortCode);
      return new Response(JSON.stringify({ error: "Link not found", code: shortCode }), {
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

    console.log("Redirecting to:", link.original_url);

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": link.original_url,
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});