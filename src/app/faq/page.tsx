import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'FAQ | Virel London Escorts',
  description: 'Frequently asked questions about booking a companion with Virel. Rates, discretion, incall, outcall and more.',
  alternates: { canonical: '/faq' },
}

const FAQS = [
  {
    q: 'How do I book a companion?',
    a: 'Browse our companions on the London Escorts page, select your preferred model, choose your date and duration, and submit a booking request. We confirm within 30 minutes.',
  },
  {
    q: 'Are all companions verified?',
    a: 'Yes. Every companion on Virel is personally verified. Photos are authentic and up to date. We do not publish unverified profiles.',
  },
  {
    q: 'What is the difference between incall and outcall?',
    a: 'Incall means you visit the companion at her private location. Outcall means she comes to you — your hotel, apartment, or residence. Outcall rates include a travel surcharge.',
  },
  {
    q: 'How discreet is the service?',
    a: 'Completely. We never share client information with any third party. Communications are confidential. Billing appears as a neutral descriptor.',
  },
  {
    q: 'What are the payment options?',
    a: 'Payment is made directly to the companion in cash at the time of the appointment. No online payment is required to make a booking.',
  },
  {
    q: 'Can I book for the same day?',
    a: 'Yes. Same-day bookings are available subject to companion availability. We recommend booking at least 2–3 hours in advance.',
  },
  {
    q: 'What areas of London do you cover?',
    a: 'We cover all London districts including Mayfair, Kensington, Knightsbridge, Chelsea, Belgravia, Canary Wharf, and all major areas. Airport visits to Heathrow, Gatwick, and Stansted are also available.',
  },
  {
    q: 'Can I request a specific companion?',
    a: 'Yes. Simply find the companion you like and submit a booking request directly from her profile page.',
  },
  {
    q: 'What if I need to cancel?',
    a: 'Please notify us as early as possible. We understand plans change. Repeated last-minute cancellations may affect future booking availability.',
  },
  {
    q: 'Are overnight bookings available?',
    a: 'Yes. Overnight bookings (typically 9 hours) are available with select companions. Rates vary by companion.',
  },
]

export default function FAQPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span>FAQ</span>
        </nav>

        <h1 className="font-serif text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-10">Everything you need to know about booking with Virel.</p>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="group border border-border rounded-xl overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer font-medium flex justify-between items-center list-none hover:bg-muted/50 transition-colors">
                {faq.q}
                <span className="text-muted-foreground text-lg group-open:rotate-180 transition-transform duration-200">›</span>
              </summary>
              <div className="px-6 pb-5 text-muted-foreground leading-relaxed border-t border-border pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-xl text-center">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Link href="/contact" className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm">
            Contact Us
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
