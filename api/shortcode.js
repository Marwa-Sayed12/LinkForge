// api/shortcode.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let shortCode = req.query.shortCode;
  
  // If no shortCode in query, extract from URL path
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

    // Step 2: Get statistics with more data
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
    console.log('Raw clicksByDate:', statsData.clicksByDate);


    // Country name mapping
    const countryNames = {
      'AF': 'Afghanistan',
      'AL': 'Albania',
      'DZ': 'Algeria',
      'AD': 'Andorra',
      'AO': 'Angola',
      'AR': 'Argentina',
      'AM': 'Armenia',
      'AU': 'Australia',
      'AT': 'Austria',
      'AZ': 'Azerbaijan',
      'BS': 'Bahamas',
      'BH': 'Bahrain',
      'BD': 'Bangladesh',
      'BB': 'Barbados',
      'BY': 'Belarus',
      'BE': 'Belgium',
      'BZ': 'Belize',
      'BJ': 'Benin',
      'BT': 'Bhutan',
      'BO': 'Bolivia',
      'BA': 'Bosnia and Herzegovina',
      'BW': 'Botswana',
      'BR': 'Brazil',
      'BN': 'Brunei',
      'BG': 'Bulgaria',
      'BF': 'Burkina Faso',
      'BI': 'Burundi',
      'CV': 'Cabo Verde',
      'KH': 'Cambodia',
      'CM': 'Cameroon',
      'CA': 'Canada',
      'CF': 'Central African Republic',
      'TD': 'Chad',
      'CL': 'Chile',
      'CN': 'China',
      'CO': 'Colombia',
      'KM': 'Comoros',
      'CG': 'Congo',
      'CR': 'Costa Rica',
      'HR': 'Croatia',
      'CU': 'Cuba',
      'CY': 'Cyprus',
      'CZ': 'Czechia',
      'DK': 'Denmark',
      'DJ': 'Djibouti',
      'DM': 'Dominica',
      'DO': 'Dominican Republic',
      'EC': 'Ecuador',
      'EG': 'Egypt',
      'SV': 'El Salvador',
      'GQ': 'Equatorial Guinea',
      'ER': 'Eritrea',
      'EE': 'Estonia',
      'SZ': 'Eswatini',
      'ET': 'Ethiopia',
      'FJ': 'Fiji',
      'FI': 'Finland',
      'FR': 'France',
      'GA': 'Gabon',
      'GM': 'Gambia',
      'GE': 'Georgia',
      'DE': 'Germany',
      'GH': 'Ghana',
      'GR': 'Greece',
      'GD': 'Grenada',
      'GT': 'Guatemala',
      'GN': 'Guinea',
      'GW': 'Guinea-Bissau',
      'GY': 'Guyana',
      'HT': 'Haiti',
      'HN': 'Honduras',
      'HU': 'Hungary',
      'IS': 'Iceland',
      'IN': 'India',
      'ID': 'Indonesia',
      'IR': 'Iran',
      'IQ': 'Iraq',
      'IE': 'Ireland',
      'IL': 'Israel',
      'IT': 'Italy',
      'JM': 'Jamaica',
      'JP': 'Japan',
      'JO': 'Jordan',
      'KZ': 'Kazakhstan',
      'KE': 'Kenya',
      'KI': 'Kiribati',
      'KP': 'North Korea',
      'KR': 'South Korea',
      'KW': 'Kuwait',
      'KG': 'Kyrgyzstan',
      'LA': 'Laos',
      'LV': 'Latvia',
      'LB': 'Lebanon',
      'LS': 'Lesotho',
      'LR': 'Liberia',
      'LY': 'Libya',
      'LI': 'Liechtenstein',
      'LT': 'Lithuania',
      'LU': 'Luxembourg',
      'MG': 'Madagascar',
      'MW': 'Malawi',
      'MY': 'Malaysia',
      'MV': 'Maldives',
      'ML': 'Mali',
      'MT': 'Malta',
      'MH': 'Marshall Islands',
      'MR': 'Mauritania',
      'MU': 'Mauritius',
      'MX': 'Mexico',
      'FM': 'Micronesia',
      'MD': 'Moldova',
      'MC': 'Monaco',
      'MN': 'Mongolia',
      'ME': 'Montenegro',
      'MA': 'Morocco',
      'MZ': 'Mozambique',
      'MM': 'Myanmar',
      'NA': 'Namibia',
      'NR': 'Nauru',
      'NP': 'Nepal',
      'NL': 'Netherlands',
      'NZ': 'New Zealand',
      'NI': 'Nicaragua',
      'NE': 'Niger',
      'NG': 'Nigeria',
      'NO': 'Norway',
      'OM': 'Oman',
      'PK': 'Pakistan',
      'PW': 'Palau',
      'PA': 'Panama',
      'PG': 'Papua New Guinea',
      'PY': 'Paraguay',
      'PE': 'Peru',
      'PH': 'Philippines',
      'PL': 'Poland',
      'PT': 'Portugal',
      'QA': 'Qatar',
      'RO': 'Romania',
      'RU': 'Russia',
      'RW': 'Rwanda',
      'KN': 'Saint Kitts and Nevis',
      'LC': 'Saint Lucia',
      'VC': 'Saint Vincent and the Grenadines',
      'WS': 'Samoa',
      'SM': 'San Marino',
      'ST': 'Sao Tome and Principe',
      'SA': 'Saudi Arabia',
      'SN': 'Senegal',
      'RS': 'Serbia',
      'SC': 'Seychelles',
      'SL': 'Sierra Leone',
      'SG': 'Singapore',
      'SK': 'Slovakia',
      'SI': 'Slovenia',
      'SB': 'Solomon Islands',
      'SO': 'Somalia',
      'ZA': 'South Africa',
      'SS': 'South Sudan',
      'ES': 'Spain',
      'LK': 'Sri Lanka',
      'SD': 'Sudan',
      'SR': 'Suriname',
      'SE': 'Sweden',
      'CH': 'Switzerland',
      'SY': 'Syria',
      'TW': 'Taiwan',
      'TJ': 'Tajikistan',
      'TZ': 'Tanzania',
      'TH': 'Thailand',
      'TL': 'Timor-Leste',
      'TG': 'Togo',
      'TO': 'Tonga',
      'TT': 'Trinidad and Tobago',
      'TN': 'Tunisia',
      'TR': 'Turkey',
      'TM': 'Turkmenistan',
      'TV': 'Tuvalu',
      'UG': 'Uganda',
      'UA': 'Ukraine',
      'AE': 'United Arab Emirates',
      'GB': 'United Kingdom',
      'US': 'United States',
      'UY': 'Uruguay',
      'UZ': 'Uzbekistan',
      'VU': 'Vanuatu',
      'VA': 'Vatican City',
      'VE': 'Venezuela',
      'VN': 'Vietnam',
      'YE': 'Yemen',
      'ZM': 'Zambia',
      'ZW': 'Zimbabwe'
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
      'Unknown': '❓'
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
      'Unknown': '❓'
    };

    // Transform clicksByDate to ensure it's in the right format
