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

// ✅ Use Vercel API route (no CORS issues!)
export async function getShortIoStats(shortCode: string) {
  try {
    console.log(`Fetching stats for short code: ${shortCode}`);
    const response = await fetch(`/api/${shortCode}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
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