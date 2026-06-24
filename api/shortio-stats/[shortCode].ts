// api/[shortCode].ts

export default async function handler(req, res) {
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

    // STEP 1: Get link info by path
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
    const linkId = linkData.id;

    if (!linkId) {
      return res.status(404).json({ error: 'Link ID not found' });
    }

    console.log(`Found link ID: ${linkId}`);

    // STEP 2: Get statistics
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

    // STEP 3: Transform the response
    const transformedData = {
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      interval: statsData.interval || { 
        startDate: null, 
        endDate: null, 
        prevStartDate: null, 
        prevEndDate: null 
      },
      
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
      
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
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message || 'Unknown error'
    });
  }
}