import { motion } from "framer-motion";
import { Link2, Settings2, Share2 } from "lucide-react";

const steps = [
  {
    icon: Link2,
    step: "01",
    title: "Paste Your URL",
    description: "Drop any long URL into the shortener. We'll handle the rest — no signup required for basic shortening.",
  },
  {
    icon: Settings2,
    step: "02",
    title: "Customize & Generate",
    description: "Add custom aliases, set expiry dates, and generate branded QR codes with your colors and logo.",
  },
  {
    icon: Share2,
    step: "03",
    title: "Share & Track",
    description: "Share your links anywhere. Watch real-time analytics roll in — clicks, locations, devices, and more.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative" id="how-it-works">
      <div className="container relative z-10 mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-4">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to powerful link management.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 relative">
                <step.icon className="w-7 h-7 text-primary" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center font-mono">
                  {step.step}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
