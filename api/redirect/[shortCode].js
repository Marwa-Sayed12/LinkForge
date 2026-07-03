// api/redirect/[shortCode].js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { shortCode } = req.query;

  console.log('🔴 Redirect called for:', shortCode);

  if (!shortCode) {
    return res.status(400).json({ error: 'Missing short code' });
  }

  try {
    // 1️⃣ Check Supabase first
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, original_url, is_active')
      .eq('short_code', shortCode)
      .single();

    console.log('📊 Link found in Supabase:', link ? 'Yes' : 'No');

    if (link && link.is_active) {
      // ✅ INSERT into clicks table (this triggers the click count update)
      const { error: clickError } = await supabase
        .from('clicks')
        .insert({
          link_id: link.id,
          clicked_at: new Date().toISOString(),
          user_agent: req.headers['user-agent'] || 'Unknown',
          ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
          referrer: req.headers['referer'] || null,
          country: req.headers['cf-ipcountry'] || null,
          city: null,
          device_type: req.headers['sec-ch-ua-platform'] || null,
          browser: req.headers['sec-ch-ua'] || null,
          os: req.headers['sec-ch-ua-platform'] || null,
        });

      if (clickError) {
        console.error('❌ Failed to record click:', clickError);
        // Still redirect even if click recording fails
      } else {
        console.log('✅ Click recorded for:', shortCode);
      }

      // Redirect to the original URL
      console.log('➡️ Redirecting to:', link.original_url);
      return res.redirect(302, link.original_url);
    }

    // 2️⃣ Fallback to Short.io
    console.log('🔄 Link not in Supabase, checking Short.io:', shortCode);
    
    const apiKey = process.env.SHORTIO_API_KEY;
    const domain = process.env.VITE_SHORTIO_DOMAIN;
    
    if (!apiKey) {
      console.error('❌ SHORTIO_API_KEY not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

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
      console.error('❌ Short.io link not found:', shortCode);
      return res.status(404).json({ error: 'Link not found' });
    }

    const shortioData = await shortioResponse.json();
    const originalUrl = shortioData.originalURL || shortioData.originalUrl || shortioData.longUrl;
    
    if (!originalUrl) {
      console.error('❌ No URL found in Short.io response:', shortioData);
      return res.status(404).json({ error: 'Invalid link data' });
    }

    // 3️⃣ Migrate to Supabase
    const { data: newLink, error: insertError } = await supabase
      .from('links')
      .insert({
        short_code: shortCode,
        original_url: originalUrl,
        short_url: `https://${domain}/${shortCode}`,
        is_active: true,
        clicks: 0,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Failed to migrate link to Supabase:', insertError);
    }

    // ✅ Record the click if migration succeeded
    if (newLink) {
      const { error: clickError } = await supabase
        .from('clicks')
        .insert({
          link_id: newLink.id,
          clicked_at: new Date().toISOString(),
          user_agent: req.headers['user-agent'] || 'Unknown',
          ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
          referrer: req.headers['referer'] || null,
        });

      if (clickError) {
        console.error('❌ Failed to record click for migrated link:', clickError);
      }
    }

    return res.redirect(302, originalUrl);

  } catch (error) {
    console.error('❌ Redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}