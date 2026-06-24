// src/lib/shortio-client.ts

const SHORTIO_API_KEY = import.meta.env.VITE_SHORTIO_API_KEY;
const SHORTIO_DOMAIN = import.meta.env.VITE_SHORTIO_DOMAIN || 's.linkforge.website';

// Define types for API responses
interface ShortIoLink {
  id: string;
  path: string;
  domain: string;
  originalURL: string;
  title?: string;
  clicks?: number;
  [key: string]: unknown;
}

interface ShortIoBrowserStats {
  score: number;
  browser: string;
}

interface ShortIoCountryStats {
  score: number;
  country: string;
  countryName: string;
}

interface ShortIoCityStats {
  score: number;
  city: string;
  name: string;
}

interface ShortIoOsStats {
  score: number;
  os: string;
}

interface ShortIoRefererStats {
  score: number;
  referer: string;
}

interface ShortIoClickDataset {
  data?: number[];
  label?: string;
}

interface ShortIoClickStatistics {
  datasets: ShortIoClickDataset[];
}

interface ShortIoInterval {
  startDate: string | null;
  endDate: string | null;
  prevStartDate: string | null;
  prevEndDate: string | null;
}

// Main export interface for our app
export interface ShortIoStats {
  totalClicks?: number;
  humanClicks?: number;
  clicks?: number;
  totalClicksChange?: string;
  humanClicksChange?: string;
  clickStatistics?: ShortIoClickStatistics;
  interval?: ShortIoInterval;
  referer?: ShortIoRefererStats[];
  browser?: ShortIoBrowserStats[];
  country?: ShortIoCountryStats[];
  city?: ShortIoCityStats[];
  os?: ShortIoOsStats[];
  // Legacy fields for backward compatibility with Analytics.tsx
  devices?: Record<string, number>;
  countries?: Record<string, number>;
  browsers?: Record<string, number>;
  oss?: Record<string, number>;  // Changed from 'os' to avoid duplicate
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
 */
export async function getLinkId(shortCode: string): Promise<string | null> {
  if (!SHORTIO_API_KEY) {
    console.error('Short.io API key is missing');
    return null;
  }

  try {
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

    const links: ShortIoLink[] = await response.json();
    
    // Find the link with matching short code
    const link = links.find((l: ShortIoLink) => l.path === shortCode);
    
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
      
      // Keep raw arrays for direct access
      referer: data.referer || [],
      browser: data.browser || [],
      country: data.country || [],
      city: data.city || [],
      os: data.os || [],
      
      // Convert array format to Record format for backward compatibility
      referrers: data.referer?.reduce((acc: Record<string, number>, item: ShortIoRefererStats) => {
        acc[item.referer] = item.score;
        return acc;
      }, {}),
      
      browsers: data.browser?.reduce((acc: Record<string, number>, item: ShortIoBrowserStats) => {
        acc[item.browser] = item.score;
        return acc;
      }, {}),
      
      countries: data.country?.reduce((acc: Record<string, number>, item: ShortIoCountryStats) => {
        acc[item.country] = item.score;
        return acc;
      }, {}),
      
      oss: data.os?.reduce((acc: Record<string, number>, item: ShortIoOsStats) => {
        acc[item.os] = item.score;
        return acc;
      }, {}),
      
      devices: {}, // Device data might need to be derived from other fields
      recentClicks: [], // Recent clicks might need a separate endpoint
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
      
      referer: data.referer || [],
      browser: data.browser || [],
      country: data.country || [],
      city: data.city || [],
      os: data.os || [],
      
      referrers: data.referer?.reduce((acc: Record<string, number>, item: ShortIoRefererStats) => {
        acc[item.referer] = item.score;
        return acc;
      }, {}),
      
      browsers: data.browser?.reduce((acc: Record<string, number>, item: ShortIoBrowserStats) => {
        acc[item.browser] = item.score;
        return acc;
      }, {}),
      
      countries: data.country?.reduce((acc: Record<string, number>, item: ShortIoCountryStats) => {
        acc[item.country] = item.score;
        return acc;
      }, {}),
      
      oss: data.os?.reduce((acc: Record<string, number>, item: ShortIoOsStats) => {
        acc[item.os] = item.score;
        return acc;
      }, {}),
      
      devices: {},
      recentClicks: [],
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

/**
 * Get total clicks for a short code
 */
export async function getShortIoTotalClicks(shortCode: string): Promise<number> {
  const stats = await getShortIoStats(shortCode);
  return stats?.totalClicks || 0;
}