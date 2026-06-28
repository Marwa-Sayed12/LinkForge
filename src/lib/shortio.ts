// src/lib/shortio.ts

import { createClient } from '@short.io/client-browser';
import { supabase } from '@/integrations/supabase/client';

const client = createClient({
  publicKey: 'pk_oWipAuN2BvoaIHFi'
});

const DOMAIN = 's.linkforge.website';

export async function createShortLink(originalUrl: string, customSlug?: string) {
  try {
    const result = await client.createLink({
      domain: DOMAIN,
      originalURL: originalUrl,
      path: customSlug || undefined
    });
    
    return {
      shortUrl: result.shortURL,
      shortCode: result.path || result.shortURL.split('/').pop(),
      id: result.id,
    };
  } catch (error) {
    console.error('Short.io error:', error);
    throw new Error('Failed to create short link');
  }
}

// ✅ Get click counts from Supabase
export async function getLinkClicks(shortCode: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('clicks')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      console.error('Error fetching clicks:', error);
      return 0;
    }

    return data?.clicks || 0;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}

// ✅ Get clicks for multiple links
export async function getMultipleLinkClicks(shortCodes: string[]): Promise<Record<string, number>> {
  try {
    if (!shortCodes.length) return {};

    const { data, error } = await supabase
      .from('links')
      .select('short_code, clicks')
      .in('short_code', shortCodes);

    if (error) {
      console.error('Error fetching multiple clicks:', error);
      return {};
    }

    const result: Record<string, number> = {};
    data?.forEach(link => {
      result[link.short_code] = link.clicks || 0;
    });
    return result;
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
}

// ✅ Get clicks by date for a link
export async function getLinkClicksByDate(linkId: string, days = 30): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('clicks')
      .select('clicked_at')
      .eq('link_id', linkId)
      .gte('clicked_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('clicked_at', { ascending: true });

    if (error) {
      console.error('Error fetching clicks by date:', error);
      return {};
    }

    const result: Record<string, number> = {};
    data?.forEach(click => {
      const date = new Date(click.clicked_at).toISOString().split('T')[0];
      result[date] = (result[date] || 0) + 1;
    });
    return result;
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
}

// ✅ Get total clicks for a user
export async function getUserTotalClicks(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('clicks')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user clicks:', error);
      return 0;
    }

    return data?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}

// Keep for backward compatibility
export async function getShortIoStats(shortCode: string) {
  try {
    const clicks = await getLinkClicks(shortCode);
    return {
      totalClicks: clicks,
      humanClicks: clicks,
      clicks: clicks,
      clicksByDate: {},
      devices: {},
      countries: {},
      browsers: {},
      oss: {},
      referrers: {},
      recentClicks: [],
    };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}