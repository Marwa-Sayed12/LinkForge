import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, MousePointerClick, Globe, Monitor, TrendingUp, Clock, Link2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth";
import { getShortIoStats } from "@/lib/shortio";
import { format, subDays, startOfDay } from "date-fns";

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    primary: isDark ? "hsl(174, 72%, 56%)" : "hsl(234, 89%, 74%)",
    secondary: isDark ? "hsl(199, 89%, 48%)" : "hsl(250, 80%, 67%)",
    accent: isDark ? "hsl(36, 95%, 62%)" : "hsl(36, 95%, 55%)",
    success: isDark ? "hsl(142, 71%, 45%)" : "hsl(142, 76%, 36%)",
    grid: isDark ? "hsl(222, 30%, 18%)" : "hsl(220, 13%, 87%)",
    text: isDark ? "hsl(215, 20%, 55%)" : "hsl(220, 9%, 46%)",
    tooltipBg: isDark ? "hsl(222, 40%, 10%)" : "hsl(0, 0%, 100%)",
    tooltipBorder: isDark ? "hsl(222, 30%, 18%)" : "hsl(220, 13%, 87%)",
    tooltipText: isDark ? "hsl(210, 40%, 93%)" : "hsl(222, 47%, 11%)",
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

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);

      try {
        // 1. Fetch user's links from Supabase (just to know which links exist)
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
          let allStats: any[] = [];

          // 2. For each link, fetch stats from Short.io API
          for (const link of userLinks) {
            try {
              const shortUrl = `https://s.linkforge.website/${link.short_code}`;
              const stats = await getShortIoStats(link.short_code);
              
              if (stats) {
                // Short.io returns: { totalClicks, clicksByDate, devices, countries, browsers, os, recentClicks }
                const clickCount = stats.totalClicks || stats.clicks || 0;
                total += clickCount;
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

          // 3. Process daily clicks from Short.io data
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

          // Generate last 14 days data
          const days: { date: string; clicks: number }[] = [];
          for (let i = 13; i >= 0; i--) {
            const date = startOfDay(subDays(new Date(), i));
            const label = format(date, "MMM d");
            const dateStr = format(date, "yyyy-MM-dd");
            days.push({
              date: label,
              clicks: dailyMap[dateStr] || 0,
            });
          }
          setDailyClicksData(days);

          // 4. Process device data from Short.io
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
          setDeviceData(Object.entries(deviceMap).map(([name, value]) => ({ name, value })));

          // 5. Process country data from Short.io
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
          setCountryData(Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8));

          // 6. Process browser data from Short.io
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
          setBrowserData(Object.entries(browserMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

          // 7. Process OS data from Short.io
          const osMap: Record<string, number> = {};
          allStats.forEach((stats) => {
            if (stats.os) {
              Object.entries(stats.os).forEach(([os, count]: [string, any]) => {
                const countNum = typeof count === 'number' ? count : 0;
                if (countNum > 0) {
                  osMap[os] = (osMap[os] || 0) + countNum;
                }
              });
            }
          });
          setOsData(Object.entries(osMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

          // 8. Get recent clicks from Short.io
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
          setRecentClicks(allRecentClicks.sort((a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime()).slice(0, 10));

        } else {
          setLinks([]);
          setTotalClicks(0);
          setDailyClicksData([]);
          setDeviceData([]);
          setCountryData([]);
          setBrowserData([]);
          setOsData([]);
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

  const stats = [
    { label: "Total Clicks", value: totalClicks, icon: MousePointerClick },
    { label: "Clicks Today", value: clicksToday, icon: TrendingUp },
    { label: "Total Links", value: totalLinks, icon: Link2 },
    { label: "Countries", value: countryData.length, icon: Globe },
    { label: "Devices", value: deviceData.length, icon: Monitor },
    { label: "Browsers", value: browserData.length, icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="w-5 h-5 bg-muted rounded mb-3" />
              <div className="w-16 h-7 bg-muted rounded mb-1" />
              <div className="w-20 h-3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "8px",
    color: colors.tooltipText,
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Real-time performance from Short.io.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5"
          >
            <stat.icon className="w-5 h-5 text-muted-foreground mb-3" />
            <div className="font-heading text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {totalClicks === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No analytics yet</h3>
          <p className="text-sm text-muted-foreground">Share your links to start seeing click analytics.</p>
        </div>
      ) : (
        <>
          {links.filter(l => l.clicks > 0).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Total Clicks per Link</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, links.filter(l => l.clicks > 0).length * 50)}>
                <BarChart data={links.filter(l => l.clicks > 0).map(l => ({ name: l.title || l.short_code, clicks: l.clicks }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                  <XAxis type="number" stroke={colors.text} fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke={colors.text} fontSize={11} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clicks" fill={colors.primary} radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Click Trends (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyClicksData}>
                  <defs>
                    <linearGradient id="dashClickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="date" stroke={colors.text} fontSize={11} />
                  <YAxis stroke={colors.text} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="clicks" stroke={colors.primary} fill="url(#dashClickGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {deviceData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Devices</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                      {deviceData.map((entry, index) => (
                        <Cell key={entry.name} fill={[colors.primary, colors.secondary, colors.accent, colors.success][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {deviceData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.success][i % 4] }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {countryData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Top Countries</h3>
              <div className="space-y-2.5">
                {countryData.map((c) => {
                  const maxVal = countryData[0]?.value || 1;
                  const pct = Math.round((c.value / maxVal) * 100);
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{c.name}</span>
                        <span className="font-mono text-muted-foreground">{c.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
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

          <div className="grid lg:grid-cols-2 gap-4">
            {browserData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Browser Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={browserData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                    <XAxis type="number" stroke={colors.text} fontSize={12} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke={colors.text} fontSize={12} width={80} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill={colors.secondary} radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {osData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Operating Systems</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={osData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                      {osData.map((entry, index) => (
                        <Cell key={entry.name} fill={[colors.primary, colors.secondary, colors.accent, colors.success][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {osData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.success][i % 4] }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

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
                          {click.browser || "Unknown"} · {click.device_type || "Unknown"} · {click.os || "Unknown"}
                        </span>
                        {click.country && (
                          <span className="text-muted-foreground"> · {click.city ? `${click.city}, ` : ""}{click.country}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {click.clicked_at ? format(new Date(click.clicked_at), "MMM d, h:mm a") : "Just now"}
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