import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is LinkForge free to use?",
    a: "Yes! Our Free plan lets you shorten up to 50 links per month with basic analytics. Upgrade to Pro or Business for unlimited links, custom QR codes, and advanced features.",
  },
  {
    q: "How does URL shortening work?",
    a: "Paste any long URL and we generate a compact, shareable link. Each shortened link redirects to the original destination in under 200ms via our global CDN.",
  },
  {
    q: "Can I customize my QR codes?",
    a: "Absolutely. Pro and Business plans include our QR Studio with custom colors, shapes, logo embedding, and export in PNG, SVG, or PDF formats.",
  },
  {
    q: "What analytics do you track?",
    a: "We track clicks over time, geographic locations, device types, browsers, operating systems, and referrer sources — all displayed in real-time dashboards.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. We use encryption at rest and in transit, GDPR-compliant data handling, and never sell your data. Enterprise users also get role-based access controls.",
  },
  {
    q: "Do shortened links expire?",
    a: "By default, links never expire. However, you can set custom expiration dates on any link from the dashboard, perfect for time-limited campaigns.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 relative" id="faq">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
      <div className="container relative z-10 mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-4">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card rounded-xl px-5 border-none"
              >
                <AccordionTrigger className="text-foreground text-left hover:no-underline font-heading font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
