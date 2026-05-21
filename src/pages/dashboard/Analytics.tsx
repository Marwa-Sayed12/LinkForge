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
import { useAuth } from "@/hooks/useClerkAuth"
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

interface LinkWithClicks {
  id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  clickCount: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const colors = useChartColors();
  const [clicks, setClicks] = useState<any[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);
  const [topLinks, setTopLinks] = useState<LinkWithClicks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAnalytics = async () => {
      setLoading(true);

      // Fetch all user links
      const { data: links } = await supabase
        .from("links")
        .select("id, short_code, original_url, title")
        .eq("user_id", user.id);

      setTotalLinks(links?.length || 0);

      if (links && links.length > 0) {
        const linkIds = links.map((l) => l.id);

        // Fetch all clicks for user's links
        const { data: clickData } = await supabase
          .from("clicks")
          .select("*")
          .in("link_id", linkIds)
          .order("clicked_at", { ascending: false });

        const allClicks = clickData || [];
        setClicks(allClicks);
        setTotalClicks(allClicks.length);

        // Calculate per-link click counts for top links
        const clickCountMap: Record<string, number> = {};
        allClicks.forEach((c) => {
          clickCountMap[c.link_id] = (clickCountMap[c.link_id] || 0) + 1;
        });

        const linksWithClicks: LinkWithClicks[] = links
          .map((l) => ({
            ...l,
            clickCount: clickCountMap[l.id] || 0,
          }))
          .sort((a, b) => b.clickCount - a.clickCount)
          .slice(0, 5);

        setTopLinks(linksWithClicks);
      } else {
        setClicks([]);
        setTotalClicks(0);
        setTopLinks([]);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [user]);

  // Group clicks by date (last 14 days)
  const dailyClicks = (() => {
    const days: { date: string; clicks: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const label = format(date, "MMM d");
      const count = clicks.filter((c) => {
        const clickDate = startOfDay(new Date(c.clicked_at));
        return clickDate.getTime() === date.getTime();
      }).length;
      days.push({ date: label, clicks: count });
    }
    return days;
  })();

  // Device breakdown
  const deviceBreakdown = clicks.reduce((acc: Record<string, number>, click) => {
    const device = click.device_type || "Unknown";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});
  const deviceData = Object.entries(deviceBreakdown).map(([name, value], i) => ({
    name,
    value: value as number,
    color: [colors.primary, colors.secondary, colors.accent, colors.success][i % 4],
  }));

  // Browser breakdown
  const browserBreakdown = clicks.reduce((acc: Record<string, number>, click) => {
    const browser = click.browser || "Unknown";
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {});
  const browserData = Object.entries(browserBreakdown)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  // Country breakdown
  const countryBreakdown = clicks.reduce((acc: Record<string, number>, click) => {
    const country = click.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const countryData = Object.entries(countryBreakdown)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // OS breakdown
  const osBreakdown = clicks.reduce((acc: Record<string, number>, click) => {
    const os = click.os || "Unknown";
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {});
  const osData = Object.entries(osBreakdown)
    .map(([name, value], i) => ({
      name,
      value: value as number,
      color: [colors.primary, colors.secondary, colors.accent, colors.success][i % 4],
    }))
    .sort((a, b) => b.value - a.value);

  // Recent clicks (last 10)
  const recentClicks = clicks.slice(0, 10);

  // Clicks today
  const today = startOfDay(new Date());
  const clicksToday = clicks.filter(
    (c) => startOfDay(new Date(c.clicked_at)).getTime() === today.getTime()
  ).length;

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "8px",
    color: colors.tooltipText,
    fontSize: 12,
  };

  const stats = [
    { label: "Total Clicks", value: totalClicks, icon: MousePointerClick },
    { label: "Clicks Today", value: clicksToday, icon: TrendingUp },
    { label: "Total Links", value: totalLinks, icon: Link2 },
    { label: "Countries", value: new Set(clicks.map((c) => c.country).filter(Boolean)).size, icon: Globe },
    { label: "Devices", value: new Set(clicks.map((c) => c.device_type).filter(Boolean)).size, icon: Monitor },
    { label: "Browsers", value: new Set(clicks.map((c) => c.browser).filter(Boolean)).size, icon: BarChart3 },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Real-time performance across all your links.</p>
      </div>

      {/* Stats */}
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
          {/* Total Clicks per Link */}
          {topLinks.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Total Clicks per Link</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, topLinks.length * 50)}>
                <BarChart data={topLinks.map(l => ({ name: l.title || l.short_code, clicks: l.clickCount }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                  <XAxis type="number" stroke={colors.text} fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke={colors.text} fontSize={11} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clicks" fill={colors.primary} radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Click Trends + Devices */}
          <div className="grid lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Click Trends (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyClicks}>
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
                      {deviceData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {deviceData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Top Links + Country */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top Performing Links */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Top Performing Links</h3>
              {topLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No link data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topLinks.map((link, i) => (
                    <div key={link.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {link.title || link.short_code}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{link.original_url}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-mono font-semibold text-primary">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {link.clickCount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Countries */}
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
          </div>

          {/* Browser + OS */}
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
                      {osData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {osData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
            <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Activity
            </h3>
            {recentClicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent clicks.</p>
            ) : (
              <div className="space-y-2">
                {recentClicks.map((click) => (
                  <div
                    key={click.id}
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
                      {format(new Date(click.clicked_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
