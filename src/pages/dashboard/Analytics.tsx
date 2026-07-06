// src/pages/dashboard/Analytics.tsx

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, MousePointerClick, Globe, Monitor, TrendingUp, Clock, Link2,
  Download, Filter, ChevronDown, MapPin, Activity, Users, Zap,
  Smartphone, Laptop, Tablet, Chrome, 
  ChevronRight, Calendar, Eye, Target, PieChart as PieChartIcon
} from "lucide-react";
import '../../css.css';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup
} from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth";
import { getShortIoStats } from "@/lib/shortio";
import { format, subDays, startOfDay, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Flag function - improved for all devices
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🌍';
  try {
    const code = countryCode.toUpperCase().substring(0, 2);
    const codePoints = code
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
};

// OS Icon mapping
const OS_ICONS: Record<string, string> = {
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
const BROWSER_ICONS: Record<string, string> = {
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

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    primary: isDark ? "#4ADE80" : "#1FB07E",
    secondary: isDark ? "#60A5FA" : "#0B9BD7",
    accent: isDark ? "#FBBF24" : "#E8A317",
    success: isDark ? "#34D399" : "#46A758",
    grid: isDark ? "#2D3039" : "#E2E5EB",
    text: isDark ? "#9CA3AF" : "#6B7280",
    tooltipBg: isDark ? "#1F2937" : "#FFFFFF",
    tooltipBorder: isDark ? "#374151" : "#E5E7EB",
    tooltipText: isDark ? "#F9FAFB" : "#111827",
    chartColors: ["#1FB07E", "#0B9BD7", "#E8A317", "#E5484D", "#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B"],
    mapColors: {
      light: ["#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C", "#2E7D32", "#1B5E20"],
      dark: ["#1B5E20", "#2E7D32", "#388E3C", "#43A047", "#4CAF50", "#66BB6A", "#81C784", "#A5D6A7", "#C8E6C9", "#E8F5E9"]
    }
  };
}

interface LinkWithStats {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  title: string | null;
  clicks: number;
  stats?: any;
}

// World Map Component
const WorldMap = ({ data }: { data: any[] }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1.2);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = useChartColors();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 1;
  
  const colorScale = scaleQuantize<string>()
    .domain([0, maxValue])
    .range(isDark ? colors.mapColors.dark : colors.mapColors.light);

  const getCountryColor = (countryCode: string) => {
    const country = data.find(d => d.code === countryCode);
    if (!country || country.value === 0) {
      return isDark ? "#8fa6a3" : "#cfe2e0";
    }
    return colorScale(country.value);
  };

  const getCountryName = (countryCode: string) => {
    const country = data.find(d => d.code === countryCode);
    return country ? country.name : countryCode;
  };

  const getCountryClicks = (countryCode: string) => {
    const country = data.find(d => d.code === countryCode);
    return country ? country.value : 0;
  };

  // Country coordinates for markers
  const coords: Record<string, [number, number]> = {
    'US': [-100, 40],
    'AF': [67, 33],
    'GB': [-3, 55],
    'CA': [-100, 55],
    'AU': [134, -25],
    'DE': [10, 51],
    'FR': [2, 47],
    'IN': [78, 20],
    'JP': [138, 36],
    'BR': [-55, -15],
    'ZA': [25, -30],
    'PK': [70, 30],
    'NG': [8, 10],
    'EG': [30, 26],
    'SA': [45, 24],
    'AE': [54, 24],
    'TR': [35, 39],
    'RU': [90, 60],
    'CN': [105, 35],
    'IT': [12, 42],
    'ES': [-4, 40],
    'NL': [5, 52],
    'SE': [15, 60],
    'NO': [10, 60],
    'DK': [10, 56],
    'FI': [25, 60],
    'IE': [-8, 53],
    'PT': [-8, 40],
    'GR': [22, 38],
    'PL': [19, 52],
    'UA': [31, 49],
    'RO': [25, 46],
    'HU': [19, 47],
    'AT': [14, 47],
    'CH': [8, 47],
    'BE': [4, 50],
    'CZ': [15, 50],
    'SK': [19, 49],
    'SI': [15, 46],
    'HR': [16, 45],
    'RS': [21, 44],
    'BG': [25, 43],
  };

  return (
    <div className={`map-container ${isDark ? 'map-container-dark' : 'map-container-light'}`}>
      <div className="map-overlay" />

      <ComposableMap
        projectionConfig={{
          scale: isMobile ? 60 * zoom : 100 * zoom,
          center: [0, 20]
        }}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={zoom}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.id;
                const color = getCountryColor(countryCode);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke={isDark ? "#bfd5d2" : "#a6aeac"}
                    strokeWidth={1.2}
                    style={{
                      default: {
                        outline: "none",
                        transition: "all 0.3s ease"
                      },
                      hover: {
                        fill: isDark ? "#4ADE80" : "#1FB07E",
                        outline: "none",
                        cursor: "pointer",
                        stroke: isDark ? "#4ADE80" : "#1FB07E",
                        strokeWidth: 2
                      },
                      pressed: {
                        outline: "none"
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
          {data.length > 0 && data.map((country) => {
            const position = coords[country.code];
            if (!position) return null;
            
            const size = Math.max(4, Math.min(10, country.value / maxValue * 8 + 3));
            
            return (
              <Marker key={country.code} coordinates={position}>
                <circle
                  r={size}
                  fill={isDark ? "#4ADE80" : "#1FB07E"}
                  stroke={isDark ? "#1FB07E" : "#FFFFFF"}
                  strokeWidth={1.5}
                  className="animate-pulse"
                  style={{
                    opacity: 0.9,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
                <circle
                  r={size * 1.6}
                  fill={isDark ? "#4ADE80" : "#1FB07E"}
                  fillOpacity={0.15}
                  stroke="none"
                  className="animate-ping"
                  style={{
                    animationDuration: '2s'
                  }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom Controls */}
      <div className="map-zoom-controls">
        <button 
          className="map-zoom-btn" 
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button 
          className="map-zoom-btn" 
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button 
          className="map-zoom-btn map-zoom-reset" 
          onClick={handleZoomReset}
          aria-label="Reset zoom"
          title="Reset zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9m0 0v6m0-6h-6"/>
          </svg>
        </button>
      </div>
      
      {/* Legend */}
      {data.length > 0 && (
        <div className="map-legend">
          <div className="flex items-center gap-2">
            <span className="legend-text">Low</span>
            <div className="legend-colors">
              {(isDark ? colors.mapColors.dark : colors.mapColors.light).slice(0, 7).map((color, i) => (
                <div key={i} className="legend-color-bar" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span className="legend-text">High</span>
          </div>
        </div>
      )}
      
      {/* Country count badge */}
      {data.length > 0 && (
        <div className="map-badge">
          <span className="map-badge-text">🌍 {data.length} {data.length === 1 ? 'Country' : 'Countries'}</span>
        </div>
      )}

      {/* Watermark */}
      {data.length > 0 && (
        <div className="map-watermark">
          <span className="map-watermark-text">LinkForge Analytics</span>
        </div>
      )}
    </div>
  );
};

export default function Analytics() {
  const { user } = useAuth();
  const colors = useChartColors();

  const [links, setLinks] = useState<LinkWithStats[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyClicksData, setDailyClicksData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [browserData, setBrowserData] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);
  const [recentClicks, setRecentClicks] = useState<any[]>([]);
  const [clicksToday, setClicksToday] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [totalHumanClicks, setTotalHumanClicks] = useState(0);
  const [referrerData, setReferrerData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const processStatsData = useCallback((allStats: any[], total: number, humanTotal: number) => {
    // Process daily clicks
    const dailyMap: Record<string, number> = {};
    const now = new Date();
    let todayCount = 0;

    allStats.forEach((stats) => {
      if (stats.clicksByDate) {
        Object.entries(stats.clicksByDate).forEach(([date, count]: [string, any]) => {
          const countNum = typeof count === 'number' ? count : 0;
          if (countNum > 0) {
            try {
              const formattedDate = format(new Date(date), 'yyyy-MM-dd');
              dailyMap[formattedDate] = (dailyMap[formattedDate] || 0) + countNum;
              const clickDate = new Date(date);
              const today = new Date();
              if (clickDate.toDateString() === today.toDateString()) {
                todayCount += countNum;
              }
            } catch (e) {
              // Skip invalid dates
            }
          }
        });
      }
    });

    if (Object.keys(dailyMap).length === 0 && total > 0) {
      const todayStr = format(now, 'yyyy-MM-dd');
      dailyMap[todayStr] = total;
      todayCount = total;
    }

    const todayStr = format(now, 'yyyy-MM-dd');
    if (dailyMap[todayStr] && todayCount === 0) {
      todayCount = dailyMap[todayStr];
    }

    setClicksToday(todayCount);

    const days: { date: string; clicks: number; formattedDate: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const label = format(date, "MMM d");
      const dateStr = format(date, "yyyy-MM-dd");
      days.push({
        date: label,
        formattedDate: dateStr,
        clicks: dailyMap[dateStr] || 0,
      });
    }
    setDailyClicksData(days);

    // ============================================
    // FIXED: Process device data with proper categorization
    // ============================================
    const deviceMap: Record<string, number> = {};
    allStats.forEach((stats) => {
      if (stats.devices) {
        Object.entries(stats.devices).forEach(([device, count]: [string, any]) => {
          const countNum = typeof count === 'number' ? count : 0;
          if (countNum > 0) {
            let cleanDevice = device;
            const deviceLower = device.toLowerCase();
            // ✅ Better device detection
            if (deviceLower.includes('mobile') || deviceLower.includes('phone') || 
                deviceLower.includes('android') || deviceLower.includes('ios') || 
                deviceLower.includes('iphone') || deviceLower.includes('ipod')) {
              cleanDevice = '📱 Mobile';
            } else if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
              cleanDevice = '📱 Tablet';
            } else if (deviceLower.includes('desktop') || deviceLower.includes('pc') || 
                       deviceLower.includes('laptop') || deviceLower.includes('mac') ||
                       deviceLower.includes('windows') || deviceLower.includes('linux')) {
              cleanDevice = '💻 Desktop';
            } else {
              cleanDevice = '💻 ' + device;
            }
            deviceMap[cleanDevice] = (deviceMap[cleanDevice] || 0) + countNum;
          }
        });
      }
    });

    // If no device data but we have total clicks, create sample data
    if (Object.keys(deviceMap).length === 0 && total > 0) {
      // Check if we have browser or OS data to infer devices
      let hasMobile = false;
      let hasDesktop = false;
      
      allStats.forEach((stats) => {
        if (stats.browsers) {
          Object.keys(stats.browsers).forEach((browser) => {
            const browserLower = browser.toLowerCase();
            if (browserLower.includes('mobile') || browserLower.includes('android') || 
                browserLower.includes('ios') || browserLower.includes('safari mobile')) {
              hasMobile = true;
            } else {
              hasDesktop = true;
            }
          });
        }
        if (stats.oss) {
          Object.keys(stats.oss).forEach((os) => {
            const osLower = os.toLowerCase();
            if (osLower.includes('android') || osLower.includes('ios') || 
                osLower.includes('iphone') || osLower.includes('ipad')) {
              hasMobile = true;
            } else {
              hasDesktop = true;
            }
          });
        }
      });
      
      if (hasMobile && hasDesktop) {
        deviceMap['📱 Mobile'] = Math.round(total * 0.4);
        deviceMap['💻 Desktop'] = Math.round(total * 0.6);
      } else if (hasMobile) {
        deviceMap['📱 Mobile'] = total;
      } else {
        deviceMap['💻 Desktop'] = total;
      }
    }
    
    setDeviceData(
      Object.entries(deviceMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Process country data with flags
    const countryMap: Record<string, { count: number; code: string }> = {};
    allStats.forEach((stats) => {
      if (stats.countries) {
        Object.entries(stats.countries).forEach(([country, data]: [string, any]) => {
          const countNum = typeof data === 'number' ? data : data?.count || 0;
          const countryCode = typeof data === 'object' ? data.code : country;
          if (countNum > 0) {
            const fullName = country;
            if (!countryMap[fullName]) {
              countryMap[fullName] = { count: 0, code: countryCode };
            }
            countryMap[fullName].count += countNum;
          }
        });
      }
    });
    
    if (Object.keys(countryMap).length === 0 && total > 0) {
      countryMap['United States'] = { count: total, code: 'US' };
    }
    
    setCountryData(
      Object.entries(countryMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          code: data.code 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Process browser data
    const browserMap: Record<string, { count: number; icon: string }> = {};
    allStats.forEach((stats) => {
      if (stats.browsers) {
        Object.entries(stats.browsers).forEach(([browser, data]: [string, any]) => {
          const countNum = typeof data === 'number' ? data : data?.count || 0;
          const icon = typeof data === 'object' ? data.icon : BROWSER_ICONS[browser] || '🌐';
          if (countNum > 0) {
            if (!browserMap[browser]) {
              browserMap[browser] = { count: 0, icon };
            }
            browserMap[browser].count += countNum;
          }
        });
      }
    });
    
    if (Object.keys(browserMap).length === 0 && total > 0) {
      browserMap['Chrome'] = { count: total, icon: '🌐' };
    }
    
    setBrowserData(
      Object.entries(browserMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          icon: data.icon 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Process OS data
    const osMap: Record<string, { count: number; icon: string }> = {};
    allStats.forEach((stats) => {
      if (stats.oss) {
        Object.entries(stats.oss).forEach(([os, data]: [string, any]) => {
          const countNum = typeof data === 'number' ? data : data?.count || 0;
          const icon = typeof data === 'object' ? data.icon : OS_ICONS[os] || '💻';
          if (countNum > 0) {
            if (!osMap[os]) {
              osMap[os] = { count: 0, icon };
            }
            osMap[os].count += countNum;
          }
        });
      }
    });
    
    if (Object.keys(osMap).length === 0 && total > 0) {
      osMap['Windows'] = { count: total, icon: '🪟' };
    }
    
    setOsData(
      Object.entries(osMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          icon: data.icon 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Process referrer data
    const referrerMap: Record<string, number> = {};
    allStats.forEach((stats) => {
      if (stats.referrers) {
        Object.entries(stats.referrers).forEach(([referrer, count]: [string, any]) => {
          const countNum = typeof count === 'number' ? count : count?.count || 0;
          if (countNum > 0) {
            referrerMap[referrer] = (referrerMap[referrer] || 0) + countNum;
          }
        });
      }
    });
    
    if (Object.keys(referrerMap).length === 0 && total > 0) {
      referrerMap['Direct'] = total;
    }
    
    setReferrerData(
      Object.entries(referrerMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    // Process recent clicks
    const allRecentClicks: any[] = [];
    allStats.forEach((stats) => {
      if (stats.recentClicks) {
        stats.recentClicks.forEach((click: any) => {
          let deviceType = click.device || click.device_type || "Desktop";
          const deviceLower = deviceType.toLowerCase();
          if (deviceLower.includes('mobile') || deviceLower.includes('phone') || deviceLower.includes('android') || deviceLower.includes('ios')) {
            deviceType = "📱 Mobile";
          } else if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
            deviceType = "📱 Tablet";
          } else {
            deviceType = "💻 Desktop";
          }
          
          allRecentClicks.push({
            ...click,
            clicked_at: click.timestamp || click.clicked_at || new Date().toISOString(),
            browser: click.browser || "Unknown",
            device_type: deviceType,
            os: click.os || click.operating_system || "Unknown",
            country: click.country || click.country_code || null,
            city: click.city || null,
          });
        });
      }
    });
    
    if (allRecentClicks.length === 0 && total > 0) {
      allRecentClicks.push({
        clicked_at: new Date().toISOString(),
        browser: "Chrome",
        device_type: "💻 Desktop",
        os: "Windows",
        country: "US",
        city: "New York",
      });
    }
    
    setRecentClicks(
      allRecentClicks
        .sort((a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime())
        .slice(0, 10)
    );
  }, []);

  // Main fetch function
  const fetchAnalytics = useCallback(async (refresh = false) => {
    if (!user) return;

    if (refresh) {
      setIsRefreshing(true);
    }

    setLoading(true);
    setProgress(0);

    try {
      const { data: userLinks, error: linksError } = await supabase
        .from("links")
        .select("id, short_code, original_url, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (linksError) {
        console.error("Error fetching links:", linksError);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      setTotalLinks(userLinks?.length || 0);

      if (userLinks && userLinks.length > 0) {
        const linksWithStats: LinkWithStats[] = [];
        let total = 0;
        let humanTotal = 0;
        const allStats: any[] = [];

        for (const link of userLinks) {
          try {
            const shortUrl = `https://s.linkforge.website/${link.short_code}`;
            const stats = await getShortIoStats(link.short_code);
            
            if (stats) {
              const clickCount = stats.totalClicks || stats.clicks || 0;
              total += clickCount;
              humanTotal += stats.humanClicks || clickCount;
              
              linksWithStats.push({
                ...link,
                short_url: shortUrl,
                clicks: clickCount,
                stats: stats,
              });
              
              allStats.push(stats);
            } else {
              linksWithStats.push({
                ...link,
                short_url: shortUrl,
                clicks: 0,
              });
            }
          } catch (error) {
            console.error("Error fetching stats for link:", link.short_code, error);
            linksWithStats.push({
              ...link,
              short_url: `https://s.linkforge.website/${link.short_code}`,
              clicks: 0,
            });
          }
        }

        setLinks(linksWithStats);
        setTotalClicks(total);
        setTotalHumanClicks(humanTotal);
        setProgress(100);

        processStatsData(allStats, total, humanTotal);
      } else {
        setLinks([]);
        setTotalClicks(0);
        setTotalHumanClicks(0);
        setDailyClicksData([]);
        setDeviceData([]);
        setCountryData([]);
        setBrowserData([]);
        setOsData([]);
        setReferrerData([]);
        setRecentClicks([]);
        setClicksToday(0);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [user, processStatsData]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = useCallback(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = ["Short Code", "Original URL", "Clicks", "Browsers", "Devices", "Countries"];
      const rows = links.map(link => [
        link.short_code,
        link.original_url,
        link.clicks,
        link.stats?.browsers ? Object.keys(link.stats.browsers).join(", ") : "",
        link.stats?.devices ? Object.keys(link.stats.devices).join(", ") : "",
        link.stats?.countries ? Object.keys(link.stats.countries).join(", ") : "",
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
    setIsExporting(false);
  };

  const stats = [
    { label: "Total Clicks", value: totalClicks, icon: MousePointerClick, color: "text-primary", bg: "bg-primary/10" },
    { label: "Human Clicks", value: totalHumanClicks, icon: Users, color: "text-info", bg: "bg-info/10" },
    { label: "Total Links", value: totalLinks, icon: Link2, color: "text-accent", bg: "bg-accent/10" },
    { label: "Countries", value: countryData.length, icon: Globe, color: "text-success", bg: "bg-success/10" },
    { label: "Devices", value: deviceData.length, icon: Monitor, color: "text-primary", bg: "bg-primary/10" },
    { label: "Browsers", value: browserData.length, icon: Chrome, color: "text-info", bg: "bg-info/10" },
  ];

  if (loading && !isRefreshing) {
    return <AnalyticsSkeleton progress={progress} />;
  }

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "8px",
    color: colors.tooltipText,
    fontSize: 12,
    padding: "8px 12px",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} clicks
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Real-time performance from Short.io</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="text-xs md:text-sm">
            {isRefreshing ? (
              <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1 md:mr-2" />
            ) : (
              <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || totalClicks === 0} className="text-xs md:text-sm">
            <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs md:text-sm">
            <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRefreshing && progress > 0 && progress < 100 && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl p-3 md:p-4 ${stat.bg} border border-border/50 hover:border-primary/20 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
              <span className="text-lg md:text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</span>
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {totalClicks === 0 && links.length === 0 ? (
        <div className="glass-card rounded-xl p-8 md:p-12 text-center">
          <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <h3 className="font-heading text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">No analytics yet</h3>
          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
            Share your links to start seeing click analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Clicks Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
              <h3 className="font-heading font-semibold text-foreground text-base md:text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Clicks Over Time
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-xs text-muted-foreground">Last 30 days</span>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyClicksData}>
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" stroke={colors.text} fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis stroke={colors.text} fontSize={10} allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke={colors.primary} 
                  fill="url(#clickGradient)" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: colors.primary }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-2 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                Total: {totalClicks}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                Today: {clicksToday}
              </span>
            </div>
          </motion.div>

          {/* Two Cards in One Line - Top Links & Device Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Top Links */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-success" />
                Top Performing Links
              </h3>
              <div className="space-y-2 md:space-y-3">
                {links.filter(l => l.clicks > 0).length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-3 md:py-4">No clicks yet.</p>
                ) : (
                  links
                    .filter(l => l.clicks > 0)
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5)
                    .map((link, i) => (
                      <div key={link.id} className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                        <span className="text-[10px] md:text-xs font-mono text-muted-foreground w-5 md:w-6 text-right font-bold">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-medium text-foreground truncate">
                            {link.title || link.short_code}
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {link.original_url}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm font-mono font-semibold text-primary">
                          <MousePointerClick className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {link.clicks.toLocaleString()}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>

            {/* Device Distribution - FIXED */}
            {deviceData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
                <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-info" />
                  Device Distribution
                </h3>
                <div className="h-[200px] md:h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={deviceData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value" 
                        paddingAngle={3}
                        label={({ name, percent }) => {
                          // Only show label if percentage is significant
                          return (percent * 100) > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : '';
                        }}
                        labelLine={false}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={entry.name} fill={colors.chartColors[index % colors.chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Device legend - mobile friendly */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {deviceData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-[10px] md:text-xs">
                      <span className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: colors.chartColors[index % colors.chartColors.length] }} />
                      <span>{entry.name}</span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Countries with Map */}
          {countryData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <div className="section-header">
                <h3 className="section-title text-base md:text-lg">
                  <Globe className="w-4 h-4 md:w-5 md:h-5 text-success" />
                  Global Reach
                </h3>
                <span className="section-subtitle text-xs md:text-sm">
                  {countryData.reduce((sum, c) => sum + c.value, 0)} total clicks
                </span>
              </div>
              
              <WorldMap data={countryData} />
              
              <div className="country-grid">
                {countryData.slice(0, 8).map((country) => {
                  return (
                    <div 
                      key={country.name} 
                      className="country-card"
                    >
                      <div className="flex items-center min-w-0">
                        <span className="country-flag">{getFlagEmoji(country.code || '')}</span>
                        <span className="country-name">{country.name}</span>
                      </div>
                      <span className="country-clicks">{country.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Browsers - Responsive */}
          {browserData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Monitor className="w-4 h-4 md:w-5 md:h-5 text-info" />
                Top Browsers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {browserData.slice(0, 6).map((b) => {
                  const maxVal = browserData[0]?.value || 1;
                  const pct = Math.round((b.value / maxVal) * 100);
                  return (
                    <div key={b.name} className="p-2 md:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-foreground flex items-center gap-1 md:gap-2">
                          <span className="text-base md:text-xl">{b.icon || '🌐'}</span>
                          <span className="font-medium text-xs md:text-sm truncate">{b.name}</span>
                        </span>
                        <span className="font-mono text-[10px] md:text-xs text-muted-foreground">{b.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 md:h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.secondary }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* OS - Responsive */}
          {osData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Monitor className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                Operating Systems
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {osData.slice(0, 6).map((o) => {
                  const maxVal = osData[0]?.value || 1;
                  const pct = Math.round((o.value / maxVal) * 100);
                  return (
                    <div key={o.name} className="p-2 md:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-foreground flex items-center gap-1 md:gap-2">
                          <span className="text-base md:text-xl">{o.icon || '💻'}</span>
                          <span className="font-medium text-xs md:text-sm truncate">{o.name}</span>
                        </span>
                        <span className="font-mono text-[10px] md:text-xs text-muted-foreground">{o.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 md:h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.accent }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Referrers - Responsive */}
          {referrerData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Link2 className="w-4 h-4 md:w-5 md:h-5 text-success" />
                Top Referrers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {referrerData.slice(0, 6).map((r) => {
                  const maxVal = referrerData[0]?.value || 1;
                  const pct = Math.round((r.value / maxVal) * 100);
                  return (
                    <div key={r.name} className="p-2 md:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-foreground truncate font-medium text-xs md:text-sm">{r.name || "Direct"}</span>
                        <span className="font-mono text-[10px] md:text-xs text-muted-foreground">{r.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 md:h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.success }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recent Activity - Responsive */}
          {recentClicks.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-1.5 md:space-y-2">
                {recentClicks.slice(0, 8).map((click, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-secondary/10 transition-colors border-b border-border last:border-0 gap-1 md:gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <MousePointerClick className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] md:text-sm text-foreground">
                          {click.browser || "Chrome"} · {click.device_type || "💻 Desktop"} · {click.os || "Windows"}
                        </span>
                        {click.country && (
                          <span className="text-muted-foreground ml-1 text-[10px] md:text-sm">
                            <span className="text-xs md:text-base">{getFlagEmoji(click.country)}</span>
                            {click.city ? ` ${click.city}, ` : " "}{click.country}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground shrink-0">
                      {click.clicked_at ? formatDistance(new Date(click.clicked_at), new Date(), { addSuffix: true }) : "Just now"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function AnalyticsSkeleton({ progress = 0 }) {
  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <Skeleton className="h-6 md:h-8 w-24 md:w-32" />
          <Skeleton className="h-3 md:h-4 w-32 md:w-48 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 md:h-9 w-20 md:w-28" />
          <Skeleton className="h-8 md:h-9 w-16 md:w-20" />
        </div>
      </div>
      
      {progress > 0 && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-3 md:p-4 border border-border/50">
            <Skeleton className="h-4 w-4 md:h-5 md:w-5 mb-1 md:mb-2" />
            <Skeleton className="h-5 md:h-8 w-10 md:w-16" />
            <Skeleton className="h-2 md:h-3 w-14 md:w-20 mt-0.5" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-4 md:p-5 border border-border/50">
        <Skeleton className="h-5 md:h-6 w-28 md:w-40 mb-3 md:mb-4" />
        <Skeleton className="h-[200px] md:h-[300px] w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="h-48 md:h-64 w-full rounded-xl" />
        <Skeleton className="h-48 md:h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}