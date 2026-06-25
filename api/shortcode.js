// api/shortcode.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ FIX: Get shortCode from query OR from URL path
  let shortCode = req.query.shortCode;
  
  // If no shortCode in query, extract from URL path
  if (!shortCode) {
    // Get the path after /api/
    const urlPath = req.url.split('?')[0]; // Remove query params
    const pathParts = urlPath.split('/').filter(Boolean);
    
    // If the first part is 'api', get the second part
    if (pathParts[0] === 'api' && pathParts.length > 1) {
      shortCode = pathParts[1];
    }
    // If the first part is not 'api', use it directly
    else if (pathParts.length > 0 && pathParts[0] !== 'shortcode') {
      shortCode = pathParts[0];
    }
  }

  // If still no shortCode, return error
  if (!shortCode || Array.isArray(shortCode)) {
    return res.status(400).json({ 
      error: 'Missing short code',
      hint: 'Use /api/shortcode?shortCode=xxx or /api/xxx'
    });
  }

  try {
    console.log(`Processing shortCode: ${shortCode}`);
    
    const apiKey = process.env.SHORTIO_API_KEY || process.env.VITE_SHORTIO_API_KEY;
    const domain = process.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

    if (!apiKey) {
      console.error('API key missing');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Step 1: Get link info from Short.io
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
      console.error('Link info error:', linkInfoResponse.status, errorText);
      return res.status(linkInfoResponse.status).json({ 
        error: 'Link not found',
        shortCode: shortCode,
        details: errorText
      });
    }

    const linkData = await linkInfoResponse.json();
    const linkId = linkData.id;

    if (!linkId) {
      return res.status(404).json({ 
        error: 'Link ID not found',
        shortCode: shortCode
      });
    }

    console.log(`Found link ID: ${linkId} for shortCode: ${shortCode}`);

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
      const errorText = await statsResponse.text();
      console.error('Stats error:', statsResponse.status, errorText);
      return res.status(statsResponse.status).json({ 
        error: 'Failed to fetch stats',
        details: errorText
      });
    }

    const statsData = await statsResponse.json();

    // Transform data for frontend
    const transformedData = {
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      interval: statsData.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
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
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}