
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SHORTIO_API_KEY = process.env.SHORTIO_API_KEY;
const SHORTIO_DOMAIN = process.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `https://api.short.io/api/links?domain=${SHORTIO_DOMAIN}&limit=100`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': SHORTIO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch links from Short.io');
    }

    const links = await response.json();
    let added = 0;
    let skipped = 0;

    for (const link of links) {
      const { data: existing } = await supabase
        .from('links')
        .select('id')
        .eq('short_code', link.path)
        .single();

      if (!existing) {
        const { error } = await supabase.from('links').insert({
          short_code: link.path,
          original_url: link.originalURL,
          short_url: `https://${SHORTIO_DOMAIN}/${link.path}`,
          is_active: true,
          clicks: 0,
          user_id: null,
        });

        if (error) {
          console.error('Error adding link:', link.path, error);
        } else {
          added++;
        }
      } else {
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      total: links.length,
      added: added,
      skipped: skipped,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}