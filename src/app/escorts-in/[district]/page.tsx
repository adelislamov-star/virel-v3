// @ts-nocheck
export const revalidate = 3600
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import './district.css'

const DISTRICTS: Record<string, { title: string; h1: string; description: string; content: string }> = {
  'mayfair': { title: 'Escorts in Mayfair | Elite Companions', h1: 'Escorts in Mayfair', description: 'Elite companion services in Mayfair, London\'s most prestigious district. Verified, sophisticated companions for incall and outcall.', content: 'Mayfair is synonymous with luxury and exclusivity. Home to some of London\'s finest hotels, restaurants, and private residences, it\'s the perfect setting for an unforgettable experience with one of our premium companions.\n\nOur Mayfair escorts are carefully selected for their sophistication, elegance, and professionalism. Whether you\'re staying at The Dorchester, Claridge\'s, or The Connaught, our companions are perfectly suited to match the surroundings.' },
  'kensington': { title: 'Escorts in Kensington | Premium Companions', h1: 'Escorts in Kensington', description: 'Premium companion services in Kensington. Elegant, discreet escorts near the Royal Palace and museums.', content: 'Kensington offers a refined blend of culture, elegance, and sophistication. With world-class museums, beautiful gardens, and prestigious addresses, it\'s an ideal backdrop for our premium companion services.\n\nOur Kensington escorts embody the grace and refinement this distinguished neighbourhood is known for — perfect for cultural outings, fine dining, or private evenings.' },
  'knightsbridge': { title: 'Escorts in Knightsbridge | Luxury Companions', h1: 'Escorts in Knightsbridge', description: 'Luxury companion services in Knightsbridge. Home to Harrods and premium hotels — our escorts reflect the area\'s exclusivity.', content: 'Knightsbridge is home to Harrods, Harvey Nichols, and some of London\'s most exclusive hotels. Our companions in Knightsbridge are as luxurious as the surroundings — impeccably presented and utterly discreet.\n\nWith the Mandarin Oriental, The Berkeley, and other world-class hotels within steps, our Knightsbridge escorts are experienced in delivering exceptional service at the highest level.' },
  'chelsea': { title: 'Escorts in Chelsea | Elegant Companions', h1: 'Escorts in Chelsea', description: 'Elegant companion services in Chelsea. Stylish, sophisticated escorts for incall and outcall.', content: 'Chelsea\'s artistic heritage and vibrant atmosphere attract some of London\'s most cultured residents and visitors. Our Chelsea companions share this energy — creative, stylish, and deeply engaging.\n\nFrom the boutiques of King\'s Road to the acclaimed restaurants of Sloane Square, Chelsea is the perfect setting for an unforgettable experience with one of our elite companions.' },
  'belgravia': { title: 'Escorts in Belgravia | Elite Companions', h1: 'Escorts in Belgravia', description: 'Elite companion services in Belgravia, one of London\'s most exclusive addresses. Discreet, professional escorts.', content: 'Belgravia\'s white stucco townhouses and garden squares define London\'s most exclusive residential area. Our Belgravia companions match the neighbourhood\'s understated luxury — refined, discreet, and impeccable.\n\nHome to embassies, luxury hotels, and private residences, Belgravia demands the highest standards — which our companions consistently deliver.' },
  'marylebone': { title: 'Escorts in Marylebone | Premium Companions', h1: 'Escorts in Marylebone', description: 'Premium escort services in Marylebone. Sophisticated companions in this charming London village district.', content: 'Marylebone\'s village-like atmosphere combined with its central location makes it one of London\'s most desirable areas. Our companions here are warm, engaging, and perfectly suited to the neighbourhood\'s unique character.\n\nFrom the renowned restaurants of Marylebone High Street to the nearby Regent\'s Park, our escorts are ideal partners for exploring this wonderful area.' },
  'westminster': { title: 'Escorts in Westminster | Discreet Companions', h1: 'Escorts in Westminster', description: 'Discreet companion services in Westminster. Professional escorts for business and leisure near Buckingham Palace.', content: 'Westminster is the heart of London — political, historical, and iconic. Our Westminster companions are professionals who understand that discretion is paramount in this prominent district.\n\nWith Parliament, Buckingham Palace, and Westminster Abbey nearby, and excellent hotels throughout, Westminster provides a prestigious backdrop for premium companionship.' },
  'soho': { title: 'Escorts in Soho | Vibrant Companions', h1: 'Escorts in Soho', description: 'Dynamic companion services in Soho, London\'s entertainment hub. Lively, engaging escorts for evenings out.', content: 'Soho\'s energy is unmatched — a buzzing mix of restaurants, bars, theatres, and clubs. Our Soho companions are vivacious, fun, and perfect for an evening exploring London\'s most exciting neighbourhood.\n\nFrom pre-theatre dining to late-night cocktails, Soho\'s density of world-class entertainment makes it the perfect setting for a vibrant evening with one of our companions.' },
  'canary-wharf': { title: 'Escorts in Canary Wharf | Business Companions', h1: 'Escorts in Canary Wharf', description: 'Professional companion services in Canary Wharf. Sophisticated escorts for business travellers and city professionals.', content: 'Canary Wharf attracts the world\'s leading finance professionals and business travellers. Our companions here understand the demands of a professional lifestyle — punctual, polished, and perfect for corporate entertaining.\n\nWith world-class restaurants, luxury hotels, and stunning riverside views, Canary Wharf provides an exceptional setting for premium companionship.' },
  'notting-hill': { title: 'Escorts in Notting Hill | Stylish Companions', h1: 'Escorts in Notting Hill', description: 'Stylish companion services in Notting Hill. Fashionable, creative escorts in this colourful neighbourhood.', content: 'Notting Hill\'s bohemian charm, colourful houses, and famous market create a unique atmosphere unlike anywhere else in London. Our companions here reflect the area\'s creative, cosmopolitan spirit.\n\nFrom Portobello Road Market to the acclaimed restaurants of Westbourne Grove, Notting Hill offers a wealth of experiences to share with our companions.' },
  'paddington': { title: 'Escorts in Paddington | Premium Companions', h1: 'Escorts in Paddington', description: 'Professional companion services in Paddington. Discreet escorts near major hotels and transport links.', content: 'Paddington\'s excellent transport links and concentration of business hotels make it an ideal location for visitors from across the UK and internationally. Our Paddington companions are professional, discreet, and available at hotels throughout the area.\n\nWith Little Venice nearby and easy access to Hyde Park and Bayswater, Paddington offers both practicality and beauty.' },
  'victoria': { title: 'Escorts in Victoria | Premium Companions', h1: 'Escorts in Victoria', description: 'Premium companion services in Victoria. Discreet escorts near Victoria Station and Buckingham Palace.', content: 'Victoria\'s central location — a short walk from Buckingham Palace, Westminster, and Belgravia — makes it one of London\'s most convenient destinations. Our Victoria companions are professional and discreet.\n\nWith major hotels including the Goring and Sofitel, and excellent connections across London, Victoria provides practical and prestigious settings for our companion services.' },
  'south-kensington': { title: 'Escorts in South Kensington | Premium Companions', h1: 'Escorts in South Kensington', description: 'Premium companion services in South Kensington. Cultured escorts near world-class museums and restaurants.', content: 'South Kensington\'s Museum Quarter — home to the V&A, Natural History Museum, and Science Museum — makes it one of London\'s most culturally rich neighbourhoods. Our companions here are sophisticated and well-travelled.\n\nWith exceptional restaurants along Old Brompton Road and beautiful garden squares, South Kensington provides a refined and cultured backdrop.' },
  'marble-arch': { title: 'Escorts in Marble Arch | Premium Companions', h1: 'Escorts in Marble Arch', description: 'Premium companion services in Marble Arch. Elegant escorts near Hyde Park and Oxford Street.', content: 'Marble Arch marks the northeastern corner of Hyde Park, positioned between the luxury of Park Lane and the shopping of Oxford Street. Our Marble Arch companions are sophisticated and versatile.\n\nWith the Dorchester and other Park Lane hotels nearby, and Hyde Park providing a beautiful green backdrop, Marble Arch is an excellent location for a premium experience.' },
  'gloucester-road': { title: 'Escorts in Gloucester Road | Premium Companions', h1: 'Escorts in Gloucester Road', description: 'Elegant companion services in Gloucester Road. Sophisticated escorts in this upscale Kensington area.', content: 'Gloucester Road sits in the heart of upscale South Kensington, surrounded by cultural institutions, beautiful gardens, and fine dining. Our companions here are cultured and sophisticated.\n\nWith the Natural History Museum, Victoria and Albert Museum, and Hyde Park all nearby, Gloucester Road provides an exceptional cultural backdrop for premium companionship.' },
}

