import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useClerkAuth"
const navLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg mt-2">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Link2 className="w-6 h-6 text-accent" />
          <span className="font-heading font-bold text-lg">
            <span className="text-foreground">Link</span>
            <span className="gradient-accent-text">Forge</span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href + l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard">
              <Button variant="hero" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button className="text-accent hover:text-accent/80 transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-6 py-5 space-y-3">
              {navLinks.map((l) => (
                <a
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
              <div className="border-t border-border/50 pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Company</p>
                <Link to="/careers" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">Careers</Link>
              </div>
              <div className="border-t border-border/50 pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Legal</p>
                <Link to="/privacy" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                <Link to="/terms" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                <Link to="/cookies" onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">Cookies</Link>
              </div>
              <div className="pt-2">
                {user ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="hero" size="sm" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button variant="hero" size="sm" className="w-full">Get Started</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
