import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  // Get the short code from the path (remove the leading slash)
  const shortCode = event.path.replace(/^\/|\/$/g, '');
  
  console.log("Looking for short code:", shortCode);
  
  if (!shortCode || shortCode === "favicon.ico") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing short code" })
    };
  }
  
  // Get Supabase credentials from Netlify environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration error" })
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: link, error } = await supabase
    .from("links")
    .select("original_url, is_active")
    .eq("short_code", shortCode)
    .single();
  
  if (error || !link) {
    console.error("Link not found:", shortCode);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Link not found", code: shortCode })
    };
  }
  
  if (!link.is_active) {
    return {
      statusCode: 410,
      body: JSON.stringify({ error: "Link is inactive" })
    };
  }
  
  console.log("Redirecting to:", link.original_url);
  
  // Return a 302 redirect
  return {
    statusCode: 302,
    headers: {
      Location: link.original_url,
      "Cache-Control": "no-cache, no-store"
    },
    body: ""
  };
};