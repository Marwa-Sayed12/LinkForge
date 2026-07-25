import { useState, useRef, ChangeEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Download, Palette, Square, Circle, Image, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [url, setUrl] = useState("https://linkforge.website");
  const [fgColor, setFgColor] = useState("#38bdb0");
  const [bgColor, setBgColor] = useState("#0d1526");
  const [size, setSize] = useState(186);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [includeImage, setIncludeImage] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setIncludeImage(true);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
    setIncludeImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const syntheticEvent = { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
      handleFileUpload(syntheticEvent);
    }
  };

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
      
      // If logo is included, combine them
      if (logoUrl && includeImage) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Draw logo on top
        const logoImg = new Image();
        logoImg.src = logoUrl;
        await logoImg.decode();
        
        const logoSizePx = (logoSize / 100) * img.width;
        const x = (img.width - logoSizePx) / 2;
        const y = (img.height - logoSizePx) / 2;
        
        // White background for logo
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + logoSizePx/2, y + logoSizePx/2, logoSizePx/2 + 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Clip logo to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + logoSizePx/2, y + logoSizePx/2, logoSizePx/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSizePx, logoSizePx);
        ctx.restore();
        
        const finalDataUrl = canvas.toDataURL('image/png');
        const a = document.createElement("a");
        a.href = finalDataUrl;
        a.download = "qrcode-with-logo.png";
        a.click();
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "qrcode.png";
        a.click();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PNG");
    }
  };

  const QRCodeWithLogo = () => {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <QRCodeSVG
          value={url || " "}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          includeMargin={false}
          imageSettings={
            includeImage && logoUrl
              ? {
                  src: logoUrl,
                  height: (logoSize / 100) * size,
                  width: (logoSize / 100) * size,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>
    );
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 space-y-6"
          >
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Content / URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary/50 transition-colors"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" /> Logo (Optional)
              </label>
              
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  isDragging ? "border-primary bg-primary/10" : "border-border"
                } ${includeImage ? "bg-secondary/30" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                {includeImage && logoUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground truncate">{logoFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(logoFile?.size || 0) / 1024 < 1024 
                          ? `${Math.round((logoFile?.size || 0) / 1024)} KB` 
                          : `${Math.round((logoFile?.size || 0) / 1024 / 1024)} MB`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={removeLogo} className="text-destructive hover:text-destructive">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop your logo here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG (Max 2MB)</p>
                  </div>
                )}
              </div>
            </div>

            {includeImage && logoUrl && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 flex justify-between">
                  Logo Size <span className="text-muted-foreground font-mono">{logoSize}%</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={60}
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}

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

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center"
          >
            <div ref={svgRef} className="rounded-xl p-4" style={{ backgroundColor: bgColor }}>
              <QRCodeWithLogo />
            </div>
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <Button variant="hero" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                SVG
              </Button>
              <Button variant="hero-outline" onClick={handleDownloadPNG}>
                <Download className="w-4 h-4" />
                {includeImage ? "PNG with Logo" : "PNG"}
              </Button>
              {includeImage && (
                <Button variant="outline" size="sm" onClick={removeLogo}>
                  <X className="w-4 h-4" />
                  Remove Logo
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}