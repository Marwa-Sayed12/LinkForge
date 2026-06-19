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

// Get stats from Short.io using your secret key
export async function getShortIoStats(shortCode: string) {
  try {
    const response = await fetch(`https://api.short.io/links/${shortCode}/stats`, {
      headers: {
        'Authorization': 'sk_K2F0tqEH8xIJSNJx' 
      }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}