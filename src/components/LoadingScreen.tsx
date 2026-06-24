import { motion } from "framer-motion";
import { useMemo } from "react";

const GRID_SIZE = 9;

// Deterministic QR-like pattern (1 = filled)
const QR_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1],
];

export function LoadingScreen() {
  const cells = useMemo(() => {
    const arr: { row: number; col: number; filled: boolean; delay: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        arr.push({
          row: r,
          col: c,
          filled: QR_PATTERN[r][c] === 1,
          delay: Math.random() * 0.8,
        });
      }
    }
    return arr;
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background glow orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-30"
        style={{ background: "hsl(20 100% 60%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-[120px] opacity-30"
        style={{ background: "hsl(15 100% 50%)" }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Grid backdrop lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--accent)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col items-center gap-10 px-6">
        {/* QR Code Assembly */}
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-6 rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, hsl(20 100% 60% / 0.4), hsl(15 100% 50% / 0.4))",
              filter: "blur(24px)",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glassmorphism container */}
          <div
            className="relative p-5 rounded-2xl backdrop-blur-xl border"
            style={{
              background: "hsl(var(--background) / 0.4)",
              borderColor: "hsl(var(--accent) / 0.3)",
              boxShadow:
                "0 0 40px hsl(20 100% 60% / 0.2), inset 0 0 20px hsl(20 100% 60% / 0.05)",
            }}
          >
            {/* QR grid */}
            <div
              className="relative grid gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 198,
                height: 198,
              }}
            >
              {cells.map((cell, i) => (
                <motion.div
                  key={i}
                  className="rounded-[2px]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    cell.filled
                      ? {
                          scale: [0, 1, 1, 0],
                          opacity: [0, 1, 1, 0],
                        }
                      : { scale: 0, opacity: 0 }
                  }
                  transition={{
                    duration: 3.5,
                    times: [0, 0.25, 0.85, 1],
                    repeat: Infinity,
                    delay: cell.delay,
                    ease: "easeInOut",
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(20 100% 65%), hsl(15 100% 50%))",
                    boxShadow: "0 0 6px hsl(20 100% 60% / 0.6)",
                  }}
                />
              ))}

              {/* Scanner line */}
              <motion.div
                className="absolute left-0 right-0 h-[2px] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, hsl(20 100% 70%), transparent)",
                  boxShadow:
                    "0 0 12px hsl(20 100% 60%), 0 0 24px hsl(20 100% 60% / 0.6)",
                }}
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Corner brackets */}
              {[
                { top: -4, left: -4, rotate: 0 },
                { top: -4, right: -4, rotate: 90 },
                { bottom: -4, right: -4, rotate: 180 },
                { bottom: -4, left: -4, rotate: 270 },
              ].map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 pointer-events-none"
                  style={{
                    ...pos,
                    transform: `rotate(${pos.rotate}deg)`,
                    borderTop: "2px solid hsl(20 100% 60%)",
                    borderLeft: "2px solid hsl(20 100% 60%)",
                  }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pulse rings */}
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl border pointer-events-none"
              style={{ borderColor: "hsl(20 100% 60%)" }}
              animate={{
                scale: [1, 1.4],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Link transformation */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <div className="relative w-full h-7 overflow-hidden font-mono text-xs">
            {/* Long URL shrinking */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-muted-foreground"
              animate={{
                opacity: [1, 1, 0, 0],
                scaleX: [1, 1, 0.2, 0.2],
                filter: ["blur(0px)", "blur(0px)", "blur(4px)", "blur(4px)"],
              }}
              transition={{
                duration: 3.5,
                times: [0, 0.4, 0.55, 1],
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              https://example.com/very/long/url/path?id=12345&ref=loading
            </motion.div>

            {/* Short URL appearing */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-semibold"
              style={{
                background:
                  "linear-gradient(90deg, hsl(20 100% 65%), hsl(15 100% 55%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              animate={{
                opacity: [0, 0, 1, 1, 0],
                scale: [0.8, 0.8, 1, 1, 0.8],
              }}
              transition={{
                duration: 3.5,
                times: [0, 0.55, 0.7, 0.95, 1],
                repeat: Infinity,
                ease: "easeOut",
              }}
            >
              lnkfg.io/x9k2
            </motion.div>
          </div>

          {/* Data flow line */}
          <div className="relative w-full h-[2px] rounded-full overflow-hidden bg-muted/30">
            <motion.div
              className="absolute top-0 bottom-0 w-1/3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(20 100% 60%), transparent)",
                boxShadow: "0 0 10px hsl(20 100% 60%)",
              }}
              animate={{ left: ["-33%", "100%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>

        {/* Brand + status */}
        <div className="flex flex-col items-center gap-3">
          <span className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Link<span className="gradient-accent-text">Forge</span>
          </span>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(20 100% 60%)" }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              Encoding data stream
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
