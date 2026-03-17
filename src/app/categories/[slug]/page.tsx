// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { siteConfig } from '@/../config/site'
import { categories } from '@/../data/categories'
import { prisma } from '@/lib/db/client'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'

export const revalidate = 3600

export function generateStaticParams() {
  return categories.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cat = categories.find(c => c.slug === slug)
  if (!cat) return {}
  return {
    title: `${cat.name} Escorts London`,
    description: `${cat.name} companions in London. Hand-picked, verified. From £${siteConfig.priceFrom}/hr. ${siteConfig.name} companion agency.`,
    alternates: { canonical: `${siteConfig.domain}/categories/${slug}` },
  }
}

/** Build a Prisma where-clause that matches this category to model fields */
function buildCategoryFilter(cat: typeof categories[number]): any {
  const base = { status: 'active', deletedAt: null }

  if (cat.group === 'nationality') {
    // Match stats.nationality (case-insensitive contains)
    return { ...base, stats: { nationality: { contains: cat.name, mode: 'insensitive' } } }
  }

  if (cat.group === 'appearance') {
    switch (cat.slug) {
      case 'blonde':
      case 'brunette':
      case 'redhead':
        return { ...base, stats: { hairColour: { contains: cat.name, mode: 'insensitive' } } }
      case 'petite':
        return { ...base, stats: { height: { lte: 163 } } }
      case 'tall':
        return { ...base, stats: { height: { gte: 175 } } }
      case 'slim':
      case 'curvy':
      case 'busty':
        return { ...base, stats: { bustSize: { not: null } } } // fallback — show all with stats
      case 'mature':
        return { ...base, stats: { age: { gte: 30 } } }
      case 'young':
        return { ...base, stats: { age: { gte: 18, lte: 24 } } }
      default:
        return base
    }
  }

  // experience — match by tagline/bio keywords or service slug
  if (cat.group === 'experience') {
    switch (cat.slug) {
      case 'gfe':
      case 'vip':
      case 'elite':
      case 'party':
      case 'bisexual':
        return {
          ...base,
          OR: [
            { tagline: { contains: cat.name, mode: 'insensitive' } },
            { bio: { contains: cat.name, mode: 'insensitive' } },
          ],
        }
      case 'high-class':
        return { ...base, isExclusive: true }
      case 'dinner-date':
      case 'overnight':
      case 'travel-companion':
        return {
          ...base,
          OR: [
            { tagline: { contains: cat.name.replace(/-/g, ' '), mode: 'insensitive' } },
            { bio: { contains: cat.name.replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        }
      default:
        return base
    }
  }

  return base
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cat = categories.find(c => c.slug === slug)
  if (!cat) notFound()

  const relatedCategories = categories
    .filter(c => c.slug !== slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 6)

  const [models, districts] = await Promise.all([
    prisma.model.findMany({
      where: buildCategoryFilter(cat),
      include: {
        stats: true,
        media: { where: { isPublic: true, isPrimary: true }, select: { url: true }, take: 1 },
        modelLocations: {
          where: { isPrimary: true },
          include: { district: { select: { name: true } } },
          take: 1,
        },
        modelRates: { take: 1 },
      },
      take: 20,
    }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      select: { name: true, slug: true },
      take: 8,
    }),
  ])

  // Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat.name} Escorts London`,
    url: `${siteConfig.domain}/categories/${slug}`,
    description: `${cat.name} companions in London. Verified by ${siteConfig.name}.`,
    provider: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.domain },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteConfig.domain}/categories` },
      { '@type': 'ListItem', position: 3, name: `${cat.name} Escorts` },
    ],
  }

  const faqItems = [
    {
      q: `How many ${cat.name.toLowerCase()} escorts do you have in London?`,
      a: `We currently have ${models.length} verified ${cat.name.toLowerCase()} companion${models.length !== 1 ? 's' : ''} available in London. Our selection is updated daily as new companions join and availability changes.`,
    },
    {
      q: `What are the rates for ${cat.name.toLowerCase()} companions?`,
      a: `Rates for our ${cat.name.toLowerCase()} companions typically start from £${siteConfig.priceFrom} per hour. Prices vary based on the companion, duration, and type of booking. Check individual profiles for exact pricing.`,
    },
    {
      q: `Can I book a ${cat.name.toLowerCase()} escort for outcall?`,
      a: `Yes, many of our ${cat.name.toLowerCase()} companions offer both incall and outcall services across London. Outcall is available to hotels and private residences in central London districts.`,
    },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`
        .cat-link { display:block; padding:16px 20px; border:1px solid rgba(255,255,255,0.07); text-decoration:none; color:#ddd5c8; font-size:14px; transition:border-color .25s; }
        .cat-link:hover { border-color:rgba(197,165,114,0.4); }
        .cat-cta { display:inline-block; padding:16px 40px; background:#C5A572; color:#0A0A0A; font-size:11px; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:background .25s; font-family:inherit; }
        .cat-cta:hover { background:#d4b87a; }
        .faq-q { font-size:15px; color:#f0e8dc; font-weight:400; margin:0 0 8px; }
        .faq-a { font-size:14px; color:#6b6560; line-height:1.8; margin:0; }
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <nav style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/categories" style={{ color: '#6b6560', textDecoration: 'none' }}>Categories</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#C5A572' }}>{cat.name} Escorts</span>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          <em style={{ fontStyle: 'italic', color: '#C5A572' }}>{cat.name}</em> Escorts in London
        </h1>

        <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 680, margin: '0 0 64px' }}>
          Discover our selection of {cat.name.toLowerCase()} companions in London, each personally vetted by the {siteConfig.name} team.
          Whether you are looking for a dinner date, a social event companion, or a private encounter,
          our {cat.name.toLowerCase()} escorts offer sophistication, discretion, and genuine connection.
          All profiles feature authentic, verified photographs and detailed descriptions to help you
          find exactly the right companion for your preferences.
        </p>
      </section>

      {/* Companions */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
            Our {cat.name} Companions
          </h2>
          <span style={{ fontSize: 11, color: '#4a4540', letterSpacing: '.15em' }}>{models.length} AVAILABLE</span>
        </div>
        {models.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {models.map((m: any) => (
              <ModelCard
                key={m.id}
                name={m.name}
                slug={m.slug}
                tagline={m.tagline}
                coverPhotoUrl={m.media?.[0]?.url || null}
                availability={m.availability}
                isVerified={m.isVerified}
                isExclusive={m.isExclusive}
                districtName={m.modelLocations?.[0]?.district?.name}
                minIncallPrice={m.modelRates?.[0]?.incallPrice}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 14, color: '#6b6560', marginBottom: 24 }}>No {cat.name.toLowerCase()} companions currently listed. Check back soon.</p>
            <Link href="/companions" className="cat-cta">Browse All Companions</Link>
          </div>
        )}
      </section>

      {/* Popular Locations */}
      {districts.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            Popular Locations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {districts.map(d => (
              <Link key={d.slug} href={`/london/${d.slug}-escorts/`} className="cat-link">
                {d.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Categories */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
          Related Categories
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {relatedCategories.map(rc => (
            <Link key={rc.slug} href={`/categories/${rc.slug}`} className="cat-link">
              {rc.name} Escorts
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {faqItems.map((f, i) => (
            <div key={i}>
              <p className="faq-q">{f.q}</p>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        <Link href="/companions" className="cat-cta">
          Browse All Companions
        </Link>
      </section>

      <Footer />
    </main>
  )
}
