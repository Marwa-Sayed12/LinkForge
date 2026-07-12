const SHORTIO_API_KEY = "";
const SHORTIO_DOMAIN = "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    const response = await fetch("https://api.short.io/links", {
  method: "POST",
  headers: {
    "Authorization": SHORTIO_API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    domain: "linkforge.website",
    originalURL: "https://example.com/long-url"
  })
});
const data = await response.json();
console.log(data.shortURL); 

    
    const data = await response.json();
    
    return new Response(JSON.stringify({ short_url: data.shortURL }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});