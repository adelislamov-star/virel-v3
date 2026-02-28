import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy | Virel',
  description: 'Privacy policy for Virel. How we handle your data.',
  alternates: { canonical: '/privacy' },
  robots: { index: false },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span>Privacy Policy</span>
        </nav>

        <h1 className="font-serif text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: January 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>When you submit a booking request, we collect your name, phone number, and email address (optional). This information is used solely to process and confirm your booking.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
            <p>Your personal data is used only to facilitate bookings and respond to enquiries. We do not sell, share, or transfer your data to any third party for marketing or commercial purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Retention</h2>
            <p>Booking records are retained for operational purposes. You may request deletion of your data at any time by contacting us directly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Cookies</h2>
            <p>This website uses minimal cookies for essential functionality only. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Security</h2>
            <p>All data is stored securely. We use industry-standard encryption for data in transit. Access to client data is restricted to authorised personnel only.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:bookings@virel.com" className="text-foreground hover:underline">bookings@virel.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
