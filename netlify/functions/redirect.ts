import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  // Get the short code from the URL path
  const shortCode = event.path.replace(/^\/|\/$/g, '');
  
  console.log("Function called. Path:", event.path);
  console.log("Short code:", shortCode);
  
  if (!shortCode || shortCode === "favicon.ico") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing short code" })
    };
  }
  
  // Get Supabase credentials from Netlify environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SERVICE_ROLE_KEY;  // Note: no SUPABASE_ prefix
  
  console.log("Supabase URL exists:", !!supabaseUrl);
  console.log("Supabase Key exists:", !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing configuration", supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: link, error } = await supabase
    .from("links")
    .select("original_url")
    .eq("short_code", shortCode)
    .single();
  
  if (error) {
    console.error("Database error:", error);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Link not found", code: shortCode })
    };
  }
  
  if (!link) {
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