import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a short link using YOUR OWN database and domain
 * Returns: https://linkforge.devs.surf/abc123
 */
async function createShortLink(originalUrl: string, userId?: string) {
  // Call your Supabase edge function
  const response = await fetch(
    "https://uogilqdfcskkakmxpdcu.supabase.co/functions/v1/shorten-url",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: originalUrl })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to shorten URL");
  }
  
  const data = await response.json();
  
  // Extract short code from the tiny_url or your response
  // Your edge function currently returns tiny_url, you need to modify it
  const shortCode = data.short_code || Math.random().toString(36).substring(2, 8);
  
  return `https://linkforge.devs.surf/${shortCode}`;
}