import { Link } from "react-router-dom";
import { Github, Linkedin, Link2, Mail } from "lucide-react";

export const SUPPORT_EMAIL = "link.forge.company@gmail.com";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    
    { label: "FAQ", href: "#faq" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
  ],
  Contact: [
    { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  ],
};

const socials = [
  { icon: Github, href: "https://github.com/Marwa-Sayed12", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/marwa-sayed-2b34b624a", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Link2 className="w-6 h-6 text-accent" />
              <span className="font-heading font-bold text-lg">
                <span className="text-foreground">Link</span>
                <span className="gradient-accent-text">Forge</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Transform long URLs into powerful short links and stunning QR codes. Track every click with real-time analytics.
            </p>
            <div className="flex gap-3 mt-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg border border-border bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading font-semibold text-foreground mb-4 text-sm">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => {
                  const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LinkForge. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Shorten. Generate. Analyze.
          </p>
        </div>
      </div>
    </footer>
  );
}
