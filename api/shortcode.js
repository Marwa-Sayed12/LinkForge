// api/shortcode.js

import { format } from "date-fns";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let shortCode = req.query.shortCode;
  
  if (!shortCode) {
    const urlPath = req.url.split('?')[0];
    const pathParts = urlPath.split('/').filter(Boolean);
    if (pathParts[0] === 'api' && pathParts.length > 1) {
      shortCode = pathParts[1];
    } else if (pathParts.length > 0 && pathParts[0] !== 'shortcode') {
      shortCode = pathParts[0];
    }
  }

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
      console.error('Link info error:', linkInfoResponse.status);
      return res.status(linkInfoResponse.status).json({ 
        error: 'Link not found',
        details: errorText
      });
    }

    const linkData = await linkInfoResponse.json();
    const linkId = linkData.id;

    if (!linkId) {
      return res.status(404).json({ error: 'Link ID not found' });
    }

    console.log(`Found link ID: ${linkId} for shortCode: ${shortCode}`);

    // Step 2: Get statistics from Short.io
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
      console.error('Stats error:', statsResponse.status);
      return res.status(statsResponse.status).json({ 
        error: 'Failed to fetch stats',
        details: errorText
      });
    }

    const statsData = await statsResponse.json();
    console.log('Stats data received');

    // Country name mapping
    const countryNames = {
      'AF': 'Afghanistan',
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      // Add more as needed
    };

    // OS Icon mapping
    const osIcons = {
      'Windows': '🪟',
      'Mac OS X': '🍎',
      'macOS': '🍎',
      'Linux': '🐧',
      'Ubuntu': '🐧',
      'iOS': '📱',
      'Android': '🤖',
      'Chrome OS': '🌐',
      'Unknown': '💻'
    };

    // Browser Icon mapping
    const browserIcons = {
      'Chrome': '🌐',
      'Firefox': '🦊',
      'Safari': '🧭',
      'Edge': '📘',
      'Opera': '🅾️',
      'Internet Explorer': '💀',
      'Mobile Safari': '📱',
      'Chrome Mobile': '📱',
      'Unknown': '🌐'
    };

    // Transform clicksByDate to ensure it's in the right format
    const clicksByDate = statsData.clicksByDate || {};
    const formattedClicksByDate = {};
    Object.entries(clicksByDate).forEach(([date, count]) => {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          const formattedDate = format(parsedDate, 'yyyy-MM-dd');
          formattedClicksByDate[formattedDate] = count;
        }
      } catch (e) {
        console.warn('Could not parse date:', date);
      }
    });

    // ✅ Transform data for frontend - FULL DATA
    const transformedData = {
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      clicksByDate: formattedClicksByDate,
      interval: statsData.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      
      // ✅ Raw data from Short.io
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
      
      // ✅ Convert to Record format with full country names and icons
      browsers: statsData.browser?.reduce((acc, item) => {
        acc[item.browser] = {
          count: item.score,
          icon: browserIcons[item.browser] || '🌐'
        };
        return acc;
      }, {}) || {},
      
      countries: statsData.country?.reduce((acc, item) => {
        const fullName = countryNames[item.country] || item.country || item.countryName || 'Unknown';
        acc[fullName] = {
          count: item.score,
          code: item.country
        };
        return acc;
      }, {}) || {},
      
      oss: statsData.os?.reduce((acc, item) => {
        acc[item.os] = {
          count: item.score,
          icon: osIcons[item.os] || '💻'
        };
        return acc;
      }, {}) || {},
      
      referrers: statsData.referer?.reduce((acc, item) => {
        acc[item.referer || 'Direct'] = item.score;
        return acc;
      }, {}) || {},
      
      devices: statsData.devices || {},
      recentClicks: statsData.recentClicks || [],
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