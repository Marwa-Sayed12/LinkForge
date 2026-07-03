// api/redirect/[shortCode].js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { shortCode } = req.query;

  if (!shortCode) {
    return res.status(400).json({ error: 'Missing short code' });
  }

  try {
    // Get link info from Short.io
    const apiKey = process.env.SHORTIO_API_KEY;
    const domain = process.env.VITE_SHORTIO_DOMAIN;
    
    const shortioResponse = await fetch(
      `https://api.short.io/links/expand?domain=${domain}&path=${shortCode}`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': apiKey,
        },
      }
    );
    
    if (!shortioResponse.ok) {
      // Check Supabase fallback
      const { data: link, error: linkError } = await supabase
        .from('links')
        .select('original_url, is_active')
        .eq('short_code', shortCode)
        .single();

      if (link && link.is_active) {
        return res.redirect(302, link.original_url);
      }
      
      return res.status(404).json({ error: 'Link not found' });
    }

    const shortioData = await shortioResponse.json();
    const originalUrl = shortioData.originalURL || shortioData.originalUrl || shortioData.longUrl;
    
    if (!originalUrl) {
      console.error('❌ No URL found in Short.io response:', shortioData);
      return res.status(404).json({ error: 'Invalid link data' });
    }

    // ✅ Check if link exists in Supabase, if not, save it
    const { data: existingLink } = await supabase
      .from('links')
      .select('id')
      .eq('short_code', shortCode)
      .single();

    if (!existingLink) {
      // Save to Supabase for dashboard display
      await supabase.from('links').insert({
        short_code: shortCode,
        original_url: originalUrl,
        short_url: `https://${domain}/${shortCode}`,
        is_active: true,
        clicks: 0, // Clicks will come from Short.io
      });
    }

    // ✅ Redirect - Short.io handles the click tracking automatically
    return res.redirect(302, originalUrl);

  } catch (error) {
    console.error('❌ Redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}