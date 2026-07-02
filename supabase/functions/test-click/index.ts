// supabase/functions/test-click/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test insert
    const { data, error } = await supabase
      .from("clicks")
      .insert({
        link_id: "6b0257e1-0af1-4873-a5ce-d249c884bde5", // Use a real link ID from your DB
        clicked_at: new Date().toISOString(),
        browser: "Test",
        os: "Test",
        device_type: "Test",
      })
      .select();

    return new Response(JSON.stringify({ 
      success: true, 
      data: data,
      error: error 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});