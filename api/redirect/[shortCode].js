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
    const { data: link, error } = await supabase
      .from('links')
      .select('id, original_url, is_active')
      .eq('short_code', shortCode)
      .single();

    if (error || !link || !link.is_active) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const { error: incrementError } = await supabase
      .rpc('increment_clicks', { row_id: link.id });

    if (incrementError) {
      console.error(' Failed to increment clicks:', incrementError);
    }

    await supabase
      .from('clicks')
      .insert({
        link_id: link.id,
        clicked_at: new Date().toISOString(),
        user_agent: req.headers['user-agent'] || 'Unknown',
        ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
        referrer: req.headers['referer'] || null,
      })
      .catch(err => console.error('Failed to record click:', err));

    return res.redirect(302, link.original_url);

  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}