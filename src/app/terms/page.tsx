import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Terms of Service | Virel',
  description: 'Terms of service for using Virel companion services in London.',
  alternates: { canonical: '/terms' },
  robots: { index: false },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span>Terms of Service</span>
        </nav>

        <h1 className="font-serif text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: January 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Age Restriction</h2>
            <p>You must be 18 years of age or older to use this website. By accessing Virel, you confirm that you are an adult and that accessing adult content is legal in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Nature of Service</h2>
            <p>Virel is a companion introduction service. All companions listed are independent adults who offer their time and social companionship. This website facilitates introductions only. Any arrangement made between clients and companions is a private matter between consenting adults.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Acceptable Use</h2>
            <p>You agree not to use this website for any unlawful purpose. You agree not to harass, abuse, or threaten any companion. Repeated no-shows or last-minute cancellations may result in being blocked from the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Accuracy of Information</h2>
            <p>We make every effort to ensure profiles are accurate and photos are authentic. However, we cannot guarantee availability at any given time. Rates are set by the companions themselves and are subject to change.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
            <p>Virel acts solely as an introduction platform. We are not responsible for the conduct of companions or clients during or after any arranged meeting. Use of this service is entirely at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of any revised terms.</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
