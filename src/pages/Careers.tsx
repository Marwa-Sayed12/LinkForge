import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Zap, Heart, Globe, GraduationCap, Briefcase } from "lucide-react";

const perks = [
  { icon: Globe, title: "Fully Remote", description: "Work from anywhere in the world. We're a distributed team across 12+ countries." },
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision insurance plus a wellness stipend." },
  { icon: GraduationCap, title: "Learning Budget", description: "$2,000/year for courses, conferences, books, and professional development." },
  { icon: Zap, title: "Latest Equipment", description: "Top-spec laptop, monitor, and home office setup—whatever you need to do your best work." },
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 text-center mb-20">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">Careers</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-5">Build the Future of Links</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Join a passionate, remote-first team building the tools that power millions of shortened links, QR codes, and analytics dashboards every day.
          </p>
        </section>

        {/* Perks */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 mb-20">
          <h2 className="font-heading text-2xl font-bold text-center mb-10">Why LinkForge?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk) => (
              <div key={perk.title} className="rounded-xl border border-border bg-card p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <perk.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1.5">{perk.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{perk.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* No openings */}
        <section className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-2xl text-center">
          <div className="rounded-2xl border border-border bg-card p-10">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-3">No Open Positions Right Now</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              We don't have any openings at the moment, but we're always interested in hearing from talented people. Send us your resume and we'll reach out when something fits.
            </p>
            <a href="mailto:careers@linkforge.io">
              <Button variant="hero" size="lg">Send Open Application</Button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
