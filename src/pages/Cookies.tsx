import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-20 max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-8">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 15, 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you interact with the site. LinkForge uses cookies and similar technologies to provide and improve our Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. Types of Cookies We Use</h2>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground mb-1">Essential Cookies</h3>
                <p className="text-sm">Required for the Service to function. These handle authentication, session management, and security. They cannot be disabled.</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground mb-1">Functional Cookies</h3>
                <p className="text-sm">Remember your preferences such as theme selection (light/dark mode), language, and display settings to provide a personalized experience.</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground mb-1">Analytics Cookies</h3>
                <p className="text-sm">Help us understand how visitors interact with LinkForge by collecting anonymous usage data. This includes pages visited, time spent, and feature usage.</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground mb-1">Performance Cookies</h3>
                <p className="text-sm">Monitor the performance and reliability of our Service, helping us identify and fix issues quickly.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. Third-Party Cookies</h2>
            <p>Some cookies are placed by third-party services we use:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-foreground">Authentication Provider:</strong> Manages secure login sessions.</li>
              <li><strong className="text-foreground">Analytics Services:</strong> Collects anonymous usage statistics.</li>
              <li><strong className="text-foreground">Payment Processor:</strong> Handles billing for paid plans securely.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. Managing Cookies</h2>
            <p>You can control cookies through your browser settings. Most browsers allow you to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>View and delete existing cookies.</li>
              <li>Block all or specific cookies.</li>
              <li>Set preferences for certain websites.</li>
              <li>Receive notifications when cookies are set.</li>
            </ul>
            <p className="mt-2">Please note that disabling essential cookies may prevent you from using certain features of LinkForge.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. Cookie Retention</h2>
            <p>Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. Our persistent cookies typically expire within 12 months.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. Updates to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
            <p>If you have questions about our use of cookies, please contact us at <a href="mailto:privacy@linkforge.io" className="text-primary hover:underline">privacy@linkforge.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
