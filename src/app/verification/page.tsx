// @ts-nocheck
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteConfig } from '@/../config/site'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Companion Verification',
  description: 'Every Virel companion is personally verified. Learn about our selection process.',
  alternates: { canonical: `${siteConfig.domain}/verification` },
}

const faqItems = [
  {
    q: 'How do you verify companion identities?',
    a: 'Every companion undergoes a face-to-face meeting with our team. We verify their identity documents, confirm their photos are genuine and recent, and assess their professionalism in person.',
  },
  {
    q: 'Are the photos on your website real?',
    a: 'Yes. All profile photos are taken during our verification process or approved by our team. We do not use stock photos, AI-generated images, or heavily edited pictures. What you see is what you get.',
  },
  {
    q: 'How often do you re-verify companions?',
    a: 'We conduct regular check-ins with all active companions. Photos are updated periodically, and any companion who does not maintain our standards is removed from the gallery.',
  },
  {
    q: 'What happens if a companion does not meet expectations?',
    a: 'Client satisfaction is paramount. If a companion does not meet the standard described in their profile, contact us immediately. We will arrange an alternative or resolve the situation to your satisfaction.',
  },
]

const graphSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
        { '@type': 'ListItem', position: 2, name: 'Verification', item: `${siteConfig.domain}/verification` },
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

export default function VerificationPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }} />
      <Header />

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: 8 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li aria-current="page" style={{ color: '#C5A572' }}>Verification</li>
          </ol>
        </nav>

        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24 }}>Trust &amp; Quality</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.05, margin: '0 0 16px' }}>
          Our <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Verification</em> Process
        </h1>
        <p style={{ fontSize: 20, color: '#6b6560', marginBottom: 64, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          Every companion is personally vetted to the highest standard
        </p>

        {/* Personal Interview */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Personal Interview
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Every companion meets our team in person before joining Virel. During this meeting
            we assess professionalism, communication skills, presentation, and personality.
            We look for genuine warmth, intelligence, and the ability to make clients feel
            at ease. Fewer than one in five applicants passes our interview process.
          </p>
        </div>

        {/* Identity Verification */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Identity Verification
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            We verify the identity of every companion through official documents. All profile
            photos are confirmed to be genuine, recent, and unedited. We do not accept
            AI-generated images, stock photography, or heavily filtered pictures. The person
            you see in the gallery is the person who arrives at your door.
          </p>
        </div>

        {/* Quality Standards */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Quality Standards
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Our standards go beyond appearance. We evaluate reliability, punctuality,
            communication, and client feedback on an ongoing basis. Companions who
            consistently receive positive reviews are highlighted in our gallery.
            Those who fall below our standards are removed. We also provide ongoing
            support and guidance to help our companions deliver the best possible experience.
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
            style={{ display: 'inline-block', padding: '16px 40px', background: '#C5A572', color: '#0A0A0A', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'inherit' }}
          >
            Meet Our Companions
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
