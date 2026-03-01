// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

const CATEGORY_LABELS: Record<string, string> = {
  classic: 'Classic Services', massage: 'Massage Services', bdsm: 'BDSM & Domination',
  fetish: 'Fetish & Fantasy', entertainment: 'Entertainment', companionship: 'Companionship',
}

const SERVICES: Record<string, { name: string; category: string; description: string; faqs: Array<[string, string]> }> = {
  'a-level': { name: 'A Level', category: 'classic', description: 'A-Level with selected London escorts. Available for incall and outcall across London.', faqs: [['How do I book A Level in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is A Level available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking A Level discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'ball-busting': { name: 'Ball Busting', category: 'bdsm', description: 'Controlled CBT sensation play with our London mistresses.', faqs: [['How do I book Ball Busting in London?', 'Browse our companions and submit a booking request. We confirm within 30 minutes.'], ['Is Ball Busting available for outcall?', 'Most services are available for both incall and outcall. Please confirm when booking.'], ['Is booking Ball Busting discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'body-to-body-massage': { name: 'Body to Body Massage', category: 'massage', description: 'Full body-to-body massage in London. Skin on skin contact using warm oils.', faqs: [['What is body-to-body massage?', 'A sensual full-body massage using warm oils with skin-on-skin contact from your companion.'], ['Is body-to-body massage available for outcall?', 'Primarily incall due to equipment, but please confirm availability.'], ['How do I book in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.']] },
  'bondage': { name: 'Bondage', category: 'bdsm', description: 'Rope, cuffs, and restraint play with our London escorts.', faqs: [['How do I book Bondage in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is Bondage available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking Bondage discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'caning': { name: 'Caning', category: 'bdsm', description: 'Classic impact play with a cane by our London mistresses.', faqs: [['How do I book Caning in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is Caning available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking Caning discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'cif': { name: 'CIF', category: 'classic', description: 'CIF available with selected London escorts. Please confirm when booking.', faqs: [['How do I book CIF in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is CIF available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking CIF discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'cim': { name: 'CIM', category: 'classic', description: 'CIM includes OWO. Available with selected London companions.', faqs: [['How do I book CIM in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is CIM available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking CIM discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'cob': { name: 'COB', category: 'classic', description: 'Come on body finish with our premium London escorts.', faqs: [['How do I book COB in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is COB available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking COB discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'couples': { name: 'Couples', category: 'companionship', description: 'Companion bookings for couples in London. Add a new dimension to your relationship.', faqs: [['How do I book for couples?', 'Browse companions and submit a booking request specifying couples. We confirm within 30 minutes.'], ['Is couples available for outcall?', 'Yes, available for both incall and outcall across London.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'cuckolding': { name: 'Cuckolding', category: 'fetish', description: 'Consensual cuckolding fantasy with our London escorts.', faqs: [['How do I book Cuckolding in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is Cuckolding available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking Cuckolding discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'deep-throat': { name: 'Deep Throat', category: 'classic', description: 'Deep throat oral with our experienced London companions.', faqs: [['How do I book Deep Throat in London?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is Deep Throat available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking Deep Throat discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'dfk': { name: 'DFK', category: 'classic', description: 'Deep French Kissing — the most intimate kiss, hallmark of the Girlfriend Experience.', faqs: [['What is DFK?', 'Deep French Kissing — passionate, intimate kissing that forms the cornerstone of the GFE experience.'], ['Is DFK available for outcall?', 'Yes, available for both incall and outcall across London.'], ['How do I book DFK?', 'Browse companions and submit a booking request. We confirm within 30 minutes.']] },
  'double-penetration': { name: 'Double Penetration', category: 'classic', description: 'Double penetration with selected London escorts. Please confirm when booking.', faqs: [['How do I book Double Penetration?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is this available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'filming-with-mask': { name: 'Filming with Mask', category: 'entertainment', description: 'Filming permitted with mask for privacy. Personal use only.', faqs: [['How do I book Filming with Mask?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Is this for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is this discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'fingering': { name: 'Fingering', category: 'classic', description: 'Manual stimulation available with all our London companions.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Yes, available for both incall and outcall across London.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'fisting-giving': { name: 'Fisting (Giving)', category: 'bdsm', description: 'Fisting by our experienced London companions.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'fk': { name: 'FK', category: 'classic', description: 'French Kissing — passionate and intimate with our London escorts.', faqs: [['What is FK?', 'French Kissing — intimate, passionate kissing with your companion.'], ['Available for outcall?', 'Yes, available for both incall and outcall across London.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'foot-fetish': { name: 'Foot Fetish', category: 'fetish', description: 'Worship, massage, and adore beautiful feet with our London companions.', faqs: [['How do I book Foot Fetish?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Yes, available for both incall and outcall.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'gfe': { name: 'GFE', category: 'classic', description: 'Girlfriend Experience in London — warmth, intimacy, affection and genuine connection.', faqs: [['What is the Girlfriend Experience (GFE)?', 'GFE creates a warm, intimate connection — affectionate conversation, kissing, and a natural dynamic similar to spending time with a partner.'], ['How long does a GFE booking last?', 'GFE bookings start from 1 hour. We recommend 2–3 hours to fully enjoy the experience.'], ['Is GFE available for outcall?', 'Yes, our GFE companions are available for both incall and outcall across London, including hotels.']] },
  'humiliation': { name: 'Humiliation', category: 'bdsm', description: 'Verbal and role-based humiliation with our London mistresses.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'incall': { name: 'Incall', category: 'companionship', description: 'Visit your companion at her private, discreet London location.', faqs: [['What is an incall booking?', 'You visit the companion at her private, discreet location in London. Her address is shared after confirmation.'], ['Is incall available across London?', 'Yes, our companions offer incall from locations across Central, West, and South London.'], ['How do I book incall?', 'Browse companions, specify incall in your request, and we confirm within 30 minutes.']] },
  'latex': { name: 'Latex', category: 'fetish', description: 'Companions in latex outfits — the iconic fetish look.', faqs: [['How do I book Latex?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'nuru-massage': { name: 'Nuru Massage', category: 'massage', description: 'Authentic Japanese Nuru massage using special ultra-slippery gel.', faqs: [['What is a Nuru massage?', 'A Japanese technique using special ultra-slippery gel for full body-to-body contact. Deeply sensual and relaxing.'], ['Available for outcall?', 'Primarily incall due to equipment. Please confirm when booking.'], ['How do I book Nuru massage?', 'Browse companions and submit a booking request. We confirm within 30 minutes.']] },
  'outcall': { name: 'Outcall', category: 'companionship', description: 'Your companion travels to your hotel or home across London.', faqs: [['What is an outcall booking?', 'Your companion travels to you — your hotel, apartment, or residence in London.'], ['Is outcall available at hotels?', 'Yes, all companions are experienced in hotel outcall visits and are completely discreet.'], ['What areas does outcall cover?', 'Available across all London districts. Additional travel fees may apply for distant locations.']] },
  'owo': { name: 'OWO', category: 'classic', description: 'Oral Without condom — one of our most requested services with selected London companions.', faqs: [['How do I book OWO?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'party': { name: 'Party', category: 'companionship', description: 'Fun, vibrant companions ready for a night out in London.', faqs: [['How do I book a party companion?', 'Browse companions and submit a booking request specifying the occasion. We confirm within 30 minutes.'], ['Available for events?', 'Yes, available for clubs, private parties, and events across London.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'poppers-play': { name: 'Poppers Play', category: 'fetish', description: 'Poppers-friendly companions in London. Confirm availability when booking.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'prostate-massage': { name: 'Prostate Massage', category: 'massage', description: 'Intensely pleasurable prostate massage with our London escorts.', faqs: [['What is prostate massage?', 'A highly pleasurable internal massage performed by experienced companions.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.']] },
  'rimming-receiving': { name: 'Rimming (Receiving)', category: 'classic', description: 'You perform on our companion. Available with selected London escorts.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'roleplay': { name: 'Roleplay', category: 'entertainment', description: 'Creative roleplay scenarios — bring your fantasies to life.', faqs: [['What scenarios are available?', 'Our companions fulfil a wide range of scenarios. Discuss your preferences when booking.'], ['Available for outcall?', 'Yes, available for both incall and outcall across London.'], ['How do I book?', 'Browse companions and describe your preferred scenario in the booking request.']] },
  'rope-bondage': { name: 'Rope Bondage', category: 'bdsm', description: 'Shibari and western-style rope tying with our London mistresses.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'sensual-wrestling': { name: 'Sensual Wrestling', category: 'fetish', description: 'Playful, physical, and arousing wrestling with our London escorts.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'shower': { name: 'Shower Together', category: 'companionship', description: 'Intimate, refreshing, and sensual shower with your companion.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Primarily incall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'slapping': { name: 'Slapping', category: 'bdsm', description: 'Controlled slapping as part of power exchange.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'spanking': { name: 'Spanking', category: 'bdsm', description: 'Classic discipline and impact play with our London escorts.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'strap-on': { name: 'Strap On', category: 'fetish', description: 'Strap-on pegging with selected experienced London companions.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'swallow': { name: 'Swallow', category: 'classic', description: 'Includes OWO and CIM. Available with selected London companions.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'trampling': { name: 'Trampling', category: 'fetish', description: 'Physical domination and body worship with our London escorts.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  'watersports': { name: 'Watersports', category: 'fetish', description: 'Giving or receiving with selected London companions.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
  '30-minute': { name: '30 Minute', category: 'companionship', description: 'Short, discreet 30-minute sessions across all London districts.', faqs: [['Are 30-minute bookings available?', 'Yes, selected companions offer short 30-minute sessions for incall and sometimes outcall.'], ['What is included?', 'Standard services as agreed with your companion. Please confirm services when booking.'], ['How do I book?', 'Browse companions who offer short bookings, specify 30 minutes in your request.']] },
  '69': { name: '69', category: 'classic', description: 'Mutual oral pleasure in the 69 position with our premium London companions.', faqs: [['How do I book?', 'Browse companions and submit a booking request. We confirm within 30 minutes.'], ['Available for outcall?', 'Available for both incall and outcall. Please confirm when booking.'], ['Is booking discreet?', 'Absolutely. Complete confidentiality guaranteed.']] },
}

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = SERVICES[params.slug]
  if (!info) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: `${info.name} Escorts London | Virel`,
    description: info.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/services/${params.slug}` },
    openGraph: { title: `${info.name} in London | Virel`, description: info.description },
  }
}

export default async function ServicePage({ params }: Props) {
  const info = SERVICES[params.slug]
  if (!info) notFound()

  const models = await prisma.model.findMany({
    where: { status: 'active', visibility: 'public' },
    include: { stats: true, media: { where: { isPrimary: true, isPublic: true }, take: 1 }, primaryLocation: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })

  const related = Object.entries(SERVICES)
    .filter(([k, v]) => v.category === info.category && k !== params.slug)
    .slice(0, 9)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Service', name: info.name, description: info.description, areaServed: { '@type': 'City', name: 'London' }, provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' } },
      { '@type': 'FAQPage', mainEntity: info.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' }, { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://virel-v3.vercel.app/services' }, { '@type': 'ListItem', position: 3, name: info.name, item: `https://virel-v3.vercel.app/services/${params.slug}` }] },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .svc-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }
        .model-card { text-decoration:none; display:block; overflow:hidden; position:relative; }
        .model-card img { width:100%; aspect-ratio:3/4; object-fit:cover; transition:transform .6s; }
        .model-card:hover img { transform:scale(1.04); }
        .model-card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%); }
        .model-card-info { position:absolute; bottom:0; padding:20px; }
        .faq-item summary { list-style:none; cursor:pointer; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; font-size:14px; color:#ddd5c8; }
        .faq-item summary::-webkit-details-marker { display:none; }
        .faq-item[open] summary { color:#c9a84c; }
        .faq-item summary .arrow { transition:transform .25s; font-size:10px; color:#6b6560; }
        .faq-item[open] summary .arrow { transform:rotate(180deg); }
        .rel-link { display:block; padding:14px 20px; border:1px solid rgba(255,255,255,0.07); font-size:13px; color:#6b6560; text-decoration:none; transition:border-color .2s,color .2s; }
        .rel-link:hover { border-color:rgba(201,168,76,0.35); color:#c9a84c; }
        .book-btn { display:inline-block; background:#c9a84c; color:#080808; padding:16px 36px; font-size:11px; letter-spacing:.16em; text-transform:uppercase; text-decoration:none; font-weight:500; font-family:inherit; transition:background .2s; }
        .book-btn:hover { background:#e0be6a; }
        .sec-btn { display:inline-block; border:1px solid rgba(255,255,255,0.1); color:#6b6560; padding:16px 36px; font-size:11px; letter-spacing:.16em; text-transform:uppercase; text-decoration:none; transition:border-color .2s,color .2s; }
        .sec-btn:hover { border-color:rgba(255,255,255,0.25); color:#9a9189; }
        @media(max-width:600px){ .svc-hero,.svc-body{padding-left:20px!important;padding-right:20px!important;} }
      `}</style>

      <div className="svc-root">
        <Header />

        {/* Breadcrumb */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 40px', fontSize: 11, letterSpacing: '.1em', color: '#3a3530', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <Link href="/services" style={{ color: '#3a3530', textDecoration: 'none' }}>SERVICES</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <Link href={`/services#${info.category}`} style={{ color: '#3a3530', textDecoration: 'none' }}>{CATEGORY_LABELS[info.category].toUpperCase()}</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>{info.name.toUpperCase()}</span>
        </div>

        {/* Hero */}
        <div className="svc-hero" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 64px' }}>
          <p style={{ fontSize: 10, letterSpacing: '.3em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>{CATEGORY_LABELS[info.category]}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(48px,6vw,80px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px', lineHeight: 1.05 }}>
            {info.name}<br />
            <em style={{ fontStyle: 'italic', color: '#c9a84c' }}>in London</em>
          </h1>
          <p style={{ fontSize: 15, color: '#6b6560', maxWidth: 560, lineHeight: 1.8, margin: '0 0 40px' }}>{info.description}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/london-escorts" className="book-btn">Book Now</Link>
            <Link href="/contact" className="sec-btn">Enquire</Link>
          </div>
        </div>

        {/* Companions */}
        {models.length > 0 && (
          <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
              <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#c9a84c', textTransform: 'uppercase', margin: 0 }}>Available Companions</p>
              <Link href="/london-escorts" style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', textDecoration: 'none', textTransform: 'uppercase' }}>View All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 2, background: 'rgba(255,255,255,0.03)' }}>
              {models.map((model: any) => {
                const photo = model.media[0]?.url
                return (
                  <Link key={model.id} href={`/catalog/${model.slug}`} className="model-card">
                    {photo
                      ? <img src={photo} alt={model.name} loading="lazy" />
                      : <div style={{ aspectRatio: '3/4', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👤</div>
                    }
                    <div className="model-card-overlay" />
                    <div className="model-card-info">
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: '#f0e8dc', margin: '0 0 4px' }}>{model.name}</p>
                      {model.stats?.age && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '.06em' }}>{model.stats.age} yrs{model.primaryLocation ? ` · ${model.primaryLocation.title}` : ''}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.15),transparent)', maxWidth: 1200, margin: '0 auto' }} />

        {/* FAQ */}
        <section style={{ maxWidth: 780, margin: '0 auto', padding: '80px 40px' }}>
          <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 32 }}>FAQ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
            {info.faqs.map(([q, a]: [string, string], i: number) => (
              <details key={i} className="faq-item" style={{ background: '#080808' }}>
                <summary>
                  <span>{q}</span>
                  <span className="arrow">▾</span>
                </summary>
                <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.8, margin: 0, padding: '0 24px 20px' }}>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
            <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 24 }}>More in {CATEGORY_LABELS[info.category]}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
              {related.map(([slug, svc]: [string, any]) => (
                <Link key={slug} href={`/services/${slug}`} className="rel-link">{svc.name}</Link>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  )
}
