// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { siteConfig } from '@/../config/site'
import { categories } from '@/../data/categories'
import { prisma } from '@/lib/db/client'

import { ModelCard } from '@/components/public/ModelCard'
import { RichText } from '@/components/public/RichText'
// categoryContent now loaded from DB (CategoryContent model)
import '../category.css'

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cat = categories.find(c => c.slug === slug)
  if (!cat) return {}
  return {
    title: `${cat.name} Escorts London`,
    description: `${cat.name} escorts in London — verified companions at Vaurel. Available across Mayfair, Kensington, Chelsea. From £${siteConfig.priceFrom}/hr.`,
    alternates: { canonical: `${siteConfig.domain}/categories/${slug}` },
  }
}

/** Build a Prisma where-clause that matches this category to model fields */
function buildCategoryFilter(cat: typeof categories[number]): any {
  const base = { status: 'active', deletedAt: null }

  if (cat.group === 'nationality') {
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
        return { ...base, stats: { bustSize: { not: null } } }
      case 'mature':
        return { ...base, stats: { age: { gte: 30 } } }
      case 'young':
        return { ...base, stats: { age: { gte: 18, lte: 24 } } }
      default:
        return base
    }
  }

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

// Strip HTML for schema.org
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '')

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cat = categories.find(c => c.slug === slug)
  if (!cat) notFound()

  const [models, districts, custom] = await Promise.all([
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
    prisma.categoryContent.findFirst({
      where: { category: { slug } },
    }),
  ])

  // Related categories: use custom list or random fallback
  const relatedCats = custom?.relatedCategories?.length
    ? custom.relatedCategories
        .map(s => categories.find(c => c.slug === s))
        .filter(Boolean)
    : categories
        .filter(c => c.slug !== slug)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6)

  const metaDescription = `${cat.name} companions in London. Hand-picked, verified. From £${siteConfig.priceFrom}/hr. ${siteConfig.name} companion agency.`

  // FAQ — custom or generic
  const faqItems = (custom?.faq as { q: string; a: string }[] | undefined)?.length ? (custom.faq as { q: string; a: string }[]) : [
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

  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteConfig.domain}/categories/${slug}`,
        name: `${cat.name} Escorts London`,
        description: metaDescription,
        url: `${siteConfig.domain}/categories/${slug}`,
        provider: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.domain },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteConfig.domain}/categories` },
          { '@type': 'ListItem', position: 3, name: `${cat.name} Escorts`, item: `${siteConfig.domain}/categories/${slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) },
        })),
      },
    ],
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <nav aria-label="breadcrumb">
          <ol className="cat-bc">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/categories">Categories</Link></li>
            <li aria-current="page">{cat.name} Escorts</li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          <em style={{ fontStyle: 'italic', color: '#C5A572' }}>{cat.name}</em> Escorts in London
        </h1>

        {!custom && (
          <p className="cat-p" style={{ maxWidth: 680, margin: '0 0 64px' }}>
            Browse verified {cat.name.toLowerCase()} escorts in London at Vaurel.
            Hand-picked companions available across Mayfair, Kensington, Chelsea and beyond.
            All profiles personally verified. From £{siteConfig.priceFrom}/hr.
          </p>
        )}
      </section>

      {/* About */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div className="cat-divider" />
        <h2 className="cat-h2">About {cat.name} Companions</h2>
        <div style={{ maxWidth: 760 }}>
          {custom?.aboutParagraphs ? (
            custom.aboutParagraphs.map((p, i) => (
              <p key={i} className="cat-p">{p}</p>
            ))
          ) : (
            <>
              <p className="cat-p">
                Our {cat.name.toLowerCase()} companions in London are hand-picked for their sophistication,
                intelligence and charm. Each companion is personally verified by {siteConfig.name} before joining
                our agency, ensuring the highest standards of presentation and professionalism.
              </p>
              <p className="cat-p">
                Whether you are looking for a companion for a dinner date in Mayfair, an overnight stay,
                or a travel companion for a business trip, our {cat.name.toLowerCase()} escorts in London
                offer a discreet and memorable experience. Available for both incall and outcall
                appointments across London, from £{siteConfig.priceFrom} per hour.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Standard Text (custom only) */}
      {custom?.standardText && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ maxWidth: 760 }}>
            <p className="cat-p"><RichText text={custom.standardText} /></p>
          </div>
        </section>
      )}

      {/* Companions */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="cat-h2" style={{ margin: 0 }}>Our {cat.name} Companions</h2>
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
          <div className="cat-divider" />
          <h2 className="cat-h2">Popular Locations</h2>
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
        <div className="cat-divider" />
        <h2 className="cat-h2">Related Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {relatedCats.map(rc => (
            <Link key={rc.slug} href={`/categories/${rc.slug}`} className="cat-link">
              {rc.name} Escorts
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div className="cat-divider" />
        <h2 className="cat-h2" style={{ marginBottom: 32 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {faqItems.map((f, i) => (
            <div key={i}>
              <p className="cat-faq-q">{f.q}</p>
              <p className="cat-faq-a"><RichText text={f.a} /></p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        <Link href="/companions" className="cat-cta">Browse All Companions</Link>
      </section>

    </main>
  )
}