const clicksByDate = statsData.clicksByDate || {};
const formattedClicksByDate = {};
Object.entries(clicksByDate).forEach(([date, count]) => {
  // Ensure date is in YYYY-MM-DD format
  const formattedDate = format(new Date(date), 'yyyy-MM-dd');
  formattedClicksByDate[formattedDate] = count;
});

    // Transform data for frontend
    const transformedData = {
      totalClicks: statsData.totalClicks || 0,
      humanClicks: statsData.humanClicks || 0,
      clicks: statsData.totalClicks || 0,
      totalClicksChange: statsData.totalClicksChange || '0',
      humanClicksChange: statsData.humanClicksChange || '0',
      clickStatistics: statsData.clickStatistics || { datasets: [] },
        clicksByDate: formattedClicksByDate,
      interval: statsData.interval || { startDate: null, endDate: null, prevStartDate: null, prevEndDate: null },
      
      // Raw data
      browser: statsData.browser || [],
      country: statsData.country || [],
      city: statsData.city || [],
      os: statsData.os || [],
      referer: statsData.referer || [],
      
      // Convert to Record format with full country names and icons
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
      
      // Keep raw country data with full names
      countryFull: statsData.country?.map(item => ({
        ...item,
        countryName: countryNames[item.country] || item.country || item.countryName || 'Unknown',
        flag: item.country.toLowerCase()
      })) || [],
      
      devices: {},
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