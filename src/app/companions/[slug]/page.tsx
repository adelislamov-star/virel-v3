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

interface Props { params: { slug: string } }

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://virel-v3.vercel.app'

async function getProfile(slug: string) {
  const res = await fetch(`${BASE_URL}/api/v1/public/profile/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  return json.success ? json.data : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile(params.slug)
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
  const profile = await getProfile(params.slug)
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
                profile.stats.age && { label: 'Age', value: `${profile.stats.age}` },
                profile.stats.height && { label: 'Height', value: `${profile.stats.height} cm` },
                profile.stats.bustSize && { label: 'Bust', value: `${profile.stats.bustSize}${profile.stats.bustType ? ` (${profile.stats.bustType})` : ''}` },
                profile.stats.eyeColour && { label: 'Eyes', value: profile.stats.eyeColour },
                profile.stats.hairColour && { label: 'Hair', value: profile.stats.hairColour },
                profile.stats.nationality && { label: 'Nationality', value: profile.stats.nationality },
                profile.stats.ethnicity && { label: 'Ethnicity', value: profile.stats.ethnicity },
                profile.stats.languages?.length && { label: 'Languages', value: profile.stats.languages.join(', ') },
                profile.stats.measurements && { label: 'Measurements', value: profile.stats.measurements },
                profile.stats.dressSize && { label: 'Dress Size', value: profile.stats.dressSize },
                profile.stats.feetSize && { label: 'Shoe Size', value: profile.stats.feetSize },
                profile.stats.smokingStatus && { label: 'Smoking', value: profile.stats.smokingStatus },
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
                      <td>{row.incall != null ? `£${Number(row.incall).toLocaleString('en-GB')}` : '—'}</td>
                      <td>{row.outcall != null ? `£${Number(row.outcall).toLocaleString('en-GB')}` : '—'}</td>
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
