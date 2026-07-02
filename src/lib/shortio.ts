// src/lib/shortio.ts

import { createClient } from '@short.io/client-browser';
import { supabase } from '@/integrations/supabase/client';

const client = createClient({
  publicKey: 'pk_oWipAuN2BvoaIHFi'
});

const DOMAIN = 's.linkforge.website';

// Cache for Short.io API
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

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

// ✅ Get click count from Short.io for a single link
export async function getLinkClicks(shortCode: string): Promise<number> {
  try {
    const response = await fetch(`/api/shortcode?shortCode=${shortCode}`);
    
    if (!response.ok) {
      console.warn(`Failed to get clicks for ${shortCode}`);
      return 0;
    }
    
    const data = await response.json();
    return data.totalClicks || 0;
  } catch (error) {
    console.error('Error fetching clicks:', error);
    return 0;
  }
}

// ✅ Get multiple link clicks from Short.io
export async function getMultipleLinkClicks(shortCodes: string[]): Promise<Record<string, number>> {
  try {
    if (!shortCodes.length) return {};

    const results: Record<string, number> = {};
    
    // Fetch each link's stats in parallel
    await Promise.all(
      shortCodes.map(async (shortCode) => {
        try {
          const response = await fetch(`/api/shortcode?shortCode=${shortCode}`);
          if (response.ok) {
            const data = await response.json();
            results[shortCode] = data.totalClicks || 0;
          } else {
            results[shortCode] = 0;
          }
        } catch (error) {
          console.error(`Error fetching stats for ${shortCode}:`, error);
          results[shortCode] = 0;
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Error fetching multiple clicks:', error);
    return {};
  }
}

// ✅ Get total clicks for a user from Short.io
export async function getUserTotalClicks(userId: string): Promise<number> {
  try {
    // Get all user's links from Supabase first
    const { data: links, error } = await supabase
      .from('links')
      .select('short_code')
      .eq('user_id', userId);

    if (error || !links || links.length === 0) {
      return 0;
    }

    // Get clicks for all links from Short.io
    const shortCodes = links.map(link => link.short_code);
    const counts = await getMultipleLinkClicks(shortCodes);
    
    // Sum up all clicks
    let total = 0;
    shortCodes.forEach(code => {
      total += counts[code] || 0;
    });
    
    return total;
  } catch (error) {
    console.error('Error getting user total clicks:', error);
    return 0;
  }
}

// ✅ For Analytics: Get FULL stats from Short.io API (countries, browsers, devices, OS)
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

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}