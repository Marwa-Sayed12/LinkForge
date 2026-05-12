import { motion } from "framer-motion";
import { Link2, QrCode, BarChart3, Shield, Globe, Zap, Palette, Users } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Smart URL Shortening",
    description: "Custom aliases, expiration dates, password protection, and bulk shortening via CSV.",
  },
  {
    icon: QrCode,
    title: "Advanced QR Generator",
    description: "10+ styles, custom colors, logo embedding, frames, and export in PNG, SVG, or PDF.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track clicks, geolocation, devices, browsers, and referrers with interactive dashboards.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Link validation, malware detection, rate limiting, and GDPR compliance built in.",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Use your own domain for branded short links that build trust and recognition.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-200ms redirects with global CDN, Redis caching, and optimized database queries.",
  },
  {
    icon: Palette,
    title: "Dynamic QR Codes",
    description: "Change destinations without reprinting. A/B test and schedule different URLs.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Workspaces, role-based access, shared link collections, and team analytics.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
      <div className="container relative z-10 mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-4">
            Everything you need to{" "}
            <span className="gradient-text">own your links</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From shortening to analytics, QR codes to team management — all in one powerful platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 group hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
