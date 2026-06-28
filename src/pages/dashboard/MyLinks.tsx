// src/pages/dashboard/MyLinks.tsx

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Link2, Copy, Check, Trash2, QrCode, ExternalLink, Download, MousePointerClick, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth";
import { toast } from "sonner";
import { createShortLink, getMultipleLinkClicks } from "@/lib/shortio";

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
}

function getShortUrl(shortCode: string) {
  return `https://s.linkforge.website/${shortCode}`;
}

function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8);
}

export default function MyLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [suggestedAlias, setSuggestedAlias] = useState("");
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [loadingClicks, setLoadingClicks] = useState<Record<string, boolean>>({});

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      setLinks(data as LinkData[] || []);
      setLoading(false);
      
      // ✅ Get click counts from Supabase
      if (data && data.length > 0) {
        const shortCodes = data.map(link => link.short_code);
        const counts = await getMultipleLinkClicks(shortCodes);
        
        const result: Record<string, number> = {};
        data.forEach(link => {
          result[link.id] = counts[link.short_code] || 0;
        });
        setClickCounts(result);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
      setLoading(false);
    }
  }, [user]);

  const refreshClicks = useCallback(async () => {
    if (!links.length) return;
    setRefreshing(true);
    
    const loadingState: Record<string, boolean> = {};
    links.forEach(link => { loadingState[link.id] = true; });
    setLoadingClicks(loadingState);
    
    try {
      const shortCodes = links.map(link => link.short_code);
      const counts = await getMultipleLinkClicks(shortCodes);
      
      const result: Record<string, number> = {};
      links.forEach(link => {
        result[link.id] = counts[link.short_code] || 0;
      });
      setClickCounts(result);
      toast.success("Click counts updated!");
    } catch (e) {
      console.error("Refresh error:", e);
      toast.error("Failed to refresh clicks");
    } finally {
      setRefreshing(false);
      const resetLoading: Record<string, boolean> = {};
      links.forEach(link => { resetLoading[link.id] = false; });
      setLoadingClicks(resetLoading);
    }
  }, [links]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const checkAliasExists = async (alias: string): Promise<boolean> => {
    const { data } = await supabase
      .from("links")
      .select("id")
      .eq("short_code", alias)
      .single();
    return !!data;
  };

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    if (!user) {
      toast.error("Please log in to save links to your dashboard");
      return;
    }
    
    setCreating(true);
    try {
      new URL(url);
      
      const shortCode = customAlias.trim() || generateRandomCode();
      
      if (customAlias.trim()) {
        const exists = await checkAliasExists(shortCode);
        if (exists) {
          const suggestion = `${shortCode}-${generateRandomCode().substring(0, 3)}`;
          setSuggestedAlias(suggestion);
          toast.error(
            `Alias "${shortCode}" is already taken. Try "${suggestion}" instead.`,
            { duration: 5000 }
          );
          setCreating(false);
          return;
        }
      }
      
      const result = await createShortLink(url, shortCode);
      
      const { error } = await supabase.from("links").insert({
        user_id: user.id,
        original_url: url,
        short_code: shortCode,
        custom_alias: customAlias.trim() || null,
        short_url: result.shortUrl,
        is_active: true,
        clicks: 0,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`✅ Link created: ${result.shortUrl}`);
        setUrl("");
        setCustomAlias("");
        setSuggestedAlias("");
        setShowCreate(false);
        fetchLinks();
      }
    } catch (err: any) {
      if (err.message?.includes("Invalid URL")) {
        toast.error("Please enter a valid URL (https://...)");
      } else if (err.message?.includes("already exists")) {
        const suggestion = `${customAlias || generateRandomCode()}-${generateRandomCode().substring(0, 3)}`;
        setSuggestedAlias(suggestion);
        toast.error(
          `This alias is already taken. Try "${suggestion}" instead.`,
          { duration: 5000 }
        );
      } else {
        toast.error(err.message || "Failed to create link");
      }
    }
    setCreating(false);
  };

  const downloadQR = async (link: LinkData) => {
    try {
      const dataUrl = await QRCode.toDataURL(link.original_url, { width: 512, margin: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-${link.short_code}.png`;
      a.click();
      toast.success("QR code downloaded");
    } catch {
      toast.error("Failed to generate QR");
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Link deleted");
    }
  };

  const copyLink = (link: LinkData) => {
    const shortUrl = link.short_url || getShortUrl(link.short_code);
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const handleUseSuggested = () => {
    if (suggestedAlias) {
      setCustomAlias(suggestedAlias);
      setSuggestedAlias("");
    }
  };

  if (!user) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Please Log In</h3>
        <p className="text-sm text-muted-foreground mb-4">Sign in to view and manage your shortened links.</p>
        <Link to="/sign-in">
          <Button variant="hero">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Links</h1>
          <p className="text-sm text-muted-foreground">{links.length} links created</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshClicks} 
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Updating..." : "Refresh Clicks"}
          </Button>
          <Button variant="hero" size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4" /> New Link
          </Button>
        </div>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <form onSubmit={createLink} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">URL to shorten</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                required
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Custom Alias (optional)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono">s.linkforge.website/</span>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => {
                    setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""));
                    setSuggestedAlias("");
                  }}
                  placeholder="my-custom-link"
                  className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary/50"
                />
              </div>
              {suggestedAlias && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Try:</span>
                  <button
                    type="button"
                    onClick={handleUseSuggested}
                    className="text-primary hover:underline font-mono"
                  >
                    {suggestedAlias}
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="hero" disabled={creating}>
                {creating ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : "Create Link"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No links yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first shortened link to get started.</p>
          <Button variant="hero" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create Link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <a
                      href={link.short_url || getShortUrl(link.short_code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary font-medium hover:underline truncate"
                    >
                      {(link.short_url || getShortUrl(link.short_code)).replace(/^https?:\/\//, "")}
                    </a>
                    <button onClick={() => copyLink(link)} className="text-muted-foreground hover:text-foreground">
                      {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{link.original_url}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <MousePointerClick className="w-3 h-3" />
                      {loadingClicks[link.id] ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        clickCounts[link.id] ?? 0
                      )} clicks
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowQR(showQR === link.id ? null : link.id)}
                    className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {showQR === link.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-3">
                  <div className="rounded-xl p-3 bg-white">
                    <QRCodeSVG value={link.original_url} size={160} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadQR(link)}>
                    <Download className="w-4 h-4" /> Download PNG
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}