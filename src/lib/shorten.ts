import { supabase } from "@/integrations/supabase/client";

/**
 * Calls the TinyURL-backed edge function to shorten a long URL.
 * Returns the shortened URL (e.g. https://tinyurl.com/abc123).
 */
export async function shortenWithTinyUrl(url: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("shorten-url", {
    body: { url },
  });
  if (error) throw new Error(error.message);
  if (!data?.tiny_url) throw new Error(data?.error || "No short URL returned");
  return data.tiny_url as string;
}
