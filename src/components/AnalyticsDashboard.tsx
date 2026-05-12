import { motion } from "framer-motion";
import { BarChart3, Globe, Monitor, MousePointerClick, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { useTheme } from "./ThemeProvider";

const clickData = [
  { day: "Mon", clicks: 120 }, { day: "Tue", clicks: 210 },
  { day: "Wed", clicks: 185 }, { day: "Thu", clicks: 290 },
  { day: "Fri", clicks: 340 }, { day: "Sat", clicks: 180 },
  { day: "Sun", clicks: 150 },
];

const stats = [
  { label: "Total Clicks", value: "12,847", change: "+12.3%", up: true, icon: MousePointerClick },
  { label: "Unique Visitors", value: "8,429", change: "+8.7%", up: true, icon: TrendingUp },
  { label: "Active Links", value: "342", change: "+3", up: true, icon: BarChart3 },
  { label: "Countries", value: "67", change: "-2", up: false, icon: Globe },
];

const browserData = [
  { name: "Chrome", value: 64 }, { name: "Safari", value: 18 },
  { name: "Firefox", value: 10 }, { name: "Edge", value: 8 },
];

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    primary: isDark ? "hsl(174, 72%, 56%)" : "hsl(234, 89%, 74%)",
    secondary: isDark ? "hsl(199, 89%, 48%)" : "hsl(250, 80%, 67%)",
    accent: isDark ? "hsl(36, 95%, 62%)" : "hsl(36, 95%, 55%)",
    grid: isDark ? "hsl(222, 30%, 18%)" : "hsl(220, 13%, 87%)",
    text: isDark ? "hsl(215, 20%, 55%)" : "hsl(220, 9%, 46%)",
    tooltipBg: isDark ? "hsl(222, 40%, 10%)" : "hsl(0, 0%, 100%)",
    tooltipBorder: isDark ? "hsl(222, 30%, 18%)" : "hsl(220, 13%, 87%)",
    tooltipText: isDark ? "hsl(210, 40%, 93%)" : "hsl(222, 47%, 11%)",
  };
}

export function AnalyticsDashboard() {
  const colors = useChartColors();

  const deviceData = [
    { name: "Desktop", value: 52, color: colors.primary },
    { name: "Mobile", value: 38, color: colors.secondary },
    { name: "Tablet", value: 10, color: colors.accent },
  ];

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "8px",
    color: colors.tooltipText,
    fontSize: 12,
  };

  return (
    <section className="py-24" id="analytics">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-4">
            Analytics <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-muted-foreground text-lg">Every click tells a story. See yours in real time.</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <span className={`text-xs font-mono flex items-center gap-0.5 ${stat.up ? "text-success" : "text-destructive"}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="font-heading text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass-card rounded-xl p-5"
          >
            <h3 className="font-heading font-semibold text-foreground mb-4">Click Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={clickData}>
                <defs>
                  <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="day" stroke={colors.text} fontSize={12} />
                <YAxis stroke={colors.text} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="clicks" stroke={colors.primary} fill="url(#clickGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Device Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-xl p-5"
          >
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
            <div className="flex justify-center gap-4 mt-2">
              {deviceData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} {d.value}%
                </div>
              ))}
            </div>
          </motion.div>

          {/* Browser Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 glass-card rounded-xl p-5"
          >
            <h3 className="font-heading font-semibold text-foreground mb-4">Browser Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={browserData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
                <XAxis type="number" stroke={colors.text} fontSize={12} />
                <YAxis dataKey="name" type="category" stroke={colors.text} fontSize={12} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={colors.secondary} radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
