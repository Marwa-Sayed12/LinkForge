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
    // 1️⃣ TRY SUPABASE FIRST
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, original_url, is_active, clicks')
      .eq('short_code', shortCode)
      .single();

    if (link && link.is_active) {
      // ✅ Increment click count safely
      const { error: updateError } = await supabase
        .from('links')
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq('id', link.id);

      if (updateError) {
        console.error('❌ Failed to update click count:', updateError);
      }

      // Record click for analytics
      await supabase.from('clicks').insert({
        link_id: link.id,
        clicked_at: new Date().toISOString(),
        user_agent: req.headers['user-agent'] || 'Unknown',
        ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
        referrer: req.headers['referer'] || null,
      }).catch(err => console.error('Failed to record click:', err));

      return res.redirect(302, link.original_url);
    }

    // 2️⃣ FALLBACK TO SHORT.IO
    console.log('🔄 Link not in Supabase, checking Short.io:', shortCode);
    
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
      return res.status(404).json({ error: 'Link not found' });
    }

    const shortioData = await shortioResponse.json();
    const originalUrl = shortioData.originalURL || shortioData.originalUrl || shortioData.longUrl;
    
    if (!originalUrl) {
      console.error('❌ No URL found in Short.io response:', shortioData);
      return res.status(404).json({ error: 'Invalid link data' });
    }

    // 3️⃣ MIGRATE TO SUPABASE
    const { data: newLink, error: insertError } = await supabase
      .from('links')
      .insert({
        short_code: shortCode,
        original_url: originalUrl,
        short_url: `https://${domain}/${shortCode}`,
        is_active: true,
        clicks: 1, // Start with 1 since we're redirecting now
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Failed to migrate link to Supabase:', insertError);
      // Still redirect even if migration fails
    }

    // Record the click if migration succeeded
    if (newLink) {
      await supabase.from('clicks').insert({
        link_id: newLink.id,
        clicked_at: new Date().toISOString(),
        user_agent: req.headers['user-agent'] || 'Unknown',
        ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
        referrer: req.headers['referer'] || null,
      });
    }

    return res.redirect(302, originalUrl);

  } catch (error) {
    console.error('❌ Redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}