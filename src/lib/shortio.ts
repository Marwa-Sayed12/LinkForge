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

// ✅ Try Vercel API first, fallback to direct if it fails
export async function getShortIoStats(shortCode: string) {
  try {
    // Try Vercel API route first
    console.log(`Trying Vercel API for short code: ${shortCode}`);
    const response = await fetch(`/api/${shortCode}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Stats data from Vercel API:', data);
      return data;
    }
    
    // If Vercel API fails, try direct (but this might have CORS issues)
    console.log('Vercel API failed, trying direct...');
    return await getShortIoStatsDirect(shortCode);
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

// Direct call to Short.io API (may have CORS issues in browser)
export async function getShortIoStatsDirect(shortCode: string) {
  const apiKey = import.meta.env.VITE_SHORTIO_API_KEY;
  const domain = import.meta.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

  if (!apiKey) {
    console.error('Short.io API key is missing');
    return null;
  }

  try {
    // Step 1: Get link info by path
    const linkInfoResponse = await fetch(
      `https://api.short.io/links/expand?domain=${domain}&path=${shortCode}`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': apiKey,
        },
      }
    );

    if (!linkInfoResponse.ok) {
      console.error('Failed to fetch link info:', await linkInfoResponse.text());
      return null;
    }

    const linkData = await linkInfoResponse.json();
    const linkId = linkData.id;

    if (!linkId) {
      console.error('Link ID not found');
      return null;
    }

    // Step 2: Get statistics
    const statsResponse = await fetch(
      `https://api-v2.short.io/statistics/link/${linkId}?period=total&tzOffset=0`,
      {
        headers: {
          'accept': '*/*',
          'authorization': apiKey,
        },
      }
    );

    if (!statsResponse.ok) {
      console.error('Failed to fetch stats:', await statsResponse.text());
      return null;
    }

    const statsData = await statsResponse.json();

    return {
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      interval: statsData.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      
      browsers: statsData.browser?.reduce((acc, item) => {
        acc[item.browser] = item.score;
        return acc;
      }, {}) || {},
      
      countries: statsData.country?.reduce((acc, item) => {
        acc[item.country] = item.score;
        return acc;
      }, {}) || {},
      
      oss: statsData.os?.reduce((acc, item) => {
        acc[item.os] = item.score;
        return acc;
      }, {}) || {},
      
      referrers: statsData.referer?.reduce((acc, item) => {
        acc[item.referer] = item.score;
        return acc;
      }, {}) || {},
      
      devices: {},
      recentClicks: [],
      
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
    };
  } catch (error) {
    console.error('Error fetching Short.io stats directly:', error);
    return null;
  }
}

export function getQRCodeUrl(shortCode: string) {
  return `https://api.short.io/links/${shortCode}/qrcode`;
}