import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [ripple, setRipple] = useState(false);

  const cycle = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
    setRipple(true);
    setTimeout(() => setRipple(false), 400);
  };

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={cycle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycle(); } }}
      role="switch"
      aria-checked={isDark}
      aria-label={`Current theme: ${theme}. Click to switch.`}
      className="relative w-14 h-8 md:w-14 md:h-8 rounded-full border border-border bg-secondary/60 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden touch-manipulation"
      style={{ minHeight: 32, minWidth: 56 }}
    >
      <AnimatePresence>
        {ripple && (
          <motion.span
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-primary/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <span className="absolute left-1.5 top-1/2 -translate-y-1/2">
        <Sun className={`w-3.5 h-3.5 transition-all duration-300 ${!isDark ? "text-amber-500 opacity-100" : "text-muted-foreground opacity-40"}`} />
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
        <Moon className={`w-3.5 h-3.5 transition-all duration-300 ${isDark ? "text-blue-400 opacity-100" : "text-muted-foreground opacity-40"}`} />
      </span>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
        className={`absolute top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
          isDark
            ? "bg-slate-800 shadow-blue-500/20"
            : "bg-white shadow-amber-500/20"
        }`}
        style={{ left: isDark ? "calc(100% - 28px)" : "4px" }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-3 h-3 text-blue-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-3 h-3 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isDark && (
        <div className="absolute inset-0 rounded-full shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)] pointer-events-none" />
      )}
    </button>
  );
}
