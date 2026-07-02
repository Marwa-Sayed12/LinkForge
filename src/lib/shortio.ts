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

// ✅ Get click counts from Supabase (for MyLinks page)
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

// ✅ Get clicks for multiple links (for MyLinks page)
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

// ✅ Get total clicks for a user (for Overview)
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

// ✅ MAIN: Get full stats from Short.io (for Analytics page)
export async function getShortIoStats(shortCode: string) {
  try {
    // Check cache first
    const cached = statsCache.get(shortCode);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const response = await fetch(`/api/shortcode?shortCode=${shortCode}`);
    
    if (!response.ok) {
      console.warn(`API error for ${shortCode}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    statsCache.set(shortCode, { data: data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

// Cache for stats
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}