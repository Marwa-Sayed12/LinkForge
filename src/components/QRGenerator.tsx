import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Download, Palette, Square, Circle, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

const STYLE_OPTIONS = [
  { id: "squares", label: "Squares", icon: Square },
  { id: "dots", label: "Dots", icon: Circle },
];

const COLOR_PRESETS = [
  { fg: "#38bdb0", bg: "#0d1526", label: "Teal" },
  { fg: "#0ea5e9", bg: "#0d1526", label: "Blue" },
  { fg: "#f5a623", bg: "#0d1526", label: "Amber" },
  { fg: "#a855f7", bg: "#0d1526", label: "Purple" },
  { fg: "#22c55e", bg: "#0d1526", label: "Green" },
  { fg: "#ef4444", bg: "#0d1526", label: "Red" },
  { fg: "#ffffff", bg: "#000000", label: "Classic" },
  { fg: "#000000", bg: "#ffffff", label: "Inverted" },
];

export function QRGenerator({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [url, setUrl] = useState("https://lovable.dev");
  const [fgColor, setFgColor] = useState("#38bdb0");
  const [bgColor, setBgColor] = useState("#0d1526");
  const [size, setSize] = useState(186);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [includeImage, setIncludeImage] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "qrcode.svg";
    a.click();
  };

  const handleDownloadPNG = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(url || " ", {
        width: size * 2,
        margin: 1,
        errorCorrectionLevel: level,
        color: { dark: fgColor, light: bgColor },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "qrcode.png";
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="py-24" id="qr-generator">
      <div className="container mx-auto px-4">
        {!hideHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-4">
              QR Code <span className="gradient-accent-text">Studio</span>
            </h2>
            <p className="text-muted-foreground text-lg">Craft beautiful QR codes that match your brand.</p>
          </motion.div>
        )}

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 space-y-6"
          >
            {/* URL Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Content / URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Color Presets */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Color Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setFgColor(preset.fg); setBgColor(preset.bg); }}
                    className={`rounded-lg border p-2 text-center text-[11px] sm:text-xs transition-all min-w-0 ${
                      fgColor === preset.fg && bgColor === preset.bg
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex gap-1 justify-center mb-1">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm" style={{ backgroundColor: preset.fg }} />
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border border-border" style={{ backgroundColor: preset.bg }} />
                    </div>
                    <span className="text-muted-foreground block truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Correction */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Error Correction</label>
              <div className="flex gap-2">
                {(["L", "M", "Q", "H"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-mono transition-all ${
                      level === l
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Size slider */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex justify-between">
                Size <span className="text-muted-foreground font-mono">{size}px</span>
              </label>
              <input
                type="range"
                min={120}
                max={400}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center"
          >
            <div ref={svgRef} className="rounded-xl p-4" style={{ backgroundColor: bgColor }}>
              <QRCodeSVG
                value={url || " "}
                size={size}
                bgColor={bgColor}
                fgColor={fgColor}
                level={level}
                includeMargin={false}
              />
            </div>
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <Button variant="hero" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                SVG
              </Button>
              <Button variant="hero-outline" onClick={handleDownloadPNG}>
                <Download className="w-4 h-4" />
                PNG
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
