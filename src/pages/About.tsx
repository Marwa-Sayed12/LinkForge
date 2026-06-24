import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link2, Target, Zap, BarChart3, Globe } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Simplicity First",
    description: "We believe powerful tools don't have to be complicated. Every feature is designed to be intuitive and effortless.",
  },
  {
    icon: Zap,
    title: "Speed Matters",
    description: "From link creation to redirect, every millisecond counts. Our infrastructure is optimized for blazing-fast performance.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven",
    description: "Make smarter decisions with real-time analytics. Understand your audience and optimize your reach.",
  },
  {
    icon: Globe,
    title: "Built for Everyone",
    description: "Whether you're a solo creator or a growing team, LinkForge scales with your needs.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Link2 className="w-8 h-8 text-accent" />
            <span className="font-heading font-bold text-2xl">
              <span className="text-foreground">Link</span>
              <span className="gradient-accent-text">Forge</span>
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-6 max-w-2xl mx-auto leading-tight">
            Making Links <span className="gradient-accent-text">Smarter</span>, One Click at a Time
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            LinkForge is a modern link management platform that helps you shorten URLs, generate QR codes, and track performance — all in one place.
          </p>
        </section>

        {/* Story */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 mb-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                LinkForge was born out of a simple frustration: existing link shorteners were either too basic or too bloated. We wanted something that strikes the perfect balance — powerful enough for professionals, yet simple enough for anyone.
              </p>
              <p>
                Built with modern technologies and a passion for clean design, LinkForge offers a seamless experience from creating your first short link to analyzing thousands of clicks across your campaigns.
              </p>
              <p>
                We're committed to giving creators, marketers, and businesses the tools they need to share content effectively and understand their audience better.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-10 text-center">What We Believe In</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-card p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <v.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="rounded-2xl border border-border bg-card p-10 max-w-xl mx-auto">
            <h2 className="font-heading text-2xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">Join thousands of users who trust LinkForge for their link management.</p>
            <Link to="https://accounts.www.linkforge.website/sign-in">
              <Button variant="hero" size="lg">Get Started Free</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
