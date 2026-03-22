// @ts-nocheck
import { Metadata } from 'next'
import Link from 'next/link'

import { siteConfig } from '@/../config/site'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'How It Works — Companion Agency London',
  description: 'Book a companion in London in 3 simple steps. 30-minute response guaranteed. Vaurel companion agency.',
  alternates: { canonical: `${siteConfig.domain}/how-it-works` },
}

const faqItems = [
  {
    q: 'How quickly can I book a companion?',
    a: 'We guarantee a response within 30 minutes, 24 hours a day, 7 days a week. Same-day bookings are available depending on companion availability.',
  },
  {
    q: 'Is my personal information kept confidential?',
    a: 'Absolutely. We never share client information with third parties. All communications are encrypted and we maintain a strict no-records policy.',
  },
  {
    q: 'Can I request a specific companion?',
    a: 'Yes. Browse our gallery, choose the companion you prefer, and mention their name when you contact us. If they are unavailable, we can suggest similar companions.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept cash and bank transfer. Payment details are provided during the booking confirmation. All billing is completely discreet.',
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: 'Yes. We ask for at least 2 hours notice for cancellations or changes. Last-minute cancellations may incur a fee. Contact our team to reschedule.',
  },
]

const graphSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
        { '@type': 'ListItem', position: 2, name: 'How It Works', item: `${siteConfig.domain}/how-it-works` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
}

export default function HowItWorksPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }} />

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: 8 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li aria-current="page" style={{ color: '#C5A572' }}>How It Works</li>
          </ol>
        </nav>

        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24 }}>Booking Guide</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.05, margin: '0 0 16px' }}>
          How It <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Works</em>
        </h1>
        <p style={{ fontSize: 20, color: '#6b6560', marginBottom: 64, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          Three simple steps to an unforgettable experience
        </p>

        {/* Step 1 */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 11, letterSpacing: '.2em', color: '#C5A572', textTransform: 'uppercase' }}>Step 01</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '12px 0 16px' }}>
            Browse &amp; Choose
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Explore our curated gallery of verified companions. Each profile includes professional photos,
            a personal description, rates, and availability. Use our filters to find companions by location,
            appearance, or services offered. Not sure where to start? Try our{' '}
            <Link href="/find-your-match" style={{ color: '#C5A572', textDecoration: 'none' }}>Smart Match quiz</Link>{' '}
            — answer 5 questions and we&apos;ll suggest your ideal companion.
          </p>
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 11, letterSpacing: '.2em', color: '#C5A572', textTransform: 'uppercase' }}>Step 02</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '12px 0 16px' }}>
            Get in Touch
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Contact us via <a href={siteConfig.telegram} style={{ color: '#C5A572', textDecoration: 'none' }}>Telegram</a>,{' '}
            <a href={`mailto:${siteConfig.email}`} style={{ color: '#C5A572', textDecoration: 'none' }}>email</a>, or
            our booking form. Share your preferred date, time, location, and any special requests.
            Our concierge team responds within 30 minutes, around the clock, to confirm availability
            and arrange every detail.
          </p>
        </div>

        {/* Step 3 */}
        <div style={{ marginBottom: 64 }}>
          <span style={{ fontSize: 11, letterSpacing: '.2em', color: '#C5A572', textTransform: 'uppercase' }}>Step 03</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '12px 0 16px' }}>
            Confirm Your Booking
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Once confirmed, you&apos;ll receive a discreet booking confirmation with all the details.
            Payment is made directly — we accept cash and bank transfer. Your companion will arrive
            at the agreed time and location, ready to provide an exceptional experience. Discretion
            is guaranteed at every step.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 64 }} />

        {/* FAQ */}
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 64 }}>
          {faqItems.map(f => (
            <div key={f.q}>
              <p style={{ fontSize: 15, color: '#f0e8dc', fontWeight: 400, margin: '0 0 8px' }}>{f.q}</p>
              <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.8, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/companions"
            style={{ display: 'inline-block', padding: '16px 40px', background: '#C5A572', color: '#0A0A0A', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background .25s', fontFamily: 'inherit' }}
          >
            Browse Companions
          </Link>
        </div>
      </section>

    </main>
  )
}
