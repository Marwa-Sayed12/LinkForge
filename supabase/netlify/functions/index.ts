import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const handler = async (event: any) => {
  // Get the short code from the path
  const shortCode = event.path.replace("/", "");
  
  console.log("Looking for short code:", shortCode);
  
  if (!shortCode || shortCode === "favicon.ico") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing short code" })
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
      body: JSON.stringify({ error: "Link not found" })
    };
  }
  
  if (!link.is_active) {
    return {
      statusCode: 410,
      body: JSON.stringify({ error: "Link is inactive" })
    };
  }
  
  // Return a 302 redirect
  return {
    statusCode: 302,
    headers: {
      Location: link.original_url,
      "Cache-Control": "no-cache"
    },
    body: ""
  };
};