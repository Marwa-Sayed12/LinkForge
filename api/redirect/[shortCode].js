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
    // Get the link from Supabase
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, original_url, is_active')
      .eq('short_code', shortCode)
      .single();

    if (linkError || !link) {
      console.error('Link not found:', shortCode);
      return res.status(404).json({ error: 'Link not found' });
    }

    if (!link.is_active) {
      return res.status(410).json({ error: 'Link is inactive' });
    }

    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
    let browser = 'Unknown', os = 'Unknown', device_type = 'Desktop';
    
    if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/') && userAgent.includes('Safari/')) browser = 'Chrome';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Safari';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) os = 'macOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    if (userAgent.includes('Mobile')) device_type = 'Mobile';
    else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) device_type = 'Tablet';

    // Get IP and location
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null;
    const country = req.headers['x-country'] || req.headers['cf-ipcountry'] || null;
    const city = req.headers['x-city'] || req.headers['cf-ipcity'] || null;
    const referrer = req.headers['referer'] || null;

    // ✅ RECORD THE CLICK
    const { error: clickError } = await supabase.from('clicks').insert({
      link_id: link.id,
      browser,
      os,
      device_type,
      country,
      city,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
    });

    if (clickError) {
      console.error('Error recording click:', clickError);
    } else {
      console.log('✅ Click recorded for:', shortCode);
    }

    // Redirect to original URL
    return res.redirect(302, link.original_url);
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}