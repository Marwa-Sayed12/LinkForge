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

// ✅ FIXED: Use your Vercel API proxy (NO CORS!)
export async function getShortIoStats(shortCode: string) {
  try {
    // Use your Vercel API endpoint - NOT direct Short.io
    const response = await fetch(`/api/shortio-stats/${shortCode}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error('Failed to fetch stats');
    }
    
    const data = await response.json();
    console.log('Stats data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}