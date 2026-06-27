// src/lib/shortio.ts

import { createClient } from '@short.io/client-browser';

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

// ✅ Fixed: Handles 404 gracefully by returning empty stats
export async function getShortIoStats(shortCode: string) {
  try {
    console.log(`Fetching stats for short code: ${shortCode}`);
    
    let response = await fetch(`/api/shortcode?shortCode=${shortCode}`);
    
    if (!response.ok && response.status !== 404) {
      console.log('Trying path format...');
      response = await fetch(`/api/${shortCode}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      
      // ✅ Return empty stats for 404 instead of null
      if (response.status === 404) {
        return {
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
      }
      return null;
    }
    
    const data = await response.json();
    console.log('Stats data from API:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}