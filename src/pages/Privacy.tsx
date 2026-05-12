import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-20 max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 15, 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p>When you use LinkForge, we may collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Email address, display name, and password when you create an account.</li>
              <li><strong className="text-foreground">Link Data:</strong> URLs you shorten, custom aliases, and associated metadata.</li>
              <li><strong className="text-foreground">Analytics Data:</strong> Click counts, geographic location (country/city), browser type, device type, operating system, and referrer information for shortened links.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, and interactions with our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our URL shortening and QR code services.</li>
              <li>Generate analytics and reports about link performance.</li>
              <li>Send you service-related notifications and updates.</li>
              <li>Detect and prevent fraud, abuse, and security threats.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-foreground">Service Providers:</strong> Third-party services that help us operate our platform (hosting, analytics, email).</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, subpoena, or legal process.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL), secure password hashing, and regular security audits. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Link analytics data is retained for the duration specified by your plan. You may request deletion of your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access, correct, or delete your personal data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Export your data in a portable format.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@linkforge.io" className="text-primary hover:underline">privacy@linkforge.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
