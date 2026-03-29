export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'

import { CompanionGallery } from '@/components/public/CompanionGallery'
import { ProfileStickyBar } from '@/components/public/ProfileStickyBar'
import { ProfileEnquiryForm } from '@/components/public/ProfileEnquiryForm'
import { ViewTracker } from '@/components/public/ViewTracker'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import { sortRates } from '@/lib/sortRates'
import { durationLabel } from '@/lib/durationLabel'
import '@/app/companions/companions.css'

interface Props { params: { slug: string } }

const BASE_URL = siteConfig.domain
const WA_NUMBER = '447562279678'
const TG_HANDLE = '+447562279678'

function buildWaUrl(name: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hi, I'm interested in arranging a meeting with ${name}. Could you help me?`
  )}`
}

function buildTgUrl() {
  return `https://t.me/${TG_HANDLE}`
}

function formatServiceName(raw: string): string {
  if (!raw) return ''
  if (/[A-Z]/.test(raw) || raw.includes(' ')) return raw
  const acronyms = ['b2b', 'owc', 'gfe', 'fk', 'dfk', 'owo', 'pse', 'bdsm', '69']
  if (acronyms.includes(raw.toLowerCase())) return raw.toUpperCase()
  return raw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function toTitleCase(name: string): string {
  return name.trim().replace(/\b\w/g, c => c.toUpperCase())
}

async function getProfileData(slug: string) {
  try {
    const model = await prisma.model.findUnique({
      where: { slug, status: 'active', deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        bio: true,
        seoTitle: true,
        seoDescription: true,
        availability: true,
        isVerified: true,
        isExclusive: true,
        lastActiveAt: true,
        nearestStation: true,
        telegram: true,
        whatsapp: true,
        wardrobe: true,
        publicTags: true,
        travel: true,
        ethnicity: true,
        paymentCash: true,
        paymentRevolut: true,
        paymentBankTransfer: true,
        paymentBTC: true,
        paymentUSDT: true,
        paymentTerminal: true,
        paymentMonzo: true,
        paymentStarling: true,
        paymentMonese: true,
        paymentLTC: true,
        stats: true,
        media: {
          where: {
            isPublic: true,
            NOT: { url: { contains: '0-1773713444099' } }
          },
          orderBy: { sortOrder: 'asc' }
        },
        modelRates: true,
        services: {
          where: { isEnabled: true, service: { isPublic: true } },
          include: { service: true },
          orderBy: { service: { sortOrder: 'asc' } },
        },
        modelLocations: {
          include: { district: true },
          orderBy: { isPrimary: 'desc' },
        },
        categories: {
          include: { category: true },
        },
      },
    })
    if (!model) return null

    const primaryPhoto = model.media.find((m) => m.isPrimary)?.url ?? model.media[0]?.url ?? null
    const cleanPrimary = primaryPhoto?.replace(/_thumb(\.[^.]+)$/, '$1') ?? null
    const seen = new Set<string>(cleanPrimary ? [cleanPrimary] : [])
    const galleryUrls = model.media
      .filter((m) => m.url && !m.url.includes('_thumb') && m.url !== cleanPrimary && !seen.has(m.url) && (seen.add(m.url), true))
      .map((m) => m.url)

    // Group rates by durationType into { label, incall, outcall } rows
    const sortedModelRates = sortRates(model.modelRates.map(r => ({ duration_type: r.durationType, ...r })))
    const ratesByDuration = new Map<string, { incall: number | null; outcall: number | null; taxiFee: number | null }>()
    for (const r of sortedModelRates) {
      const existing = ratesByDuration.get(r.durationType) ?? { incall: null, outcall: null, taxiFee: null }
      if (r.callType === 'incall') existing.incall = Number(r.price)
      if (r.callType === 'outcall') {
        existing.outcall = Number(r.price)
        if (r.taxiFee != null) existing.taxiFee = Number(r.taxiFee)
      }
      ratesByDuration.set(r.durationType, existing)
    }
    const rates = Array.from(ratesByDuration.entries()).map(([durationType, prices]) => ({
      label: durationLabel(durationType),
      durationType,
      incall: prices.incall,
      outcall: prices.outcall,
    }))

    // Use 1-hour rate as the display price (shown as "From £X / hour")
    const hourlyRate = rates.find((r) => r.durationType === '1hour')
    const hourlyPrices = [hourlyRate?.incall, hourlyRate?.outcall].filter((v): v is number => v != null && v > 0)
    const lowestPrice = hourlyPrices.length > 0 ? Math.min(...hourlyPrices) : null

    const services = model.services.map((ms) => ({
      serviceId: ms.serviceId,
      slug: ms.service?.slug ?? '',
      name: formatServiceName(ms.service?.publicName ?? ms.service?.name ?? ms.service?.slug ?? ''),
      category: ms.service?.category ?? 'Other',
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

    const categories = (model.categories ?? []).map((mc) => ({
      name: mc.category?.title ?? '',
      slug: mc.category?.slug ?? '',
    }))

    const primaryDistrict = districts.find((d) => d.isPrimary)?.name ?? districts[0]?.name ?? null

    const paymentMethods = [
      model.paymentCash && 'Cash',
      model.paymentTerminal && 'Card Terminal',
      model.paymentBankTransfer && 'Bank Transfer',
      model.paymentMonzo && 'Monzo',
      model.paymentRevolut && 'Revolut',
      model.paymentStarling && 'Starling',
      model.paymentLTC && 'LTC',
      model.paymentBTC && 'Bitcoin',
      model.paymentUSDT && 'USDT',
    ].filter(Boolean) as string[]

    return {
      id: model.id,
      name: toTitleCase(model.name),
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
      primaryPhoto: cleanPrimary,
      galleryUrls,
      rates,
      lowestPrice,
      services,
      districts,
      categories,
      primaryDistrict,
      wardrobe: model.wardrobe,
      publicTags: model.publicTags,
      travel: model.travel,
      ethnicity: model.ethnicity,
      paymentMethods,
      stats: model.stats ? {
        age: model.stats.age,
        height: model.stats.height,
        weight: model.stats.weight,
        bustSize: model.stats.bustSize,
        bustType: model.stats.bustType,
        eyeColour: model.stats.eyeColour,
        hairColour: model.stats.hairColour,
        nationality: model.stats.nationality,
        languages: model.stats.languages,
        dressSize: model.stats.dressSize,
        feetSize: model.stats.feetSize,
        smokingStatus: model.stats.smokingStatus,
        tattooStatus: model.stats.tattooStatus,
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
  const lowestPrice = profile.lowestPrice ? `From £${profile.lowestPrice}/hr.` : ''
  const title = profile.seoTitle ?? `${profile.name} — London Companion`
  const description = profile.seoDescription
    ?? `Book ${profile.name}${profile.tagline ? ` — ${profile.tagline}` : ''}. Verified London companion at Vaurel. ${lowestPrice}`.trim()
  return {
    title,
    description,
    openGraph: {
      images: profile.primaryPhoto ? [{
        url: profile.primaryPhoto,
        width: 1200,
        height: 1600,
        alt: `${profile.name} — London companion Vaurel`,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: profile.primaryPhoto ? [profile.primaryPhoto] : [],
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
        modelRates: { where: { callType: 'incall' }, take: 1 },
        stats: { select: { nationality: true } },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  const regularServices = profile.services.filter((s) => !s.isExtra)
  const extraServices = profile.services.filter((s) => s.isExtra && s.extraPrice != null)

  // Group services by category
  const serviceGroups: Record<string, typeof regularServices> = {}
  for (const svc of regularServices) {
    const cat = svc.category || ''
    if (!cat) continue
    if (!serviceGroups[cat]) serviceGroups[cat] = []
    serviceGroups[cat].push(svc)
  }
  const categoryOrder = Object.keys(serviceGroups).sort()
  const categoryLabels: Record<string, string> = Object.fromEntries(
    categoryOrder.map(cat => [cat, cat.charAt(0).toUpperCase() + cat.slice(1)])
  )

  const waUrl = buildWaUrl(profile.name)
  const tgUrl = buildTgUrl()
  const isAvailable = profile.availability === 'Available Now'

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: `${BASE_URL}/companions/${profile.slug}`,
    image: profile.primaryPhoto ?? undefined,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Companions', item: `${BASE_URL}/companions` },
      { '@type': 'ListItem', position: 3, name: profile.name, item: `${BASE_URL}/companions/${profile.slug}` },
    ],
  }

  return (
    <div className="pr-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ViewTracker slug={params.slug} />

      {/* ══ 1. HERO ══ */}
      <div className="pr-hero">
        <div className="pr-gallery">
          <CompanionGallery
            coverPhotoUrl={profile.primaryPhoto}
            galleryPhotoUrls={profile.galleryUrls}
            name={profile.name}
          />
        </div>

        <div className="pr-hinfo">
          {isAvailable && (
            <div className="pr-avail">
              <span className="pr-avail-dot" />
              <span className="pr-avail-text">Available now · {profile.primaryDistrict ?? 'London'}</span>
            </div>
          )}
          <h1 className="pr-name">
            {profile.name}<em>.</em>
          </h1>
          {profile.tagline && (
            <p className="pr-tagline">{profile.tagline}</p>
          )}
          {profile.lowestPrice && (
            <div className="pr-price-anchor">
              <div className="pr-price-from">From</div>
              <div className="pr-price-val">
                £{profile.lowestPrice.toLocaleString('en-GB')}
                <span>/ hour</span>
              </div>
            </div>
          )}
          <div className="pr-btns">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-wa">
              WhatsApp
            </a>
            <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-tg">
              Telegram
            </a>
          </div>
          <p className="pr-response">Our team responds within 15 minutes · 24/7</p>
        </div>
      </div>

      {/* ══ 2. PRESENCE ══ */}
      {profile.bio && (
        <>
          <hr className="pr-div" />
          <div className="pr-presence">
            <div>
              <div className="pr-label">About {profile.name.trim()}</div>
              <h2 className="pr-sec-title">
                A presence<br /><em>you won&apos;t forget.</em>
              </h2>
              <p className="pr-bio">{profile.bio}</p>
              {profile.publicTags.length > 0 && (
                <p className="pr-curated">
                  {profile.publicTags.join(' · ')}
                </p>
              )}
            </div>
            <div className="pr-presence-right">
              <p className="pr-presence-quote">
                &ldquo;The kind of presence that makes the rest of the city disappear.&rdquo;
              </p>
            </div>
          </div>
        </>
      )}

      {/* ══ 3. TRUST ══ */}
      <div className="pr-trust-section">
        <div className="pr-trust-inner">
          <div className="pr-trust-item">
            <div className="pr-trust-mark">✓ Verified</div>
            <div className="pr-trust-title">Personally met</div>
            <div className="pr-trust-desc">Identity confirmed in person by our team.</div>
          </div>
          <div className="pr-trust-item">
            <div className="pr-trust-mark">◎ Authentic</div>
            <div className="pr-trust-title">Genuine photos</div>
            <div className="pr-trust-desc">What you see is exactly who you meet.</div>
          </div>
          {profile.isExclusive && (
            <div className="pr-trust-item">
              <div className="pr-trust-mark">◈ Exclusive</div>
              <div className="pr-trust-title">Only at Vaurel</div>
              <div className="pr-trust-desc">Not listed elsewhere. Introductions through us only.</div>
            </div>
          )}
          <div className="pr-trust-item">
            <div className="pr-trust-mark">◷ Responsive</div>
            <div className="pr-trust-title">15-min reply</div>
            <div className="pr-trust-desc">Our team responds personally, around the clock.</div>
          </div>
        </div>
      </div>

      {/* ══ 4. RATES ══ */}
      {profile.rates.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Arrangements</div>
            <h2 className="pr-sec-title">Time &amp; <em>rates</em></h2>

            {profile.lowestPrice && (
              <div className="pr-rates-anchor">
                <div className="pr-rates-from">From</div>
                <div className="pr-rates-val">
                  £{profile.lowestPrice.toLocaleString('en-GB')}
                  <span>/ hour</span>
                </div>
                <div className="pr-rates-sub">Private arrangements in London and beyond.</div>
              </div>
            )}

            <table className="pr-rates-table">
              <thead>
                <tr>
                  <th>Duration</th>
                  <th>Incall</th>
                  <th>Outcall</th>
                </tr>
              </thead>
              <tbody>
                {profile.rates.map((row) => (
                  <tr key={row.durationType ?? row.label}>
                    <td>{row.label}</td>
                    <td>{row.incall != null ? `£${Number(row.incall).toLocaleString('en-GB')}` : '—'}</td>
                    <td>{row.outcall != null ? `£${Number(row.outcall).toLocaleString('en-GB')}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {extraServices.length > 0 && (
              <div className="pr-extras-row">
                <span className="pr-extras-lbl">Extras</span>
                {extraServices.map((svc) => (
                  <div key={svc.serviceId} className="pr-extra-item">
                    <span className="pr-extra-name">{svc.name}</span>
                    <span className="pr-extra-price">+£{svc.extraPrice}</span>
                  </div>
                ))}
              </div>
            )}

            {profile.paymentMethods.length > 0 && (
              <div className="pr-pay-row">
                <span className="pr-pay-lbl">Payment</span>
                <div className="pr-pay-methods">
                  {profile.paymentMethods.map((m) => (
                    <span key={m} className="pr-pay-item">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ 5. ENQUIRE + FORM ══ */}
      <div className="pr-enquire-section" id="pr-enquire">
        <div className="pr-enq-top">
          <div className="pr-label pr-label-center">Private enquiry</div>
          <h2 className="pr-enq-title">
            Arrange a<br /><em>private meeting.</em>
          </h2>
          <p className="pr-enq-sub">Our team responds within 15 minutes · 24/7</p>
          <div className="pr-enq-btns">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-wa">
              Arrange via WhatsApp
            </a>
            <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-tg">
              Arrange via Telegram
            </a>
          </div>
          <p className="pr-enq-note">All enquiries handled with complete discretion.</p>
        </div>
        <div className="pr-form-wrap">
          <ProfileEnquiryForm
            companionName={profile.name}
            rates={profile.rates}
          />
        </div>
      </div>

      {/* ══ 6. DETAILS ══ */}
      {profile.stats && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Profile</div>
            <div className="pr-details-grid">
              <div className="pr-detail-group">
                <div className="pr-detail-t">Physical</div>
                {profile.stats.age && <div className="pr-stat-row"><span>Age</span><span>{profile.stats.age}</span></div>}
                {profile.stats.height && <div className="pr-stat-row"><span>Height</span><span>{profile.stats.height} cm</span></div>}
                {profile.stats.weight && <div className="pr-stat-row"><span>Weight</span><span>{profile.stats.weight} kg</span></div>}
                {profile.stats.bustSize && (
                  <div className="pr-stat-row">
                    <span>Bust</span>
                    <span>{profile.stats.bustSize}{profile.stats.bustType ? ` ${profile.stats.bustType}` : ''}</span>
                  </div>
                )}
                {profile.stats.dressSize && <div className="pr-stat-row"><span>Dress</span><span>{profile.stats.dressSize}</span></div>}
                {profile.stats.eyeColour && <div className="pr-stat-row"><span>Eyes</span><span>{profile.stats.eyeColour}</span></div>}
                {profile.stats.hairColour && <div className="pr-stat-row"><span>Hair</span><span>{profile.stats.hairColour}</span></div>}
                {profile.stats.tattooStatus && <div className="pr-stat-row"><span>Tattoos</span><span>{profile.stats.tattooStatus}</span></div>}
              </div>
              <div className="pr-detail-group">
                <div className="pr-detail-t">Background</div>
                {profile.stats.nationality && <div className="pr-stat-row"><span>Nationality</span><span>{profile.stats.nationality}</span></div>}
                {profile.ethnicity && <div className="pr-stat-row"><span>Ethnicity</span><span>{profile.ethnicity}</span></div>}
                {profile.stats.orientation && <div className="pr-stat-row"><span>Orientation</span><span>{profile.stats.orientation}</span></div>}
                {profile.stats.smokingStatus && <div className="pr-stat-row"><span>Smoking</span><span>{profile.stats.smokingStatus}</span></div>}
              </div>
              <div className="pr-detail-group">
                <div className="pr-detail-t">Location & Travel</div>
                {profile.districts.length > 0 && (
                  <div className="pr-stat-row"><span>Based</span><span>{profile.districts.map((d) => d.name).join(' · ')}</span></div>
                )}
                {profile.nearestStation && <div className="pr-stat-row"><span>Station</span><span>{profile.nearestStation}</span></div>}
                {profile.travel && <div className="pr-stat-row"><span>Travel</span><span>{profile.travel}</span></div>}
                {profile.stats.languages && profile.stats.languages.length > 0 && (
                  <div className="pr-stat-row"><span>Languages</span><span>{profile.stats.languages.join(' · ')}</span></div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ 7. SERVICES ══ */}
      {regularServices.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section pr-section-bg">
            <div className="pr-label">Experiences</div>
            <h2 className="pr-sec-title">What she <em>offers</em></h2>
            <p className="pr-svc-intro">
              A refined and open-minded experience, tailored personally to you.
              From relaxed companionship to more adventurous dynamics.
            </p>
            <div className="pr-svc-grid">
              {categoryOrder
                .filter(cat => serviceGroups[cat]?.length > 0)
                .map(cat => (
                  <div key={cat} className="pr-svc-group">
                    <div className="pr-svc-gname">{categoryLabels[cat] || cat}</div>
                    {serviceGroups[cat].map((svc) => (
                      svc.slug ? (
                        <Link key={svc.serviceId} href={`/services/${svc.slug}`} className="pr-svc-item" style={{ textDecoration: 'none' }}>
                          {svc.name}
                        </Link>
                      ) : (
                        <div key={svc.serviceId} className="pr-svc-item">{svc.name}</div>
                      )
                    ))}
                  </div>
                ))}
            </div>
            <p className="pr-svc-note">
              All arrangements are for companionship only. Activities between consenting adults are a matter of personal choice.
            </p>
          </div>
        </>
      )}

      {/* ══ 8. WARDROBE ══ */}
      {profile.wardrobe.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Wardrobe</div>
            <h2 className="pr-sec-title">She arrives <em>dressed for you.</em></h2>
            <p className="pr-ward-intro">Every detail can be styled to match the mood of your evening.</p>
            <div className="pr-ward-list">
              {profile.wardrobe.map((item) => (
                <span key={item} className="pr-ward-item">{item}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══ 9. AVAILABILITY ══ */}
      {profile.availability === 'Available Now' && (
        <>
          <hr className="pr-div" />
          <div className="pr-section pr-section-bg2">
            <div className="pr-label">Availability</div>
            <div className="pr-avail-status">
              <span className="pr-avail-dot pr-avail-dot-lg" />
              <span className="pr-avail-status-text">Available now</span>
            </div>
          </div>
        </>
      )}

      {/* ══ 10. DISCOVER ══ */}
      {similarModels.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Also available</div>
            <h2 className="pr-sec-title">Discover <em>others</em></h2>
            <div className="pr-disc-grid">
              {similarModels.map((sim: any) => {
                const simPhoto = sim.media[0]?.url ?? null
                const simRate = sim.modelRates?.[0]?.price
                  ? Number(sim.modelRates[0].price)
                  : null
                return (
                  <ModelCard
                    key={sim.id}
                    name={sim.name}
                    slug={sim.slug}
                    nationality={sim.stats?.nationality ?? null}
                    coverPhotoUrl={simPhoto}
                    availability={sim.availability}
                    districtName={null}
                    minIncallPrice={simRate}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* SEO links */}
      {(profile.districts.length > 0 || profile.categories.length > 0) && (
        <div className="profile-seo-links">
          {profile.districts.length > 0 && (
            <div>
              <p>Available in:</p>
              {profile.districts.map((d) => (
                <Link key={d.slug} href={`/london/${d.slug}-escorts`}>
                  Escorts in {d.name}
                </Link>
              ))}
            </div>
          )}
          {profile.categories.length > 0 && (
            <div>
              <p>Categories:</p>
              {profile.categories.map((c) => (
                <Link key={c.slug} href={`/categories/${c.slug}`}>
                  {c.name} Escorts London
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Bar */}
      <ProfileStickyBar
        name={profile.name}
        lowestPrice={profile.lowestPrice}
        availability={profile.availability}
        waUrl={waUrl}
        tgUrl={tgUrl}
      />
    </div>
  )
}
