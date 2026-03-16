// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const services = await prisma.service.findMany({
    where: { isActive: true, isPublic: true },
    select: { slug: true },
  })
  return services.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = await prisma.service.findFirst({
    where: { slug, isActive: true, isPublic: true },
    select: { publicName: true, title: true, name: true, seoTitle: true, seoDescription: true },
  })
  if (!service) return {}
  const displayName = service.publicName || service.title || service.name
  return {
    title: service.seoTitle || `${displayName} London`,
    description: service.seoDescription || `${displayName} service with premium London companions. Browse verified escorts offering ${displayName}.`,
    alternates: { canonical: `https://virel-v3.vercel.app/services/${slug}` },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const service = await prisma.service.findFirst({
    where: { slug, isActive: true, isPublic: true },
  })
  if (!service) notFound()

  const displayName = service.publicName || service.title || service.name

  // Models offering this service
  const modelServices = await prisma.modelService.findMany({
    where: { serviceId: service.id, isEnabled: true },
    select: { modelId: true },
  })
  const modelIds = modelServices.map(ms => ms.modelId)

  const models = modelIds.length > 0
    ? await prisma.model.findMany({
        where: { id: { in: modelIds }, status: 'active', deletedAt: null },
        include: {
          media: { where: { isPublic: true, isPrimary: true }, select: { url: true }, take: 1 },
          stats: { select: { nationality: true } },
          modelLocations: {
            where: { isPrimary: true },
            include: { district: { select: { name: true } } },
            take: 1,
          },
          modelRates: {
            take: 1,
          },
        },
        take: 12,
      })
    : []

  // Related services (same category)
  const related = await prisma.service.findMany({
    where: {
      isActive: true,
      isPublic: true,
      category: service.category,
      id: { not: service.id },
    },
    select: { slug: true, publicName: true, title: true, name: true },
    take: 3,
    orderBy: { sortOrder: 'asc' },
  })

  // Schema.org
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: displayName,
    description: service.introText || service.fullDescription || `${displayName} with premium London companions.`,
    provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
    areaServed: { '@type': 'City', name: 'London' },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://virel-v3.vercel.app/services' },
      { '@type': 'ListItem', position: 3, name: displayName },
    ],
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`
        .svc-rel { display:block; padding:20px 24px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); text-decoration:none; transition:border-color .25s; }
        .svc-rel:hover { border-color:rgba(197,165,114,0.35); }
        .svc-cta { display:inline-block; padding:16px 40px; border:1px solid rgba(197,165,114,0.4); color:#C5A572; font-size:11px; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:all .25s; font-family:inherit; }
        .svc-cta:hover { background:rgba(197,165,114,0.08); border-color:#C5A572; }
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Header />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/services" style={{ color: '#6b6560', textDecoration: 'none' }}>Services</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#C5A572' }}>{displayName}</span>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          {displayName} <em style={{ fontStyle: 'italic', color: '#C5A572' }}>London</em>
        </h1>

        <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 680, margin: '0 0 64px' }}>
          {service.introText || `Discover ${displayName} with our premium London companions. Each companion is verified and offers a truly exceptional experience.`}
        </p>
      </section>

      {/* Models */}
      {models.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
              Companions offering {displayName}
            </h2>
            <span style={{ fontSize: 11, color: '#4a4540', letterSpacing: '.15em' }}>{models.length} AVAILABLE</span>
          </div>
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
        </section>
      )}

      {/* Full Description */}
      {service.fullDescription && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            About {displayName}
          </h2>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 680 }}>
            {service.fullDescription}
          </p>
        </section>
      )}

      {/* Related Services */}
      {related.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            Related Services
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {related.map(r => (
              <Link key={r.slug} href={`/services/${r.slug}`} className="svc-rel">
                <span style={{ fontSize: 14, color: '#ddd5c8' }}>{r.publicName || r.title || r.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        <Link href="/find-your-match" className="svc-cta">
          Find Your {displayName} Companion
        </Link>
      </section>

      <Footer />
    </main>
  )
}
