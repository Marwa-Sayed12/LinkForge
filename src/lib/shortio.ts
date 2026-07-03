// src/lib/shortio.ts

import { createClient } from '@short.io/client-browser';
import { supabase } from '@/integrations/supabase/client';

const client = createClient({
  publicKey: 'pk_oWipAuN2BvoaIHFi'
});

const DOMAIN = 's.linkforge.website';

// Cache for Short.io API stats (for analytics only)
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

// ✅ Get click count from Supabase (for MyLinks & Overview)
export async function getLinkClicks(shortCode: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('clicks')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      console.error('Error fetching clicks from Supabase:', error);
      return 0;
    }

    return data?.clicks || 0;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
}

// ✅ Get multiple link clicks from Supabase (for MyLinks)
export async function getMultipleLinkClicks(shortCodes: string[]): Promise<Record<string, number>> {
  try {
    if (!shortCodes || shortCodes.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('links')
      .select('id, short_code, clicks')
      .in('short_code', shortCodes);

    if (error) {
      console.error('Error fetching multiple clicks from Supabase:', error);
      return {};
    }

    const result: Record<string, number> = {};
    data?.forEach(link => {
      result[link.short_code] = link.clicks || 0;
    });
    
    // Map by ID for easy lookup
    const resultById: Record<string, number> = {};
    data?.forEach(link => {
      resultById[link.id] = link.clicks || 0;
    });
    
    // Return both formats - by short_code for lookup
    return result;
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
}

// ✅ Get total clicks for a user from Supabase
export async function getUserTotalClicks(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('clicks')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user clicks from Supabase:', error);
      return 0;
    }

    return data?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0;
  } catch (error) {
    console.error('Error:', error);
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