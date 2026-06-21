import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    const response = await fetch(`https://api.short.io/links/${shortCode}/stats`, {
      headers: {
        'Authorization': 'sk_K2F0tqEH8xIJSNJx'
      }
    });

    if (!response.ok) {
      throw new Error(`Short.io API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Short.io stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}