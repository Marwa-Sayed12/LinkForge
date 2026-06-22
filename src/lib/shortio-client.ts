// src/lib/shortio-client.ts

const SHORTIO_API_KEY = import.meta.env.VITE_SHORTIO_API_KEY;
const SHORTIO_DOMAIN = import.meta.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

export interface ShortIoStats {
  totalClicks?: number;
  clicks?: number;
  humanClicks?: number;
  clicksByDate?: Record<string, number>;
  devices?: Record<string, number>;
  countries?: Record<string, number>;
  browsers?: Record<string, number>;
  os?: Record<string, number>;
  referrers?: Record<string, number>;
  recentClicks?: Array<{
    timestamp?: string;
    browser?: string;
    device?: string;
    os?: string;
    country?: string;
    city?: string;
  }>;
}

/**
 * Fetch statistics for a specific short link from Short.io API
 * @param shortCode - The short code of the link (e.g., 'abc123')
 * @returns Promise with the stats data or null if error
 */
export async function getShortIoStats(shortCode: string): Promise<ShortIoStats | null> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing. Please set VITE_SHORTIO_API_KEY in your .env file.');
    return null;
  }

  if (!shortCode) {
    console.error('Short code is required');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.short.io/links/stats/${shortCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': SHORTIO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No stats found for short code: ${shortCode}`);
        return null;
      }
      if (response.status === 401) {
        console.error('Invalid Short.io API key. Please check your credentials.');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to our expected format if needed
    // Short.io API returns different formats depending on the endpoint
    return {
      totalClicks: data.totalClicks || data.clicks || 0,
      clicks: data.clicks || data.totalClicks || 0,
      humanClicks: data.humanClicks || data.clicks || data.totalClicks || 0,
      clicksByDate: data.clicksByDate || data.dailyClicks || {},
      devices: data.devices || data.deviceStats || {},
      countries: data.countries || data.countryStats || {},
      browsers: data.browsers || data.browserStats || {},
      os: data.os || data.osStats || {},
      referrers: data.referrers || data.referrerStats || {},
      recentClicks: data.recentClicks || data.clicks || [],
    };
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

/**
 * Get total clicks for a specific short code
 * @param shortCode - The short code of the link
 * @returns Promise with the total clicks count or 0 if error
 */
export async function getShortIoTotalClicks(shortCode: string): Promise<number> {
  const stats = await getShortIoStats(shortCode);
  return stats?.totalClicks || 0;
}

/**
 * Get detailed analytics for multiple short links
 * @param shortCodes - Array of short codes
 * @returns Promise with array of stats for each short code
 */
export async function getMultipleShortIoStats(shortCodes: string[]): Promise<ShortIoStats[]> {
  const results: ShortIoStats[] = [];
  
  // Process in parallel with Promise.all
  const promises = shortCodes.map(async (shortCode) => {
    const stats = await getShortIoStats(shortCode);
    return stats || null;
  });
  
  const statsResults = await Promise.all(promises);
  
  // Filter out null results and add to results array
  statsResults.forEach((stats) => {
    if (stats) {
      results.push(stats);
    }
  });
  
  return results;
}

/**
 * Check if the Short.io API is properly configured and accessible
 * @returns Promise with boolean indicating if API is working
 */
export async function testShortIoConnection(): Promise<boolean> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing');
    return false;
  }

  try {
    // Try to fetch stats for a test link (you might want to use a known short code)
    // This is just a health check - we'll test with a dummy request
    const response = await fetch(
      `https://api.short.io/links`,
      {
        method: 'GET',
        headers: {
          'Authorization': SHORTIO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Short.io connection test failed:', error);
    return false;
  }
}