const ALL_DISTRICT_SLUGS = Object.keys(DISTRICTS)

interface Props { params: { district: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = DISTRICTS[params.district]
  if (!info) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: info.title,
    description: info.description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${siteConfig.domain}/london/${params.district}-escorts` },
    openGraph: { title: info.title, description: info.description },
  }
}

export default async function DistrictPage({ params }: Props) {
  const info = DISTRICTS[params.district]
  if (!info) notFound()

  const districtName = params.district
    .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const location = await prisma.location.findFirst({
    where: { slug: params.district, status: 'active' },
  }).catch(() => null)

  const models = await prisma.model.findMany({
    where: {
      status: 'active',
      
      deletedAt: null,
      ...(location ? { primaryLocationId: location.id } : {}),
    },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  }).catch(() => [])

  // Fetch minimum prices for district models
  let minPrices: Record<string, number> = {}
  try {
    const modelIds = models.map((m: any) => m.id)
    if (modelIds.length > 0) {
      const rates: any[] = await prisma.$queryRaw`
        SELECT model_id, MIN(price) as min_price
        FROM model_rates
        WHERE model_id = ANY(${modelIds}::text[])
          AND is_active = true
          AND price > 0
        GROUP BY model_id
      `
      for (const r of rates) {
        minPrices[r.model_id] = Number(r.min_price)
      }
    }
  } catch (e) {}

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: info.h1,
        description: info.description,
        areaServed: { '@type': 'Place', name: `${districtName}, London, United Kingdom` },
        provider: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.domain },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
          { '@type': 'ListItem', position: 2, name: 'London Escorts', item: `${siteConfig.domain}/companions` },
          { '@type': 'ListItem', position: 3, name: info.h1, item: `${siteConfig.domain}/escorts-in/${params.district}` },
        ],
      },
    ],
  }

  const otherDistricts = ALL_DISTRICT_SLUGS.filter(d => d !== params.district).slice(0, 9)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <div className="district-root">
        <Header />

        <div className="d-breadcrumb">
          <Link href="/">HOME</Link>
          <span className="d-sep">—</span>
          <Link href="/companions">COMPANIONS</Link>
          <span className="d-sep">—</span>
          <span style={{ color: '#c9a84c' }}>{info.h1.toUpperCase()}</span>
        </div>

        {/* Hero */}
        <div className="district-hero" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <span className="d-eyebrow">London Escorts</span>
          <h1 className="d-title">
            {info.h1.replace('Escorts in ', 'Escorts in\u00A0')}
          </h1>
          <p className="d-desc">{info.description}</p>
        </div>

        {/* Models */}
        {models.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 0 }}>
            <div className="d-section" style={{ paddingBottom: 0 }}>
              <span className="d-section-label">Available Now in {districtName}</span>
            </div>
            <div className="d-models-grid">
              {models.map((model: any) => {
                const photo = model.media[0]?.url
                return (
                  <Link key={model.id} href={`/companions/${model.slug}`} className="d-card">
                    {photo
                      ? <Image fill src={photo} alt={model.name} style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 50vw, 25vw" />
                      : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#111',color:'#2a2520',fontSize:40 }}>◈</div>
                    }
                    <div className="d-card-overlay" />
                    <div className="d-card-content">
                      <p className="d-card-name">{model.name}</p>
                      <p className="d-card-meta">{[model.stats?.age && `${model.stats.age} yrs`, model.stats?.nationality].filter(Boolean).join('  ·  ')}</p>
                      {minPrices[model.id] && (
                        <p style={{ fontSize: 13, letterSpacing: '.05em', textTransform: 'uppercase', color: '#C5A572', margin: '8px 0 0' }}>
                          From £{minPrices[model.id].toLocaleString(siteConfig.lang)}/hr
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
            {models.length === 0 && (
              <div className="d-section" style={{ textAlign: 'center' }}>
                <Link href="/companions" style={{ fontSize: 12, letterSpacing: '.12em', color: '#c9a84c', textDecoration: 'none', textTransform: 'uppercase' }}>
                  Browse All Companions →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="d-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="d-section-label">About {districtName}</span>
          <div className="d-content">
            {info.content.split('\n\n').map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="d-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 60 }}>
          <span className="d-section-label">FAQ</span>
          <div className="d-faq" style={{ maxWidth: 720 }}>
            {[
              { q: `How do I book an escort in ${districtName}?`, a: `Browse our available companions above, select your preferred escort, and submit a booking request via the profile page. We confirm within 30 minutes.` },
              { q: `Are escorts in ${districtName} available for outcall?`, a: `Yes, most of our companions offer both incall and outcall services in ${districtName} and surrounding London areas.` },
              { q: `Is the service discreet in ${districtName}?`, a: `Absolutely. All communications and bookings are handled with complete confidentiality. We never share client information with any third party.` },
              { q: `What are the rates for escorts in ${districtName}?`, a: `Rates vary by companion and duration. Typically from £250 for 30 minutes. Full rates are listed on each companion's profile page.` },
            ].map((faq, i) => (
              <details key={i}>
                <summary>{faq.q}</summary>
                <div className="faq-answer">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Other districts */}
        <div className="d-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="d-section-label">Other London Areas</span>
          <div className="d-other-grid">
            {otherDistricts.map(d => {
              const name = d.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              return (
                <Link key={d} href={`/escorts-in/${d}`} className="d-other-link">
                  <span className="d-other-name">Escorts in {name}</span>
                  <span className="d-other-arrow">→</span>
                </Link>
              )
            })}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
