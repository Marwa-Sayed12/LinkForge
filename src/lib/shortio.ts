// src/lib/shortio.ts

import { createClient } from '@short.io/client-browser';

const client = createClient({
  publicKey: 'pk_oWipAuN2BvoaIHFi'
});

const DOMAIN = 's.linkforge.website';

// ✅ Simple cache for stats
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

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

// src/lib/shortio.ts

// ✅ New function: Fetch multiple stats at once
// Add this function to src/lib/shortio.ts

export async function getShortIoStatsBatch(shortCodes: string[]) {
  try {
    if (!shortCodes.length) return {};
    
    const response = await fetch(`/api/stats/batch?shortCodes=${shortCodes.join(',')}`);
    
    if (!response.ok) {
      console.error('Batch API error:', await response.text());
      return {};
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    return {};
  }
}
// Keep individual function for fallback
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