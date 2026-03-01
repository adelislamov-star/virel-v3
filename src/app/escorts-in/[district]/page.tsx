// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

const DISTRICTS: Record<string, { title: string; h1: string; description: string; content: string }> = {
  'mayfair': { title: 'Escorts in Mayfair | Elite Companions | Virel', h1: 'Escorts in Mayfair', description: 'Elite companion services in Mayfair, London\'s most prestigious district. Verified, sophisticated companions for incall and outcall.', content: 'Mayfair is synonymous with luxury and exclusivity. Home to some of London\'s finest hotels, restaurants, and private residences, it\'s the perfect setting for an unforgettable experience with one of our premium companions.\n\nOur Mayfair escorts are carefully selected for their sophistication, elegance, and professionalism. Whether you\'re staying at The Dorchester, Claridge\'s, or The Connaught, our companions are perfectly suited to match the surroundings.' },
  'kensington': { title: 'Escorts in Kensington | Premium Companions | Virel', h1: 'Escorts in Kensington', description: 'Premium companion services in Kensington. Elegant, discreet escorts near the Royal Palace and museums.', content: 'Kensington offers a refined blend of culture, elegance, and sophistication. With world-class museums, beautiful gardens, and prestigious addresses, it\'s an ideal backdrop for our premium companion services.\n\nOur Kensington escorts embody the grace and refinement this distinguished neighbourhood is known for — perfect for cultural outings, fine dining, or private evenings.' },
  'knightsbridge': { title: 'Escorts in Knightsbridge | Luxury Companions | Virel', h1: 'Escorts in Knightsbridge', description: 'Luxury companion services in Knightsbridge. Home to Harrods and premium hotels — our escorts reflect the area\'s exclusivity.', content: 'Knightsbridge is home to Harrods, Harvey Nichols, and some of London\'s most exclusive hotels. Our companions in Knightsbridge are as luxurious as the surroundings — impeccably presented and utterly discreet.\n\nWith the Mandarin Oriental, The Berkeley, and other world-class hotels within steps, our Knightsbridge escorts are experienced in delivering exceptional service at the highest level.' },
  'chelsea': { title: 'Escorts in Chelsea | Elegant Companions | Virel', h1: 'Escorts in Chelsea', description: 'Elegant companion services in Chelsea. Stylish, sophisticated escorts for incall and outcall.', content: 'Chelsea\'s artistic heritage and vibrant atmosphere attract some of London\'s most cultured residents and visitors. Our Chelsea companions share this energy — creative, stylish, and deeply engaging.\n\nFrom the boutiques of King\'s Road to the acclaimed restaurants of Sloane Square, Chelsea is the perfect setting for an unforgettable experience with one of our elite companions.' },
  'belgravia': { title: 'Escorts in Belgravia | Elite Companions | Virel', h1: 'Escorts in Belgravia', description: 'Elite companion services in Belgravia, one of London\'s most exclusive addresses. Discreet, professional escorts.', content: 'Belgravia\'s white stucco townhouses and garden squares define London\'s most exclusive residential area. Our Belgravia companions match the neighbourhood\'s understated luxury — refined, discreet, and impeccable.\n\nHome to embassies, luxury hotels, and private residences, Belgravia demands the highest standards — which our companions consistently deliver.' },
  'marylebone': { title: 'Escorts in Marylebone | Premium Companions | Virel', h1: 'Escorts in Marylebone', description: 'Premium escort services in Marylebone. Sophisticated companions in this charming London village district.', content: 'Marylebone\'s village-like atmosphere combined with its central location makes it one of London\'s most desirable areas. Our companions here are warm, engaging, and perfectly suited to the neighbourhood\'s unique character.\n\nFrom the renowned restaurants of Marylebone High Street to the nearby Regent\'s Park, our escorts are ideal partners for exploring this wonderful area.' },
  'westminster': { title: 'Escorts in Westminster | Discreet Companions | Virel', h1: 'Escorts in Westminster', description: 'Discreet companion services in Westminster. Professional escorts for business and leisure near Buckingham Palace.', content: 'Westminster is the heart of London — political, historical, and iconic. Our Westminster companions are professionals who understand that discretion is paramount in this prominent district.\n\nWith Parliament, Buckingham Palace, and Westminster Abbey nearby, and excellent hotels throughout, Westminster provides a prestigious backdrop for premium companionship.' },
  'soho': { title: 'Escorts in Soho | Vibrant Companions | Virel', h1: 'Escorts in Soho', description: 'Dynamic companion services in Soho, London\'s entertainment hub. Lively, engaging escorts for evenings out.', content: 'Soho\'s energy is unmatched — a buzzing mix of restaurants, bars, theatres, and clubs. Our Soho companions are vivacious, fun, and perfect for an evening exploring London\'s most exciting neighbourhood.\n\nFrom pre-theatre dining to late-night cocktails, Soho\'s density of world-class entertainment makes it the perfect setting for a vibrant evening with one of our companions.' },
  'canary-wharf': { title: 'Escorts in Canary Wharf | Business Companions | Virel', h1: 'Escorts in Canary Wharf', description: 'Professional companion services in Canary Wharf. Sophisticated escorts for business travellers and city professionals.', content: 'Canary Wharf attracts the world\'s leading finance professionals and business travellers. Our companions here understand the demands of a professional lifestyle — punctual, polished, and perfect for corporate entertaining.\n\nWith world-class restaurants, luxury hotels, and stunning riverside views, Canary Wharf provides an exceptional setting for premium companionship.' },
  'notting-hill': { title: 'Escorts in Notting Hill | Stylish Companions | Virel', h1: 'Escorts in Notting Hill', description: 'Stylish companion services in Notting Hill. Fashionable, creative escorts in this colourful neighbourhood.', content: 'Notting Hill\'s bohemian charm, colourful houses, and famous market create a unique atmosphere unlike anywhere else in London. Our companions here reflect the area\'s creative, cosmopolitan spirit.\n\nFrom Portobello Road Market to the acclaimed restaurants of Westbourne Grove, Notting Hill offers a wealth of experiences to share with our companions.' },
  'paddington': { title: 'Escorts in Paddington | Premium Companions | Virel', h1: 'Escorts in Paddington', description: 'Professional companion services in Paddington. Discreet escorts near major hotels and transport links.', content: 'Paddington\'s excellent transport links and concentration of business hotels make it an ideal location for visitors from across the UK and internationally. Our Paddington companions are professional, discreet, and available at hotels throughout the area.\n\nWith Little Venice nearby and easy access to Hyde Park and Bayswater, Paddington offers both practicality and beauty.' },
  'victoria': { title: 'Escorts in Victoria | Premium Companions | Virel', h1: 'Escorts in Victoria', description: 'Premium companion services in Victoria. Discreet escorts near Victoria Station and Buckingham Palace.', content: 'Victoria\'s central location — a short walk from Buckingham Palace, Westminster, and Belgravia — makes it one of London\'s most convenient destinations. Our Victoria companions are professional and discreet.\n\nWith major hotels including the Goring and Sofitel, and excellent connections across London, Victoria provides practical and prestigious settings for our companion services.' },
  'south-kensington': { title: 'Escorts in South Kensington | Premium Companions | Virel', h1: 'Escorts in South Kensington', description: 'Premium companion services in South Kensington. Cultured escorts near world-class museums and restaurants.', content: 'South Kensington\'s Museum Quarter — home to the V&A, Natural History Museum, and Science Museum — makes it one of London\'s most culturally rich neighbourhoods. Our companions here are sophisticated and well-travelled.\n\nWith exceptional restaurants along Old Brompton Road and beautiful garden squares, South Kensington provides a refined and cultured backdrop.' },
  'marble-arch': { title: 'Escorts in Marble Arch | Premium Companions | Virel', h1: 'Escorts in Marble Arch', description: 'Premium companion services in Marble Arch. Elegant escorts near Hyde Park and Oxford Street.', content: 'Marble Arch marks the northeastern corner of Hyde Park, positioned between the luxury of Park Lane and the shopping of Oxford Street. Our Marble Arch companions are sophisticated and versatile.\n\nWith the Dorchester and other Park Lane hotels nearby, and Hyde Park providing a beautiful green backdrop, Marble Arch is an excellent location for a premium experience.' },
  'gloucester-road': { title: 'Escorts in Gloucester Road | Premium Companions | Virel', h1: 'Escorts in Gloucester Road', description: 'Elegant companion services in Gloucester Road. Sophisticated escorts in this upscale Kensington area.', content: 'Gloucester Road sits in the heart of upscale South Kensington, surrounded by cultural institutions, beautiful gardens, and fine dining. Our companions here are cultured and sophisticated.\n\nWith the Natural History Museum, Victoria and Albert Museum, and Hyde Park all nearby, Gloucester Road provides an exceptional cultural backdrop for premium companionship.' },
}

