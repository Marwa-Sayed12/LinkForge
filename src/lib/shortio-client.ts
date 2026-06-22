// src/lib/shortio-client.ts

const SHORTIO_API_KEY = import.meta.env.VITE_SHORTIO_API_KEY;
const SHORTIO_DOMAIN = import.meta.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

export interface ShortIoStats {
  totalClicks?: number;
  humanClicks?: number;
  clicks?: number;
  totalClicksChange?: string;
  humanClicksChange?: string;
  clickStatistics?: {
    datasets: Array<{
      data?: any[];
      label?: string;
    }>;
  };
  interval?: {
    startDate: string | null;
    endDate: string | null;
    prevStartDate: string | null;
    prevEndDate: string | null;
  };
  referer?: Array<{
    score: number;
    referer: string;
  }>;
  social?: Array<any>;
  browser?: Array<{
    score: number;
    browser: string;
  }>;
  country?: Array<{
    score: number;
    country: string;
    countryName: string;
  }>;
  city?: Array<{
    score: number;
    city: string;
    name: string;
  }>;
  os?: Array<{
    score: number;
    os: string;
  }>;
  // Legacy fields for backward compatibility
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
 * Get the link ID from a short code
 * First, you need to get the link ID from the short code
 */
export async function getLinkId(shortCode: string): Promise<string | null> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing');
    return null;
  }

  try {
    // First, try to find the link by path
    const url = `https://api.short.io/api/links?domain=${SHORTIO_DOMAIN}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': SHORTIO_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch links:', await response.text());
      return null;
    }

    const links = await response.json();
    
    // Find the link with matching short code
    const link = links.find((l: any) => l.path === shortCode);
    
    if (!link) {
      console.warn(`Link with short code "${shortCode}" not found`);
      return null;
    }

    return link.id;
  } catch (error) {
    console.error('Error getting link ID:', error);
    return null;
  }
}

/**
 * Fetch statistics for a specific short link using the correct API endpoint
 */
export async function getShortIoStats(
  shortCode: string, 
  period: string = 'total',
  tzOffset: number = 0
): Promise<ShortIoStats | null> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing. Please set VITE_SHORTIO_API_KEY in your .env file.');
    return null;
  }

  if (!shortCode) {
    console.error('Short code is required');
    return null;
  }

  try {
    // First, get the link ID
    const linkId = await getLinkId(shortCode);
    if (!linkId) {
      console.error(`Could not find link ID for short code: ${shortCode}`);
      return null;
    }

    // Use the correct endpoint from the documentation
    const url = `https://api-v2.short.io/statistics/link/${linkId}?period=${period}&tzOffset=${tzOffset}`;
    
    console.log('Fetching stats from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'authorization': SHORTIO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      
      if (response.status === 404) {
        console.warn(`No stats found for link: ${shortCode}`);
        return null;
      }
      if (response.status === 401) {
        console.error('Invalid Short.io API key. Please check your credentials.');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Stats data received:', data);

    // Transform the response to our expected format
    return {
      totalClicks: data.totalClicks || 0,
      humanClicks: data.humanClicks || 0,
      clicks: data.totalClicks || 0,
      totalClicksChange: data.totalClicksChange || '0',
      humanClicksChange: data.humanClicksChange || '0',
      clickStatistics: data.clickStatistics || { datasets: [] },
      interval: data.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      
      // Convert array format to object format for backward compatibility
      referrers: data.referer?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.referer] = item.score;
        return acc;
      }, {}),
      
      browsers: data.browser?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.browser] = item.score;
        return acc;
      }, {}),
      
      countries: data.country?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.country] = item.score;
        return acc;
      }, {}),
      
      os: data.os?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.os] = item.score;
        return acc;
      }, {}),
      
      devices: {}, // Device data might need to be derived from other fields
      
      recentClicks: [], // Recent clicks might need a separate endpoint
      
      // Keep raw data for reference
      referer: data.referer || [],
      browser: data.browser || [],
      country: data.country || [],
      city: data.city || [],
      os: data.os || [],
    };
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return null;
  }
}

/**
 * Get statistics for a custom period
 */
export async function getShortIoStatsCustomPeriod(
  shortCode: string,
  startDate: Date,
  endDate: Date,
  tzOffset: number = 0
): Promise<ShortIoStats | null> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing');
    return null;
  }

  try {
    const linkId = await getLinkId(shortCode);
    if (!linkId) {
      return null;
    }

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    
    const url = `https://api-v2.short.io/statistics/link/${linkId}?period=custom&tzOffset=${tzOffset}&startDate=${startTimestamp}&endDate=${endTimestamp}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'authorization': SHORTIO_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`API Error (${response.status}):`, await response.text());
      return null;
    }

    const data = await response.json();
    
    return {
      totalClicks: data.totalClicks || 0,
      humanClicks: data.humanClicks || 0,
      clicks: data.totalClicks || 0,
      totalClicksChange: data.totalClicksChange || '0',
      humanClicksChange: data.humanClicksChange || '0',
      clickStatistics: data.clickStatistics || { datasets: [] },
      interval: data.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      referrers: data.referer?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.referer] = item.score;
        return acc;
      }, {}),
      browsers: data.browser?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.browser] = item.score;
        return acc;
      }, {}),
      countries: data.country?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.country] = item.score;
        return acc;
      }, {}),
      os: data.os?.reduce((acc: Record<string, number>, item: any) => {
        acc[item.os] = item.score;
        return acc;
      }, {}),
      devices: {},
      recentClicks: [],
      referer: data.referer || [],
      browser: data.browser || [],
      country: data.country || [],
      city: data.city || [],
      os: data.os || [],
    };
  } catch (error) {
    console.error('Error fetching Short.io stats for custom period:', error);
    return null;
  }
}

/**
 * Test the connection to Short.io API
 */
export async function testShortIoConnection(): Promise<boolean> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing');
    return false;
  }

  try {
    // Try to get a list of links as a health check
    const url = `https://api.short.io/api/links?domain=${SHORTIO_DOMAIN}&limit=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': SHORTIO_API_KEY,
      },
    });
    
    if (response.ok) {
      console.log('✅ Short.io API connection successful!');
      return true;
    } else {
      console.error('❌ Short.io API connection failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Short.io connection test failed:', error);
    return false;
  }
}

// Helper function to get total clicks (for backward compatibility)
export async function getShortIoTotalClicks(shortCode: string): Promise<number> {
  const stats = await getShortIoStats(shortCode);
  return stats?.totalClicks || 0;
}