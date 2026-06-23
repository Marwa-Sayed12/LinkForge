// api/[shortCode].ts

import type { VercelRequest, VercelResponse } from '@vercel/node';



export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { shortCode } = req.query;

  if (!shortCode || Array.isArray(shortCode)) {
    return res.status(400).json({ error: 'Missing or invalid short code' });
  }

  try {
    const apiKey = process.env.SHORTIO_API_KEY || process.env.VITE_SHORTIO_API_KEY;
    const domain = process.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

    if (!apiKey) {
      console.error('Short.io API key is missing');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // STEP 1: Get the link info by path (short code)
    // Using: GET /links/expand?domain={domain}&path={shortCode}
    console.log(`Fetching link info for path: ${shortCode}`);
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
      const errorText = await linkInfoResponse.text();
      console.error('Failed to fetch link info:', errorText);
      
      if (linkInfoResponse.status === 404) {
        return res.status(404).json({ error: 'Link not found' });
      }
      return res.status(linkInfoResponse.status).json({ 
        error: 'Failed to fetch link info',
        details: errorText 
      });
    }

    const linkData = await linkInfoResponse.json();
    console.log('Link info:', linkData);

    // Get the link ID from the response
    const linkId = linkData.id;
    if (!linkId) {
      return res.status(404).json({ error: 'Link ID not found' });
    }

    console.log(`Found link ID: ${linkId} for short code: ${shortCode}`);

    // STEP 2: Get statistics using the link ID
    // Using: GET /statistics/link/{linkID}?period=total&tzOffset=0
    console.log(`Fetching stats for link ID: ${linkId}`);
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
      const errorText = await statsResponse.text();
      console.error(`Short.io API error (${statsResponse.status}):`, errorText);
      return res.status(statsResponse.status).json({ 
        error: 'Failed to fetch stats',
        details: errorText 
      });
    }

    const statsData = await statsResponse.json();
    console.log('Stats data received:', JSON.stringify(statsData, null, 2));

    // STEP 3: Transform the response for the frontend
    const transformedData = {
      // Basic stats
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      
      // Click statistics for charts
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      interval: statsData.interval || { 
        startDate: null, 
        endDate: null, 
        prevStartDate: null, 
        prevEndDate: null 
      },
      
      // Raw arrays from API (as documented)
      // Returns: { score: number, browser: string }[]
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
      
      // Convert to Record format for frontend
      // The frontend expects { "Chrome": 6, "Firefox": 1 } format
      browsers: statsData.browser?.reduce((acc: any, item: any) => {
        acc[item.browser] = item.score;
        return acc;
      }, {}) || {},
      
      countries: statsData.country?.reduce((acc: any, item: any) => {
        acc[item.country] = item.score;
        return acc;
      }, {}) || {},
      
      oss: statsData.os?.reduce((acc: any, item: any) => {
        acc[item.os] = item.score;
        return acc;
      }, {}) || {},
      
      referrers: statsData.referer?.reduce((acc: any, item: any) => {
        acc[item.referer] = item.score;
        return acc;
      }, {}) || {},
      
      // Device data (not directly available, we'll use empty)
      devices: {},
      recentClicks: [],
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}