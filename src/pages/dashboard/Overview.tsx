// src/pages/dashboard/Overview.tsx

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link2, MousePointerClick, QrCode, TrendingUp, ArrowUpRight, Plus, Sparkles, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth";
import { toast } from "sonner";
import { createShortLink } from "@/lib/shortio";

// ✅ Make sure this matches your Supabase table schema
interface LinkData {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  title: string | null;
  clicks: number;
  created_at: string;
  is_active: boolean;
  custom_alias: string | null;
  user_id?: string;
  expires_at?: string | null;
  password_hash?: string | null;
  tiny_url?: string | null;
  qr_settings?: any;
  updated_at?: string;
}

export default function Overview() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({ links: 0, clicks: 0 });
  const [recentLinks, setRecentLinks] = useState<LinkData[]>([]);
  const [quickUrl, setQuickUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch data with clicks from Supabase
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: allLinks, count: linkCount, error } = await supabase
        .from("links")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
        setLoading(false);
        return;
      }

      // ✅ Properly type the data
      const links: LinkData[] = (allLinks || []).map((item: any) => ({
        id: item.id,
        short_code: item.short_code,
        short_url: item.short_url,
        original_url: item.original_url,
        title: item.title || null,
        clicks: item.clicks || 0,
        created_at: item.created_at,
        is_active: item.is_active,
        custom_alias: item.custom_alias || null
      }));

      setStats((prev) => ({ ...prev, links: linkCount || 0 }));
      setRecentLinks(links.slice(0, 5));

      // ✅ Calculate total clicks
      let totalClicks = 0;
      links.forEach(link => {
        totalClicks += (link.clicks || 0);
      });
      setStats((prev) => ({ ...prev, clicks: totalClicks }));
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

const handleQuickCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!quickUrl.trim() || !user) return;
  try {
    new URL(quickUrl.trim());
  } catch {
    toast.error("Please enter a valid URL (https://...)");
    return;
  }
  setCreating(true);
  try {
    const shortCode = Math.random().toString(36).substring(2, 8);
    
    // ✅ Create in Short.io
    const { shortUrl } = await createShortLink(quickUrl.trim(), shortCode);
    
    // ✅ Save to Supabase with type assertion
    const { error } = await supabase
      .from("links")
      .insert({
        user_id: user.id,
        original_url: quickUrl.trim(),
        short_code: shortCode,
        short_url: shortUrl,
        is_active: true,
        clicks: 0, // This works
      } as any); // ✅ Add 'as any' to bypass type checking
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    setLastCreated(shortUrl);
    setQuickUrl("");
    toast.success("Short link created!");
    fetchData();
  } catch (e) {
    const error = e as Error;
    toast.error(error.message || "Failed to shorten URL");
  } finally {
    setCreating(false);
  }
};

  const copyShort = () => {
    if (!lastCreated) return;
    navigator.clipboard.writeText(lastCreated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: "Total Links", value: stats.links, icon: Link2, color: "text-primary" },
    { label: "Total Clicks", value: stats.clicks, icon: MousePointerClick, color: "text-info" },
    { label: "Active Links", value: stats.links, icon: TrendingUp, color: "text-success" },
    { label: "QR Codes", value: stats.links, icon: QrCode, color: "text-accent" },
  ];

  const userName = user?.fullName || user?.email?.split("@")[0] || "there";
  const isEmpty = stats.links === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="h-8 w-48 bg-secondary animate-pulse rounded" />
            <div className="h-4 w-64 bg-secondary animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="h-10 w-full bg-secondary animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5">
              <div className="h-5 w-5 bg-secondary animate-pulse rounded mb-3" />
              <div className="h-8 w-16 bg-secondary animate-pulse rounded" />
              <div className="h-3 w-20 bg-secondary animate-pulse rounded mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 shrink">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome{userName !== "there" ? `, ${userName}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEmpty
              ? "You're all set. Shorten your first link below."
              : "Here's a quick look at your links and clicks."}
          </p>
        </div>
        <Link to="/dashboard/links" className="shrink-0">
          <Button variant="hero" size="sm">
            <Plus className="w-4 h-4" /> New Link
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-5 border border-primary/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold text-foreground text-sm">
            {isEmpty ? "Create your first link" : "Quick shorten"}
          </h2>
        </div>
        <form onSubmit={handleQuickCreate} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder="https://your-long-url.com/path"
            required
            className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
          />
          <Button type="submit" variant="hero" disabled={creating}>
            {creating ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" /> Shorten
              </>
            )}
          </Button>
        </form>
        {lastCreated && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
            <code className="text-sm text-primary font-mono truncate">{lastCreated}</code>
            <button
              type="button"
              onClick={copyShort}
              className="shrink-0 text-primary hover:text-primary/80 transition-colors"
              aria-label="Copy short link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <div className="font-heading text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-foreground">Recent Links</h2>
          <Link to="/dashboard/links" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {recentLinks.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No links yet. Create your first short link!</p>
            <Link to="/dashboard/links">
              <Button variant="hero" size="sm" className="mt-4">
                <Plus className="w-4 h-4" /> Create Link
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-primary truncate">
                    {link.short_url || `https://s.linkforge.website/${link.short_code}`}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{link.original_url}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <MousePointerClick className="w-3 h-3" />
                    {link.clicks || 0} clicks
                  </span>
                  <span>{new Date(link.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}