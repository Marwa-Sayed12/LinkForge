// src/lib/shortio-direct.ts

const SHORTIO_API_KEY = import.meta.env.VITE_SHORTIO_API_KEY;
const SHORTIO_DOMAIN = import.meta.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

export async function getShortIoStatsDirect(shortCode: string) {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing');
    return null;
  }

  try {
    // Step 1: Get link info by path
    const linkInfoResponse = await fetch(
      `https://api.short.io/links/expand?domain=${SHORTIO_DOMAIN}&path=${shortCode}`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': SHORTIO_API_KEY,
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
          'authorization': SHORTIO_API_KEY,
        },
      }
    );

    if (!statsResponse.ok) {
      console.error('Failed to fetch stats:', await statsResponse.text());
      return null;
    }

    const statsData = await statsResponse.json();

    // Transform data
    return {
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
      interval: statsData.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      
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
      
      devices: {},
      recentClicks: [],
      
      // Raw data
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
    };
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}