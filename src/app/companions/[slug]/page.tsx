// @ts-nocheck
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CompanionGallery } from '@/components/public/CompanionGallery'
import { BookingWidget } from '@/components/public/BookingWidget'
import { ViewTracker } from '@/components/public/ViewTracker'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

interface Props { params: { slug: string } }

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? siteConfig.domain

function formatServiceName(raw: string): string {
  if (!raw) return ''
  if (/[A-Z]/.test(raw) || raw.includes(' ')) return raw
  const acronyms = ['b2b', 'owc', 'gfe', 'fk', 'dfk', 'owo', 'pse', 'bdsm', '69']
  if (acronyms.includes(raw.toLowerCase())) return raw.toUpperCase()
  return raw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function getProfileData(slug: string) {
  try {
    const model = await prisma.model.findUnique({
      where: { slug, status: 'active', deletedAt: null },
      include: {
        stats: true,
        media: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' } },
        modelRates: {
          include: { callRateMaster: true },
          orderBy: { callRateMaster: { sortOrder: 'asc' } },
        },
        services: {
          where: { isEnabled: true, service: { isPublic: true } },
          include: { service: true },
          orderBy: { service: { sortOrder: 'asc' } },
        },
        modelLocations: {
          include: { district: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })
    if (!model) return null
    const primaryPhoto = model.media.find((m) => m.isPrimary)?.url ?? model.media[0]?.url ?? null
    const galleryUrls = model.media.filter((m) => m.isPublic && m.url !== primaryPhoto).map((m) => m.url)
    const rates = model.modelRates
      .filter((mr) => mr.incallPrice != null || mr.outcallPrice != null)
      .map((mr) => ({
        label: mr.callRateMaster?.label ?? '—',
        sortOrder: mr.callRateMaster?.sortOrder ?? 99,
        incall: mr.incallPrice != null ? Number(mr.incallPrice) : null,
        outcall: mr.outcallPrice != null ? Number(mr.outcallPrice) : null,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const allPrices = [
      ...rates.map((r) => r.incall).filter((v): v is number => v != null),
      ...rates.map((r) => r.outcall).filter((v): v is number => v != null),
    ]
    const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null
    const services = model.services.map((ms) => ({
      serviceId: ms.serviceId,
      slug: ms.service?.slug ?? '',
      name: formatServiceName(ms.service?.publicName ?? ms.service?.name ?? ms.service?.slug ?? ''),
      isExtra: ms.isExtra ?? false,
      isDoublePrice: ms.isDoublePrice ?? false,
      isPOA: ms.isPOA ?? false,
      extraPrice: ms.extraPrice != null ? Number(ms.extraPrice) : null,
    }))
    const districts = model.modelLocations.map((ml) => ({
      name: ml.district?.name ?? '',
      slug: ml.district?.slug ?? '',
      isPrimary: ml.isPrimary,
    }))
    const primaryDistrict = districts.find((d) => d.isPrimary)?.name ?? districts[0]?.name ?? null
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      tagline: model.tagline,
      bio: model.bio,
      seoTitle: model.seoTitle,
      seoDescription: model.seoDescription,
      availability: model.availability,
      isVerified: model.isVerified,
      isExclusive: model.isExclusive,
      lastActiveAt: model.lastActiveAt?.toISOString() ?? null,
      nearestStation: model.nearestStation,
      telegramTag: model.telegram ? (model as any).telegramPhone ?? null : null,
      whatsapp: model.whatsapp ?? null,
      primaryPhoto,
      galleryUrls,
      rates,
      lowestPrice,
      services,
      districts,
      primaryDistrict,
      stats: model.stats ? {
        age: model.stats.age,
        height: model.stats.height,
        weight: model.stats.weight,
        bustSize: model.stats.bustSize,
        bustType: model.stats.bustType,
        eyeColour: model.stats.eyeColour,
        hairColour: model.stats.hairColour,
        nationality: model.stats.nationality,
        ethnicity: (model as any).ethnicity,
        languages: model.stats.languages,
        dressSize: model.stats.dressSize,
        feetSize: model.stats.feetSize,
        smokingStatus: model.stats.smokingStatus,
        tattooStatus: model.stats.tattooStatus,
        measurements: (model as any).measurements,
        orientation: model.stats.orientation,
      } : null,
    }
  } catch (e) {
    console.error('[getProfileData] error:', e)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfileData(params.slug)
  if (!profile) return {}
  return {
    title: profile.seoTitle ?? profile.name,
    description: profile.seoDescription
      ?? `Book ${profile.name}${profile.tagline ? ` — ${profile.tagline}` : ''}. London companion agency.`,
    openGraph: {
      images: profile.primaryPhoto ? [{ url: profile.primaryPhoto }] : [],
    },
    alternates: { canonical: `${BASE_URL}/companions/${params.slug}` },
  }
}

export default async function ModelProfilePage({ params }: Props) {
  const profile = await getProfileData(params.slug)
  if (!profile) notFound()

  // Similar companions
  let similarModels: any[] = []
  try {
    similarModels = await prisma.model.findMany({
      where: { status: 'active', deletedAt: null, id: { not: profile.id } },
      include: {
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        modelRates: { include: { callRateMaster: true }, take: 1 },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  const regularServices = profile.services.filter((s: any) => !s.isExtra)
  const extraServices = profile.services.filter((s: any) => s.isExtra)

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: `${BASE_URL}/companions/${profile.slug}`,
    image: profile.primaryPhoto ?? undefined,
  }

  return (
    <div className="profile-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }} />
      <ViewTracker slug={params.slug} />
      <Header />

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span style={{ margin: '0 10px' }}>→</span>
        <Link href="/companions">Companions</Link>
        <span style={{ margin: '0 10px' }}>→</span>
        <span style={{ color: '#c9a84c' }}>{profile.name}</span>
      </nav>

      {/* Main: Gallery + Booking Widget */}
      <div className="profile-main">
        <div style={{ paddingRight: 40 }}>
          <CompanionGallery
            coverPhotoUrl={profile.primaryPhoto}
            galleryPhotoUrls={profile.galleryUrls}
            name={profile.name}
          />
        </div>
        <div className="profile-sidebar">
          <BookingWidget
            modelName={profile.name}
            modelSlug={profile.slug}
            availability={profile.availability}
            isVerified={profile.isVerified}
            isExclusive={profile.isExclusive}
            lastActiveAt={profile.lastActiveAt}
            rates={profile.rates.map((r: any) => ({
              label: r.label,
              durationMin: r.sortOrder ?? 0,
              incallPrice: r.incall,
              outcallPrice: r.outcall,
            }))}
          />
        </div>
      </div>

      {/* Content sections */}
      <div className="content-sections">
        {/* About */}
        {profile.bio && (
          <section>
            <p className="section-label">About</p>
            <p className="bio-text">{profile.bio}</p>
          </section>
        )}

        {/* Details */}
        {profile.stats && (
          <section>
            <p className="section-label">Details</p>
            <div className="about-grid">
              {[
                profile.stats.age            && { label: 'Age',          value: `${profile.stats.age}` },
                profile.stats.height         && { label: 'Height',       value: `${profile.stats.height} cm` },
                profile.stats.weight         && { label: 'Weight',       value: `${profile.stats.weight} kg` },
                profile.stats.bustSize       && { label: 'Bust',         value: `${profile.stats.bustSize}${profile.stats.bustType ? ` (${profile.stats.bustType})` : ''}` },
                profile.stats.measurements   && { label: 'Measurements', value: profile.stats.measurements },
                profile.stats.dressSize      && { label: 'Dress Size',   value: profile.stats.dressSize },
                profile.stats.feetSize       && { label: 'Shoe Size',    value: profile.stats.feetSize },
                profile.stats.eyeColour      && { label: 'Eyes',         value: profile.stats.eyeColour },
                profile.stats.hairColour     && { label: 'Hair',         value: profile.stats.hairColour },
                profile.stats.nationality    && { label: 'Nationality',  value: profile.stats.nationality },
                profile.stats.ethnicity      && { label: 'Ethnicity',    value: profile.stats.ethnicity },
                profile.stats.languages?.length && { label: 'Languages', value: profile.stats.languages.join(', ') },
                profile.stats.orientation    && { label: 'Orientation',  value: profile.stats.orientation },
                profile.stats.smokingStatus  && { label: 'Smoking',      value: profile.stats.smokingStatus },
                profile.stats.tattooStatus   && { label: 'Tattoos',      value: profile.stats.tattooStatus },
              ].filter(Boolean).map((s: any) => (
                <div key={s.label} className="about-cell">
                  <p className="about-lbl">{s.label}</p>
                  <p className="about-val">{s.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Location */}
        {(profile.primaryDistrict || profile.nearestStation) && (
          <section>
            <p className="section-label">Location</p>
            <div className="loc-block">
              {profile.primaryDistrict && <p className="loc-main">📍 {profile.districts.map((d: any) => d.name).join(' · ')}</p>}
              {profile.nearestStation && <p className="loc-station">Nearest Station: {profile.nearestStation}</p>}
            </div>
          </section>
        )}

        {/* Rates */}
        {profile.rates.length > 0 && (
          <section>
            <p className="section-label">Rates</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="rates-table">
                <thead>
                  <tr><th>Duration</th><th>Incall</th><th>Outcall</th></tr>
                </thead>
                <tbody>
                  {profile.rates.map((row: any) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.incall != null ? `£${Number(row.incall).toLocaleString(siteConfig.lang)}` : '—'}</td>
                      <td>{row.outcall != null ? `£${Number(row.outcall).toLocaleString(siteConfig.lang)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Services */}
        {regularServices.length > 0 && (
          <section>
            <p className="section-label">Services</p>
            <div className="svc-tags">
              {regularServices.map((svc: any) => (
                svc.slug ? (
                  <Link key={svc.serviceId} href={`/services/${svc.slug}`} className="svc-tag" style={{ textDecoration: 'none' }}>
                    {svc.name}
                  </Link>
                ) : (
                  <span key={svc.serviceId} className="svc-tag">{svc.name}</span>
                )
              ))}
            </div>
          </section>
        )}

        {/* Extras */}
        {extraServices.length > 0 && (
          <section>
            <p className="section-label">Extras</p>
            <div className="extras-list">
              {extraServices.map((svc: any) => (
                <span key={svc.serviceId} className="extra-item">
                  {svc.name}
                  {svc.extraPrice && <span className="extra-price">+£{svc.extraPrice}</span>}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="disclaimer">
          All services are for companionship only.<br />
          Any activities between consenting adults are a matter of personal choice.
        </div>

        <Link href="/companions" className="back-link">← All Companions</Link>
      </div>

      {/* Similar companions */}
      {similarModels.length > 0 && (
        <section className="similar-section">
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: '#FAFAFA', margin: 0 }}>
            Discover
          </h3>
          <div className="similar-grid">
            {similarModels.map((sim: any) => {
              const simPhoto = sim.media[0]?.url ?? null
              const simPrice = sim.modelRates?.[0]?.incallPrice
                ? Number(sim.modelRates[0].incallPrice)
                : null
              return (
                <ModelCard
                  key={sim.id}
                  name={sim.name}
                  slug={sim.slug}
                  tagline={sim.tagline}
                  coverPhotoUrl={simPhoto}
                  availability={sim.availability}
                  isVerified={sim.isVerified}
                  isExclusive={sim.isExclusive}
                  districtName={null}
                  minIncallPrice={simPrice}
                />
              )
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
