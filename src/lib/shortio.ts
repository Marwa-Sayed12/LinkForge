import { createClient } from '@short.io/client-browser';

const client = createClient({
  publicKey: 'pk_oWipAuN2BvoaIHFi'
});

export async function createShortLink(originalUrl: string, customSlug?: string) {
  const result = await client.createLink({
    domain: 's.linkforge.website',
    originalURL: originalUrl,
    path: customSlug || undefined
  });
  
  return result.shortURL;
}

export async function getLinkStats(shortCode: string) {
  // For analytics, you may need a backend endpoint with your private key
  const response = await fetch(`/api/shortio/stats/${shortCode}`);
  return response.json();
}

export function getQRCode(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}