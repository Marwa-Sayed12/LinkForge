import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  const shortCode = event.path.replace(/^\/|\/$/g, '');
  
  console.log("Short code received:", shortCode);
  
  if (!shortCode || shortCode === "favicon.ico") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing short code" })
    };
  }
  
  // Use the exact environment variable names from Netlify
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;  // Changed from SERVICE_ROLE_KEY
  
  console.log("Supabase URL exists:", !!supabaseUrl);
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration missing", hasUrl: !!supabaseUrl, hasKey: !!supabaseKey })
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: link, error } = await supabase
    .from("links")
    .select("original_url")
    .eq("short_code", shortCode)
    .single();
  
  if (error || !link) {
    console.error("Link not found:", shortCode, error);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Link not found", code: shortCode })
    };
  }
  
  console.log("Redirecting to:", link.original_url);
  
  return {
    statusCode: 302,
    headers: { 
      Location: link.original_url,
      "Cache-Control": "no-cache"
    },
    body: ""
  };
};