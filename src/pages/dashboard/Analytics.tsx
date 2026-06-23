// src/pages/dashboard/Analytics.tsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, MousePointerClick, Globe, Monitor, TrendingUp, Clock, Link2,
  Download, Filter, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth";
import { getShortIoStatsDirect } from "@/lib/shortio-direct"; 

import { format, subDays, startOfDay, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
    chartColors: ["#1FB07E", "#0B9BD7", "#E8A317", "#E5484D", "#8B5CF6", "#EC4899"],
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

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);

      try {
        // Fetch user's links from Supabase
        const { data: userLinks, error: linksError } = await supabase
          .from("links")
          .select("id, short_code, original_url, title")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (linksError) {
          console.error("Error fetching links:", linksError);
          setLoading(false);
          return;
        }

        setTotalLinks(userLinks?.length || 0);

        if (userLinks && userLinks.length > 0) {
          const linksWithStats: LinkWithStats[] = [];
          let total = 0;
          let humanTotal = 0;
          let allStats: any[] = [];

          // For each link, fetch stats from Short.io API
          for (const link of userLinks) {
            try {
              const shortUrl = `https://s.linkforge.website/${link.short_code}`;
                 const stats = await getShortIoStatsDirect(link.short_code);
              
              if (stats) {
                const clickCount = stats.totalClicks || stats.clicks || 0;
                const humanClicks = stats.humanClicks || clickCount;
                total += clickCount;
                humanTotal += humanClicks;
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

          // Process daily clicks
          const dailyMap: Record<string, number> = {};
          const now = new Date();
          let todayCount = 0;

          allStats.forEach((stats) => {
            if (stats.clicksByDate) {
              Object.entries(stats.clicksByDate).forEach(([date, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  dailyMap[date] = (dailyMap[date] || 0) + countNum;
                  const clickDate = new Date(date);
                  if (clickDate.toDateString() === now.toDateString()) {
                    todayCount += countNum;
                  }
                }
              });
            }
          });

          setClicksToday(todayCount);

          // Generate last 30 days data
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

          // Process device data
          const deviceMap: Record<string, number> = {};
          allStats.forEach((stats) => {
            if (stats.devices) {
              Object.entries(stats.devices).forEach(([device, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  deviceMap[device] = (deviceMap[device] || 0) + countNum;
                }
              });
            }
          });
          setDeviceData(
            Object.entries(deviceMap)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
          );

          // Process country data
          const countryMap: Record<string, number> = {};
          allStats.forEach((stats) => {
            if (stats.countries) {
              Object.entries(stats.countries).forEach(([country, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  countryMap[country] = (countryMap[country] || 0) + countNum;
                }
              });
            }
          });
          setCountryData(
            Object.entries(countryMap)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
          );

          // Process browser data
          const browserMap: Record<string, number> = {};
          allStats.forEach((stats) => {
            if (stats.browsers) {
              Object.entries(stats.browsers).forEach(([browser, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  browserMap[browser] = (browserMap[browser] || 0) + countNum;
                }
              });
            }
          });
          setBrowserData(
            Object.entries(browserMap)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
          );

          // ✅ FIXED: Process OS data - using 'oss' instead of 'os'
          const osMap: Record<string, number> = {};
          allStats.forEach((stats) => {
            if (stats.oss) {  // ✅ Changed from 'os' to 'oss'
              Object.entries(stats.oss).forEach(([os, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  osMap[os] = (osMap[os] || 0) + countNum;
                }
              });
            }
          });
          setOsData(
            Object.entries(osMap)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
          );

          // Process referrer data
          const referrerMap: Record<string, number> = {};
          allStats.forEach((stats) => {
            if (stats.referrers) {
              Object.entries(stats.referrers).forEach(([referrer, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  referrerMap[referrer] = (referrerMap[referrer] || 0) + countNum;
                }
              });
            }
          });
          setReferrerData(
            Object.entries(referrerMap)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
          );

          // Get recent clicks
          const allRecentClicks: any[] = [];
          allStats.forEach((stats) => {
            if (stats.recentClicks) {
              stats.recentClicks.forEach((click: any) => {
                allRecentClicks.push({
                  ...click,
                  clicked_at: click.timestamp || new Date().toISOString(),
                  browser: click.browser || "Unknown",
                  device_type: click.device || "Desktop",
                  os: click.os || "Unknown",
                  country: click.country || null,
                  city: click.city || null,
                });
              });
            }
          });
          setRecentClicks(
            allRecentClicks
              .sort((a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime())
              .slice(0, 10)
          );

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
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [user]);

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
    { label: "Total Clicks", value: totalClicks, icon: MousePointerClick, color: "text-primary" },
    { label: "Human Clicks", value: totalHumanClicks, icon: TrendingUp, color: "text-info" },
    { label: "Total Links", value: totalLinks, icon: Link2, color: "text-accent" },
    { label: "Countries", value: countryData.length, icon: Globe, color: "text-success" },
    { label: "Devices", value: deviceData.length, icon: Monitor, color: "text-primary" },
    { label: "Browsers", value: browserData.length, icon: BarChart3, color: "text-info" },
  ];

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "8px",
    color: colors.tooltipText,
    fontSize: 12,
    padding: "8px 12px",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Real-time performance from Short.io</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || totalClicks === 0}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="font-heading text-2xl font-bold text-foreground">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {totalClicks === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No analytics yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Share your links to start seeing click analytics. Every click is tracked with detailed metrics.
          </p>
        </div>
      ) : (
        <>
          {/* Clicks Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Clicks Over Time</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Last 30 days</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyClicksData}>
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" stroke={colors.text} fontSize={11} />
                <YAxis stroke={colors.text} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke={colors.primary} 
                  fill="url(#clickGradient)" 
                  strokeWidth={2.5}
                  activeDot={{ r: 6, fill: colors.primary }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Links + Devices */}
          <div className="grid lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Top Performing Links</h3>
              <div className="space-y-3">
                {links.filter(l => l.clicks > 0).slice(0, 5).map((link, i) => (
                  <div key={link.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {link.title || link.short_code}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {link.original_url}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-mono font-semibold text-primary">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      {link.clicks.toLocaleString()}
                    </div>
                  </div>
                ))}
                {links.filter(l => l.clicks > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground">No clicks yet.</p>
                )}
              </div>
            </motion.div>

            {deviceData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Device Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie 
                      data={deviceData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={80} 
                      dataKey="value" 
                      paddingAngle={3}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={entry.name} fill={colors.chartColors[index % colors.chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Countries, Browsers, OS, Referrers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {countryData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Top Countries</h3>
                <div className="space-y-2.5">
                  {countryData.slice(0, 6).map((c) => {
                    const maxVal = countryData[0]?.value || 1;
                    const pct = Math.round((c.value / maxVal) * 100);
                    return (
                      <div key={c.name}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-foreground">{c.name}</span>
                          <span className="font-mono text-muted-foreground">{c.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: colors.primary }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {browserData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Top Browsers</h3>
                <div className="space-y-2.5">
                  {browserData.slice(0, 6).map((b) => {
                    const maxVal = browserData[0]?.value || 1;
                    const pct = Math.round((b.value / maxVal) * 100);
                    return (
                      <div key={b.name}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-foreground">{b.name}</span>
                          <span className="font-mono text-muted-foreground">{b.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
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

            {osData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Operating Systems</h3>
                <div className="space-y-2.5">
                  {osData.slice(0, 6).map((o) => {
                    const maxVal = osData[0]?.value || 1;
                    const pct = Math.round((o.value / maxVal) * 100);
                    return (
                      <div key={o.name}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-foreground">{o.name}</span>
                          <span className="font-mono text-muted-foreground">{o.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
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

            {referrerData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Top Referrers</h3>
                <div className="space-y-2.5">
                  {referrerData.slice(0, 6).map((r) => {
                    const maxVal = referrerData[0]?.value || 1;
                    const pct = Math.round((r.value / maxVal) * 100);
                    return (
                      <div key={r.name}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-foreground">{r.name || "Direct"}</span>
                          <span className="font-mono text-muted-foreground">{r.value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
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
          </div>

          {/* Recent Activity */}
          {recentClicks.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Activity
              </h3>
              <div className="space-y-2">
                {recentClicks.map((click, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MousePointerClick className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-foreground">
                          {click.browser || "Unknown"} · {click.device_type || "Desktop"} · {click.os || "Unknown"}
                        </span>
                        {click.country && (
                          <span className="text-muted-foreground"> · {click.city ? `${click.city}, ` : ""}{click.country}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
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

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <Skeleton className="h-5 w-5 mb-2" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-0.5" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}