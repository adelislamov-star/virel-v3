// @ts-nocheck
import { Metadata } from 'next'
import Link from 'next/link'

import { siteConfig } from '@/../config/site'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Discretion & Privacy',
  description: 'Your privacy is our priority. Learn how Vaurel protects client confidentiality.',
  alternates: { canonical: `${siteConfig.domain}/discretion` },
}

const faqItems = [
  {
    q: 'Will anything appear on my bank statement?',
    a: 'We primarily accept cash, which leaves no digital trail. For bank transfers, the reference is completely neutral and cannot be linked to companion services.',
  },
  {
    q: 'Do you store my personal data?',
    a: 'We retain only the minimum information needed to process your booking. We do not keep records of completed appointments, and all data is encrypted at rest.',
  },
  {
    q: 'Can I use a pseudonym?',
    a: 'Yes. Many clients use a preferred name for bookings. We respect your choice and do not require identification beyond what is necessary for safety.',
  },
  {
    q: 'How do you train your companions on privacy?',
    a: 'Every companion signs a strict confidentiality agreement. They are trained never to discuss clients, share details, or acknowledge meetings outside the booking.',
  },
]

const graphSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
        { '@type': 'ListItem', position: 2, name: 'Discretion & Privacy', item: `${siteConfig.domain}/discretion` },
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

export default function DiscretionPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }} />

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: 8 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li aria-current="page" style={{ color: '#C5A572' }}>Discretion &amp; Privacy</li>
          </ol>
        </nav>

        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24 }}>Your Privacy</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.05, margin: '0 0 16px' }}>
          Complete <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Discretion</em>, Guaranteed
        </h1>
        <p style={{ fontSize: 20, color: '#6b6560', marginBottom: 64, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          Your confidence is the foundation of everything we do
        </p>

        {/* How We Protect Your Privacy */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            How We Protect Your Privacy
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Privacy is not an afterthought at Vaurel — it is built into every layer of our service.
            From the moment you browse our website to long after your appointment, we ensure
            that your identity, preferences, and activity remain completely confidential.
            We do not use tracking cookies for advertising, we do not sell data, and we do not
            share information with any third parties under any circumstances.
          </p>
        </div>

        {/* Secure Communication */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Secure Communication
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            All client communications are handled through encrypted channels. We recommend{' '}
            <a href={siteConfig.telegram} style={{ color: '#C5A572', textDecoration: 'none' }}>Telegram</a>{' '}
            for end-to-end encrypted messaging. Our team never calls or texts your personal phone
            without prior arrangement. No identifiable information appears in any message — we use
            neutral language and discreet references throughout.
          </p>
        </div>

        {/* No Records Policy */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            No Records Policy
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            We do not keep records of completed bookings. Once an appointment concludes,
            all booking details are permanently deleted. There is no client history, no
            appointment log, and no digital footprint. Payment via cash leaves no trace
            whatsoever. For bank transfers, the billing reference is completely neutral
            and cannot be linked to our services.
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
            href="/contact"
            style={{ display: 'inline-block', padding: '16px 40px', border: '1px solid rgba(197,165,114,0.4)', color: '#C5A572', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'inherit' }}
          >
            Contact Us Securely
          </Link>
        </div>
      </section>

    </main>
  )
}
