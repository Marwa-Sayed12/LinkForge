import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Link2, QrCode, BarChart3, Copy, Check, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NetworkVisualization } from "./NetworkVisualization";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { shortenWithTinyUrl } from "@/lib/shorten";
import { toast } from "sonner";

export function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [shortened, setShortened] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShorten = async () => {
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL (https://...)");
      return;
    }
    setLoading(true);
    try {
      const tinyUrl = await shortenWithTinyUrl(url);
      const shortCode = tinyUrl.split("/").filter(Boolean).pop() || Math.random().toString(36).substring(2, 8);

      if (user) {
        await supabase.from("links").insert({
          user_id: user.id,
          original_url: url,
          short_code: shortCode,
          tiny_url: tinyUrl,
        });
      }

      setShortened(tinyUrl);
      if (!user) setShowSignupPrompt(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortened);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <NetworkVisualization />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-3 sm:px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto w-full min-w-0">
          {/* Left: Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >

            <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] mb-6">
              Shorten.{" "}
              <span className="gradient-text">Generate.</span>{" "}
              <span className="gradient-accent-text">Analyze.</span>
            </h1>

            <p className="text-muted-foreground text-lg lg:text-xl max-w-lg mb-8 leading-relaxed">
              Transform long URLs into powerful short links and stunning QR codes. Track every click with real-time analytics.
            </p>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="hero" size="lg" className="group">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="hero" size="lg" className="group">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
              <a href="#features">
                <Button variant="hero-outline" size="lg">
                  View Features
                </Button>
              </a>
            </div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-8 mt-12"
            >
              {[
                { label: "Links Created", value: "12K+" },
                { label: "QR Scans", value: "4.2K" },
                { label: "Uptime", value: "99.9%" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-heading text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Interactive Playground */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full min-w-0"
          >
            {/* Outer glow wrapper */}
            <div className="relative w-full min-w-0">
              {/* Animated gradient halo */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-info/40 opacity-70 blur-md pointer-events-none" />
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/60 via-accent/40 to-info/60 pointer-events-none" />

              <div className="relative rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 w-full min-w-0 overflow-hidden
                              bg-gradient-to-br from-card/95 via-card/90 to-secondary/80
                              dark:from-[hsl(222_40%_10%)]/95 dark:via-[hsl(222_40%_8%)]/90 dark:to-[hsl(222_40%_6%)]/95
                              backdrop-blur-2xl border border-border/60 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.35)]">
                {/* Decorative corner accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70 shadow-[0_0_8px_hsl(var(--destructive)/0.6)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/70 shadow-[0_0_8px_hsl(var(--warning)/0.6)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/70 shadow-[0_0_8px_hsl(var(--success)/0.6)]" />
                  <span className="ml-2 text-[11px] sm:text-xs font-mono text-muted-foreground tracking-wider uppercase">try it now</span>
                </div>

                {/* URL Input + Button - stacks on mobile */}
                <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-2 w-full min-w-0">
                  <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl border-2 border-border/70 bg-background/60 dark:bg-background/40 px-3 py-3 sm:py-2.5 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] transition-all">
                    <Link2 className="w-4 h-4 text-primary shrink-0" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste your long URL..."
                      className="bg-transparent text-foreground placeholder:text-muted-foreground/70 text-sm w-full min-w-0 outline-none font-mono"
                      onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    />
                  </div>
                  <Button
                    variant="hero"
                    onClick={handleShorten}
                    className="w-full sm:w-auto shrink-0 h-11 sm:h-10"
                    disabled={loading}
                  >
                    {loading ? "Shortening…" : "Shorten"}
                  </Button>
                </div>

                {/* Result */}
                {shortened && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-3 sm:px-4 py-3 w-full min-w-0 overflow-hidden"
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5 font-medium">Your shortened link</div>
                      <div className="font-mono text-primary font-semibold text-sm sm:text-base truncate">{shortened}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0 h-9 w-9 hover:bg-primary/10">
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                )}

                {/* Signup prompt for non-auth users */}
                {showSignupPrompt && !user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 px-3 sm:px-4 py-3 w-full min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-3.5 h-3.5 text-accent" />
                      <span className="text-sm font-semibold text-foreground">Want more?</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Sign up to save links, view analytics & generate custom QR codes.
                    </p>
                    <Link to="/auth">
                      <Button variant="hero" size="sm">
                        Sign Up Free <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </motion.div>
                )}

                {/* Feature pills */}
                <div className="relative flex flex-wrap gap-2 pt-1">
                  {[
                    { icon: Link2, label: "Custom Aliases" },
                    { icon: QrCode, label: "QR Codes", locked: !user },
                    { icon: BarChart3, label: "Analytics", locked: !user },
                  ].map((f) => (
                    <div
                      key={f.label}
                      onClick={() => f.locked && navigate("/auth")}
                      className={`flex items-center gap-1.5 rounded-full border border-border/70 bg-background/40 dark:bg-background/30 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground transition-all ${
                        f.locked ? "cursor-pointer hover:border-primary/50 hover:text-foreground hover:bg-primary/5" : ""
                      }`}
                    >
                      <f.icon className="w-3 h-3" />
                      {f.label}
                      {f.locked && <Lock className="w-2.5 h-2.5 ml-0.5" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
