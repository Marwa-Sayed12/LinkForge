// api/stats/batch.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { shortCodes } = req.query;

  if (!shortCodes) {
    return res.status(400).json({ error: 'Missing shortCodes' });
  }

  const codes = Array.isArray(shortCodes) ? shortCodes : shortCodes.split(',');

  try {
    const apiKey = process.env.SHORTIO_API_KEY || process.env.VITE_SHORTIO_API_KEY;
    const domain = process.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

    const results = {};
    
    // Fetch all links in one call
    const linksResponse = await fetch(
      `https://api.short.io/api/links?domain=${domain}&limit=100`,
      {
        headers: { 'accept': 'application/json', 'authorization': apiKey },
      }
    );

    if (!linksResponse.ok) {
      throw new Error('Failed to fetch links from Short.io');
    }

    const allLinks = await linksResponse.json();
    const linkIdMap = {};
    allLinks.forEach(link => {
      linkIdMap[link.path] = link.id;
    });

    // Process each short code
    for (const shortCode of codes) {
      try {
        const linkId = linkIdMap[shortCode];
        if (!linkId) {
          results[shortCode] = { totalClicks: 0 };
          continue;
        }

        const statsResponse = await fetch(
          `https://api-v2.short.io/statistics/link/${linkId}?period=total&tzOffset=0`,
          {
            headers: { 'accept': '*/*', 'authorization': apiKey },
          }
        );

        if (!statsResponse.ok) {
          results[shortCode] = { totalClicks: 0 };
          continue;
        }

        const statsData = await statsResponse.json();
        results[shortCode] = {
          totalClicks: statsData.totalClicks || 0,
          clicks: statsData.clicks || 0,
          humanClicks: statsData.humanClicks || 0,
          browser: statsData.browser || [],
          country: statsData.country || [],
          os: statsData.os || [],
          referer: statsData.referer || [],
          clicksByDate: statsData.clicksByDate || {},
        };
      } catch (error) {
        console.error(`Error fetching stats for ${shortCode}:`, error);
        results[shortCode] = { totalClicks: 0 };
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Batch API error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}