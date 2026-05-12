import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-20 max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 15, 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using LinkForge ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. We reserve the right to update these terms at any time, and continued use constitutes acceptance of changes.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>LinkForge provides URL shortening, QR code generation, and link analytics services. Features may vary by subscription plan. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
            <p>To use certain features, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide accurate and complete registration information.</li>
              <li>Maintain the security of your account credentials.</li>
              <li>Notify us immediately of any unauthorized access.</li>
              <li>Accept responsibility for all activity under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. Acceptable Use</h2>
            <p>You agree not to use LinkForge to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Shorten URLs that link to malware, phishing sites, or illegal content.</li>
              <li>Distribute spam or unsolicited communications.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe on intellectual property rights of others.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
            </ul>
            <p className="mt-2">We reserve the right to disable any link or account that violates these terms without prior notice.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. Intellectual Property</h2>
            <p>The Service, including its design, logos, and content, is owned by LinkForge and protected by intellectual property laws. You retain ownership of the URLs and content you create through the Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. Subscription & Billing</h2>
            <p>Paid plans are billed on a recurring basis (monthly or annually). You may cancel at any time; access continues until the end of the billing period. Refunds are not provided for partial billing periods. We reserve the right to change pricing with 30 days' notice.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>LinkForge is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">8. Termination</h2>
            <p>We may terminate or suspend your account at any time for violation of these terms. Upon termination, your right to use the Service ceases immediately. Data associated with terminated accounts may be deleted after 30 days.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Delaware, United States. Any disputes shall be resolved in the courts located in Delaware.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">10. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:legal@linkforge.io" className="text-primary hover:underline">legal@linkforge.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
