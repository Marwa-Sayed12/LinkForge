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

export async function getShortIoStats(shortCode: string) {
  try {
    // Check cache
    const cached = statsCache.get(shortCode);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached stats for: ${shortCode}`);
      return cached.data;
    }

    console.log(`Fetching stats for short code: ${shortCode}`);
    
    let response = await fetch(`/api/shortcode?shortCode=${shortCode}`);
    
    if (!response.ok && response.status !== 404) {
      console.log('Trying path format...');
      response = await fetch(`/api/${shortCode}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      
      if (response.status === 404) {
        const emptyStats = {
          totalClicks: 0,
          humanClicks: 0,
          clicks: 0,
          clicksByDate: {},
          devices: {},
          countries: {},
          browsers: {},
          oss: {},
          referrers: {},
          recentClicks: [],
        };
        statsCache.set(shortCode, { data: emptyStats, timestamp: Date.now() });
        return emptyStats;
      }
      return null;
    }
    
    const data = await response.json();
    console.log('Stats data from API:', data);
    
    // Cache the result
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