const ALL_DISTRICT_SLUGS = Object.keys(DISTRICTS)

interface Props { params: { district: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = DISTRICTS[params.district]
  if (!info) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: info.title,
    description: info.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://virel-v3.vercel.app/escorts-in/${params.district}` },
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
      visibility: 'public',
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

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: info.h1,
        description: info.description,
        areaServed: { '@type': 'Place', name: `${districtName}, London, United Kingdom` },
        provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'London Escorts', item: 'https://virel-v3.vercel.app/london-escorts' },
          { '@type': 'ListItem', position: 3, name: info.h1, item: `https://virel-v3.vercel.app/escorts-in/${params.district}` },
        ],
      },
    ],
  }

  const otherDistricts = ALL_DISTRICT_SLUGS.filter(d => d !== params.district).slice(0, 9)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .district-root { font-family: 'DM Sans', sans-serif; background: #080808; color: #ddd5c8; min-height: 100vh; }

        .district-hero { padding: 80px 40px 60px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .d-eyebrow { font-size: 10px; letter-spacing: .25em; color: #c9a84c; text-transform: uppercase; display: block; margin-bottom: 16px; }
        .d-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px,6vw,72px); font-weight: 300; color: #f0e8dc; margin: 0 0 16px; line-height: 1.05; }
        .d-title em { font-style: italic; color: #c9a84c; }
        .d-desc { font-size: 14px; color: #6b6560; max-width: 560px; line-height: 1.9; margin: 0; }

        .d-section { max-width: 1280px; margin: 0 auto; padding: 60px 40px; }
        .d-section-label { font-size: 10px; letter-spacing: .2em; color: #c9a84c; text-transform: uppercase; margin-bottom: 32px; display: block; }

        .d-models-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; background: rgba(255,255,255,0.03); }
        @media(max-width:900px){.d-models-grid{grid-template-columns:repeat(2,1fr);}}
        .d-card { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #111; display: block; text-decoration: none; }
        .d-card img { width:100%; height:100%; object-fit:cover; transition: transform .8s cubic-bezier(.25,.46,.45,.94); }
        .d-card:hover img { transform: scale(1.06); }
        .d-card-overlay { position:absolute; inset:0; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, transparent 55%); }
        .d-card-content { position:absolute; bottom:0; left:0; right:0; padding:24px 20px; }
        .d-card-name { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:300; color:#fff; margin:0 0 4px; }
        .d-card-meta { font-size:10px; letter-spacing:.1em; color:rgba(255,255,255,0.4); text-transform:uppercase; }

        .d-content p { font-size: 14px; color: #6b6560; line-height: 2; margin-bottom: 20px; max-width: 720px; }

        .d-faq details { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .d-faq summary { padding: 20px 0; cursor: pointer; font-size: 15px; color: #ddd5c8; list-style: none; display: flex; justify-content: space-between; align-items: center; }
        .d-faq summary::after { content: '+'; color: #c9a84c; font-size: 20px; font-weight: 300; transition: transform .2s; }
        .d-faq details[open] summary::after { transform: rotate(45deg); }
        .d-faq .faq-answer { padding: 0 0 20px; font-size: 13px; color: #6b6560; line-height: 1.9; }

        .d-other-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); }
        @media(max-width:700px){.d-other-grid{grid-template-columns:1fr 1fr;}}
        .d-other-link { background: #080808; padding: 22px 20px; text-decoration: none; display: flex; justify-content: space-between; align-items: center; transition: background .2s; }
        .d-other-link:hover { background: #0f0e0c; }
        .d-other-name { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:300; color:#9a9189; }
        .d-other-link:hover .d-other-name { color: #ddd5c8; }
        .d-other-arrow { color: #2a2520; font-size:14px; }
        .d-other-link:hover .d-other-arrow { color: #c9a84c; }

        .d-breadcrumb { font-size:11px; letter-spacing:.1em; color:#3a3530; padding: 20px 40px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .d-breadcrumb a { color:#3a3530; text-decoration:none; }
        .d-breadcrumb a:hover { color:#c9a84c; }
        .d-sep { margin: 0 12px; }
      `}</style>

      <div className="district-root">
        <Header />

        <div className="d-breadcrumb">
          <Link href="/">HOME</Link>
          <span className="d-sep">—</span>
          <Link href="/london-escorts">COMPANIONS</Link>
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
                  <Link key={model.id} href={`/catalog/${model.slug}`} className="d-card">
                    {photo
                      ? <img src={photo} alt={model.name} loading="lazy" />
                      : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#111',color:'#2a2520',fontSize:40 }}>◈</div>
                    }
                    <div className="d-card-overlay" />
                    <div className="d-card-content">
                      <p className="d-card-name">{model.name}</p>
                      <p className="d-card-meta">{[model.stats?.age && `${model.stats.age} yrs`, model.stats?.nationality].filter(Boolean).join('  ·  ')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
            {models.length === 0 && (
              <div className="d-section" style={{ textAlign: 'center' }}>
                <Link href="/london-escorts" style={{ fontSize: 12, letterSpacing: '.12em', color: '#c9a84c', textDecoration: 'none', textTransform: 'uppercase' }}>
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
