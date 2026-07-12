// @ts-expect-error - Deno import for Supabase Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SHORTIO_API_KEY = Deno.env.get('SHORTIO_API_KEY') || '';
const SHORTIO_DOMAIN = Deno.env.get('VITE_SHORTIO_DOMAIN') || 's.linkforge.website';

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const url = new URL(req.url);
    const shortCode = url.searchParams.get('shortCode');

    if (!shortCode) {
      return new Response(
        JSON.stringify({ error: 'Missing shortCode parameter' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

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
      return new Response(
        JSON.stringify({ error: 'Link not found' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const linkData = await linkInfoResponse.json();
    const linkId = linkData.id;

    if (!linkId) {
      return new Response(
        JSON.stringify({ error: 'Link ID not found' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

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
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stats' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: statsResponse.status }
      );
    }

    const statsData = await statsResponse.json();

    const transformedData = {
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
      
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
    };

    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});