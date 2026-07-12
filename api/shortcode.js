
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
    console.log(`🔴 Processing shortCode: ${shortCode}`);
    
    const apiKey = process.env.SHORTIO_API_KEY || process.env.VITE_SHORTIO_API_KEY;
    const domain = process.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

    if (!apiKey) {
      console.error(' API key missing');
      return res.status(500).json({ error: 'API key not configured' });
    }

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
      console.error('❌ Link info error:', linkInfoResponse.status);
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

    console.log(` Found link ID: ${linkId} for shortCode: ${shortCode}`);

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
      console.error('❌ Stats error:', statsResponse.status);
      return res.status(statsResponse.status).json({ 
        error: 'Failed to fetch stats',
        details: errorText
      });
    }

    const statsData = await statsResponse.json();
    console.log(' Stats data received');

 
    let calculatedTotal = 0;
    if (statsData.browser && Array.isArray(statsData.browser)) {
      const browserTotal = statsData.browser.reduce((sum, item) => sum + (item.score || 0), 0);
      calculatedTotal = Math.max(calculatedTotal, browserTotal);
      console.log(` Browser total: ${browserTotal}`);
    }
    
    if (statsData.country && Array.isArray(statsData.country)) {
      const countryTotal = statsData.country.reduce((sum, item) => sum + (item.score || 0), 0);
      calculatedTotal = Math.max(calculatedTotal, countryTotal);
      console.log(`📊 Country total: ${countryTotal}`);
    }
    
    if (statsData.os && Array.isArray(statsData.os)) {
      const osTotal = statsData.os.reduce((sum, item) => sum + (item.score || 0), 0);
      calculatedTotal = Math.max(calculatedTotal, osTotal);
      console.log(`📊 OS total: ${osTotal}`);
    }
    
    if (statsData.referer && Array.isArray(statsData.referer)) {
      const refererTotal = statsData.referer.reduce((sum, item) => sum + (item.score || 0), 0);
      calculatedTotal = Math.max(calculatedTotal, refererTotal);
      console.log(` Referer total: ${refererTotal}`);
    }

    if (statsData.clicksByDate) {
      const dateTotal = Object.values(statsData.clicksByDate).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      calculatedTotal = Math.max(calculatedTotal, dateTotal);
      console.log(` Date total: ${dateTotal}`);
    }

    const reportedTotal = statsData.totalClicks || 0;
    const finalTotal = Math.max(reportedTotal, calculatedTotal);
    
    console.log(` Reported: ${reportedTotal}, Calculated: ${calculatedTotal}, Final: ${finalTotal}`);

    const countryNames = {
      'AF': 'Afghanistan',
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'IN': 'India',
      'JP': 'Japan',
      'BR': 'Brazil',
      'ZA': 'South Africa',
      'PK': 'Pakistan',
      'NG': 'Nigeria',
      'EG': 'Egypt',
      'SA': 'Saudi Arabia',
      'AE': 'UAE',
      'TR': 'Turkey',
      'RU': 'Russia',
      'CN': 'China',
    };

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

    const clicksByDate = statsData.clicksByDate || {};
    const formattedClicksByDate = {};
    Object.entries(clicksByDate).forEach(([date, count]) => {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          const formattedDate = format(parsedDate, 'yyyy-MM-dd');
          formattedClicksByDate[formattedDate] = typeof count === 'number' ? count : 0;
        }
      } catch (e) {
        console.warn('Could not parse date:', date);
      }
    });

    const transformedData = {
      totalClicks: finalTotal,
      humanClicks: statsData.humanClicks || finalTotal,
      clicks: finalTotal,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      clicksByDate: formattedClicksByDate,
      interval: statsData.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
      
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

    console.log(` Returning data with ${finalTotal} total clicks`);
    return res.status(200).json(transformedData);

  } catch (error) {
    console.error(' Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}