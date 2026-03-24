// @ts-nocheck
export const revalidate = 3600

import { Metadata } from 'next'
import Link from 'next/link'

import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'London Escorts — Discreet Companion Agency | Vaurel',
  description: "Vaurel is London's most discreet escort agency. Personally verified companions in Mayfair, Knightsbridge, Chelsea & Kensington. From £250/hr. Personal response in 15 min.",
  alternates: { canonical: `${siteConfig.domain}/london-escorts` },
  openGraph: {
    title: 'London Escorts — Premier Companion Agency | Vaurel',
    description: 'London escorts agency — verified, discreet, sophisticated. Available across all London districts. From £250/hr. Response within 30 minutes.',
    url: `${siteConfig.domain}/london-escorts`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [{ url: `${siteConfig.domain}/opengraph-image.png`, width: 1200, height: 630 }],
  },
}

export default async function LondonEscortsPage() {
  const [models, districts] = await Promise.all([
    prisma.model.findMany({
      where: { status: 'active', deletedAt: null },
      include: {
        media: { where: { isPublic: true, isPrimary: true }, select: { url: true }, take: 1 },
        modelLocations: {
          where: { isPrimary: true },
          include: { district: { select: { name: true } } },
          take: 1,
        },
        modelRates: { take: 1 },
      },
      orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      select: { name: true, slug: true },
      take: 12,
    }),
  ])

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'London Escorts' }]} />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <nav aria-label="breadcrumb" style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', marginBottom: 40 }}>
          <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>LONDON ESCORTS</span>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          London <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Escorts</em>
        </h1>

        <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 680, margin: '0 0 48px' }}>
          Vaurel is London's premier escort agency — verified, discreet, sophisticated.
          Browse our companions available across Mayfair, Kensington, Chelsea, Belgravia and beyond.
          All profiles personally verified. From £{siteConfig.priceFrom}/hr.
        </p>
      </section>

      {/* Districts */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 48px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', marginBottom: 16 }}>
          Browse by district
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {districts.map(d => (
            <Link
              key={d.slug}
              href={`/london/${d.slug}-escorts`}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                color: '#6b6560',
                border: '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none',
                transition: 'all .2s',
              }}
            >
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Companions grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', marginBottom: 24 }}>
          {models.length} companion{models.length !== 1 ? 's' : ''} available
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {models.map((model: any) => (
            <ModelCard
              key={model.id}
              name={model.name}
              slug={model.slug}
              tagline={model.tagline}
              coverPhotoUrl={model.media[0]?.url ?? null}
              availability={model.availability}
              isVerified={model.isVerified}
              isExclusive={model.isExclusive}
              districtName={model.modelLocations?.[0]?.district?.name ?? null}
              minIncallPrice={model.modelRates?.[0]?.incallPrice ? Number(model.modelRates[0].incallPrice) : null}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link
            href="/companions"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              fontSize: 11,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: '#ddd5c8',
              border: '1px solid rgba(197,165,114,0.4)',
              textDecoration: 'none',
            }}
          >
            View All Companions
          </Link>
        </div>
      </section>

      {/* ── SEO Content Block ── */}
      <section className="le-seo" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 100px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.18),transparent)', marginBottom: 72 }} />
        <div className="le-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#BF9B5A', marginBottom: 14 }}>About Our Agency</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,2.8vw,40px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 28px' }}>
              London&apos;s Most Discreet<br />
              <em style={{ fontStyle: 'italic', color: 'rgba(240,232,220,0.4)' }}>Escort Agency</em>
            </h2>
            <p style={{ fontSize: 14, lineHeight: 2, color: '#8a8580', marginBottom: 18 }}>
              Vaurel is a privately operated London escort agency specialising in discreet companion introductions for discerning clients. Unlike directories or aggregator platforms, every companion listed with Vaurel has been personally met and verified by our team — meaning the photographs are authentic, the profiles are accurate, and the person you see is the person you will meet.
            </p>
            <p style={{ fontSize: 14, lineHeight: 2, color: '#6b6560', marginBottom: 18 }}>
              Our companions are available across London&apos;s most sought-after postcodes:{' '}
              <Link href="/london/mayfair-escorts" style={{ color: '#BF9B5A', textDecoration: 'none' }}>Mayfair</Link> (W1),{' '}
              <Link href="/london/knightsbridge-escorts" style={{ color: '#BF9B5A', textDecoration: 'none' }}>Knightsbridge</Link> (SW1X),{' '}
              <Link href="/london/chelsea-escorts" style={{ color: '#BF9B5A', textDecoration: 'none' }}>Chelsea</Link> (SW3),{' '}
              <Link href="/london/kensington-escorts" style={{ color: '#BF9B5A', textDecoration: 'none' }}>Kensington</Link> (W8),{' '}
              <Link href="/london/belgravia-escorts" style={{ color: '#BF9B5A', textDecoration: 'none' }}>Belgravia</Link> (SW1W) and{' '}
              <Link href="/london/marylebone-escorts" style={{ color: '#BF9B5A', textDecoration: 'none' }}>Marylebone</Link> (W1U).
              Whether you require an in-call appointment at a companion&apos;s private central London address or an out-call to your hotel suite, we arrange everything with the same standard of care and complete discretion.
            </p>
            <p style={{ fontSize: 14, lineHeight: 2, color: '#5a5550' }}>
              We respond to every enquiry personally — no automated replies, no queues. Our typical response time is under 15 minutes, 24 hours a day, seven days a week. Rates begin from £{siteConfig.priceFrom} per hour and reflect the calibre of companion and the standard of the introduction.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#BF9B5A', marginBottom: 14 }}>Why Choose Vaurel</p>
            <div>
              {([
                ['Personally verified companions', 'Every companion is met in person by our team before being listed. Identity confirmed, photographs reviewed, profiles approved. You will never encounter a misrepresentation.'],
                ['Not a directory', 'We do not aggregate third-party profiles. Every companion is exclusive to Vaurel and introduced personally — which is why our standards remain consistently high.'],
                ['Absolute discretion, always', 'Your enquiry, your booking, and your personal details are handled in complete confidence. We do not retain client data beyond what is necessary.'],
                ['24/7 personal response', 'Our team answers every message personally. You will never receive an automated reply. Same-day and last-minute bookings are accommodated whenever possible.'],
                ['Companions who inhabit London', "Our roster includes companions who move naturally through London's finest settings — Michelin-starred restaurants, five-star hotels, private members clubs. They are not performing sophistication. They inhabit it."],
              ] as [string, string][]).map(([title, body]) => (
                <div key={title} style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 1, background: '#BF9B5A', marginTop: 11, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 300, color: '#f0e8dc', margin: '0 0 6px', lineHeight: 1.2 }}>{title}</p>
                    <p style={{ fontSize: 12, lineHeight: 1.85, color: 'rgba(255,255,255,0.18)', margin: 0 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)', marginBottom: 14 }}>Browse by experience</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {([
              ['Girlfriend Experience', '/services/gfe'],
              ['Dinner Date Escorts', '/services/dinner-date'],
              ['Overnight Escorts London', '/services/overnight'],
              ['Travel Companions', '/services/travel-companion'],
              ['Duo Bookings', '/services/duo'],
              ['Verified Escorts London', '/companions'],
            ] as [string, string][]).map(([label, href]) => (
              <Link key={href} href={href} style={{ padding: '7px 16px', fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
