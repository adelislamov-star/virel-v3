// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

const CATEGORY_LABELS: Record<string, string> = {
  classic: 'Classic Services',
  massage: 'Massage Services',
  bdsm: 'BDSM and Domination',
  fetish: 'Fetish and Fantasy',
  entertainment: 'Entertainment',
  companionship: 'Companionship',
}

const SERVICES: Record<string, { name: string; category: string; description: string; faqs: Array<[string, string]> }> = {
  'a-level': { name: 'A Level', category: 'classic', description: 'A-Level (anal sex) with selected London escorts. Available for incall and outcall across London.', faqs: [['How do I book A Level in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is A Level available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking A Level discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'ball-busting': { name: 'Ball Busting', category: 'bdsm', description: 'Ball busting with our London mistresses. Controlled CBT sensation play for the adventurous.', faqs: [['How do I book Ball Busting in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Ball Busting available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Ball Busting discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'body-to-body-massage': { name: 'Body to Body Massage', category: 'massage', description: 'Full body-to-body massage in London. Skin on skin contact using warm oils.', faqs: [['How do I book Body to Body Massage in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Body to Body Massage available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Body to Body Massage discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'bondage': { name: 'Bondage', category: 'bdsm', description: 'Bondage with our London escorts. Rope, cuffs, and restraint play.', faqs: [['How do I book Bondage in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Bondage available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Bondage discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'caning': { name: 'Caning', category: 'bdsm', description: 'Caning by our London mistresses. Classic impact play with a cane.', faqs: [['How do I book Caning in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Caning available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Caning discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'cif': { name: 'CIF', category: 'classic', description: 'CIF available with selected London escorts. Please confirm when booking.', faqs: [['How do I book CIF in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is CIF available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking CIF discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'cim': { name: 'CIM', category: 'classic', description: 'CIM includes OWO. Available with selected enthusiastic London companions.', faqs: [['How do I book CIM in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is CIM available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking CIM discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'cob': { name: 'COB', category: 'classic', description: 'Come on body finish with our premium London escorts.', faqs: [['How do I book COB in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is COB available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking COB discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'couples': { name: 'Couples', category: 'companionship', description: 'Companion bookings for couples in London. Add a new dimension to your relationship.', faqs: [['How do I book Couples in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Couples available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Couples discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'cuckolding': { name: 'Cuckolding', category: 'fetish', description: 'Cuckolding fantasy with our London escorts. Consensual, exciting, and thrilling.', faqs: [['How do I book Cuckolding in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Cuckolding available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Cuckolding discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'deep-throat': { name: 'Deep Throat', category: 'classic', description: 'Deep throat oral with our experienced London companions.', faqs: [['How do I book Deep Throat in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Deep Throat available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Deep Throat discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'dfk': { name: 'DFK', category: 'classic', description: 'Deep French Kissing — the most intimate kiss, hallmark of the Girlfriend Experience.', faqs: [['How do I book DFK in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is DFK available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking DFK discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'double-penetration': { name: 'Double Penetration', category: 'classic', description: 'Double penetration with selected London escorts. Please confirm when booking.', faqs: [['How do I book Double Penetration in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Double Penetration available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Double Penetration discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'filming-with-mask': { name: 'Filming with Mask', category: 'entertainment', description: 'Filming permitted with mask for privacy. Available with selected London escorts. Personal use only.', faqs: [['How do I book Filming with Mask in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Filming with Mask available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Filming with Mask discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'fingering': { name: 'Fingering', category: 'classic', description: 'Manual stimulation available with all our London companions.', faqs: [['How do I book Fingering in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Fingering available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Fingering discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'fisting-giving': { name: 'Fisting (Giving)', category: 'bdsm', description: 'Fisting giving by our experienced London companions.', faqs: [['How do I book Fisting (Giving) in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Fisting (Giving) available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Fisting (Giving) discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'fk': { name: 'FK', category: 'classic', description: 'French Kissing — passionate and intimate with our London escorts.', faqs: [['How do I book FK in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is FK available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking FK discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'foot-fetish': { name: 'Foot Fetish', category: 'fetish', description: 'Foot fetish service in London — worship, massage, and adore beautiful feet.', faqs: [['How do I book Foot Fetish in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Foot Fetish available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Foot Fetish discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'gfe': { name: 'GFE', category: 'classic', description: 'Girlfriend Experience in London — warmth, intimacy, affection and genuine connection.', faqs: [['What is the Girlfriend Experience (GFE)?', 'GFE is a companionship service that creates a warm, intimate connection — affectionate conversation, kissing, and a natural dynamic similar to spending time with a partner.'], ['How long does a GFE booking last?', 'GFE bookings start from 1 hour, but we recommend 2-3 hours to fully enjoy the experience.'], ['Is GFE available for outcall in London?', 'Yes, our GFE companions are available for both incall and outcall across London, including hotels and private residences.']] },
  'humiliation': { name: 'Humiliation', category: 'bdsm', description: 'Verbal and role-based humiliation with our London mistresses.', faqs: [['How do I book Humiliation in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Humiliation available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Humiliation discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'incall': { name: 'Incall', category: 'companionship', description: 'Incall escort services in London. Visit your companion at her private discreet location.', faqs: [['What is an incall escort booking?', 'An incall booking means you visit the companion at her private, discreet location in London. Her address is shared after booking is confirmed.'], ['Is incall available across London?', 'Yes, our companions offer incall from locations across London including Central, West, and South London.'], ['How do I book an incall session?', 'Browse our companions, select your escort, and specify incall in your booking request. We confirm within 30 minutes.']] },
  'latex': { name: 'Latex', category: 'fetish', description: 'Companions in latex outfits in London. The iconic fetish look.', faqs: [['How do I book Latex in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Latex available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Latex discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'nuru-massage': { name: 'Nuru Massage', category: 'massage', description: 'Authentic Japanese Nuru massage in London using special ultra-slippery gel.', faqs: [['What is a Nuru massage?', 'Nuru massage is a Japanese technique using special ultra-slippery gel for full body-to-body contact. It is deeply sensual and relaxing.'], ['Is Nuru massage available for outcall?', 'Nuru massage is primarily available as incall due to equipment required. Please confirm when booking.'], ['How do I book Nuru massage in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.']] },
  'outcall': { name: 'Outcall', category: 'companionship', description: 'Outcall escort services in London. Your companion travels to your hotel or home.', faqs: [['What is an outcall escort booking?', 'An outcall booking means your companion travels to you — your hotel, apartment, or residence in London.'], ['Is outcall available at hotels?', 'Yes, all our companions are experienced in hotel outcall visits and are discreet and professional.'], ['What areas does outcall cover?', 'Outcall is available across all London districts. Additional travel fees may apply for distant locations.']] },
  'owo': { name: 'OWO', category: 'classic', description: 'Oral Without condom — one of our most requested services with selected London companions.', faqs: [['How do I book OWO in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is OWO available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking OWO discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'party': { name: 'Party', category: 'companionship', description: 'Party girl companions in London — fun, vibrant, and ready for a night out.', faqs: [['How do I book a Party companion in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is a Party companion available for events?', 'Yes, our party companions are available for clubs, private parties, and events across London.'], ['Is booking a Party companion discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'poppers-play': { name: 'Poppers Play', category: 'fetish', description: 'Poppers-friendly companions in London. Please confirm availability when booking.', faqs: [['How do I book Poppers Play in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Poppers Play available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Poppers Play discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'prostate-massage': { name: 'Prostate Massage', category: 'massage', description: 'Prostate massage with our London escorts — intensely pleasurable for men.', faqs: [['What is a prostate massage?', 'Prostate massage is a highly pleasurable internal massage technique performed by experienced companions.'], ['Is prostate massage available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['How do I book prostate massage in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.']] },
  'rimming-receiving': { name: 'Rimming (Receiving)', category: 'classic', description: 'Rimming receiving — you perform on our companion. Available with selected escorts.', faqs: [['How do I book Rimming (Receiving) in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Rimming (Receiving) available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Rimming (Receiving) discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'roleplay': { name: 'Roleplay', category: 'entertainment', description: 'Creative roleplay scenarios with our London escorts. Bring your fantasies to life.', faqs: [['What roleplay scenarios are available?', 'Our companions can fulfil a wide range of roleplay scenarios — from professional to fantasy. Discuss your preferences when booking.'], ['Is roleplay available for outcall?', 'Yes, roleplay is available for both incall and outcall bookings across London.'], ['How do I book a roleplay session?', 'Browse our companions, select your escort, and describe your preferred scenario in the booking request.']] },
  'rope-bondage': { name: 'Rope Bondage', category: 'bdsm', description: 'Rope bondage with our London mistresses — Shibari and western-style tying.', faqs: [['How do I book Rope Bondage in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Rope Bondage available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Rope Bondage discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'sensual-wrestling': { name: 'Sensual Wrestling', category: 'fetish', description: 'Sensual wrestling with our London escorts — playful, physical, and arousing.', faqs: [['How do I book Sensual Wrestling in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Sensual Wrestling available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Sensual Wrestling discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'shower': { name: 'Shower', category: 'companionship', description: 'Shower together with your companion — intimate, refreshing, and sensual.', faqs: [['How do I book Shower in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Shower available for outcall?', 'Shower together is primarily an incall service. Please confirm availability when booking.'], ['Is booking Shower discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'slapping': { name: 'Slapping', category: 'bdsm', description: 'Controlled slapping as part of power exchange with our London companions.', faqs: [['How do I book Slapping in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Slapping available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Slapping discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'spanking': { name: 'Spanking', category: 'bdsm', description: 'Spanking with our London escorts — classic discipline and impact play.', faqs: [['How do I book Spanking in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Spanking available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Spanking discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'strap-on': { name: 'Strap On', category: 'fetish', description: 'Strap-on pegging with our London escorts. Available with selected experienced companions.', faqs: [['How do I book Strap On in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Strap On available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Strap On discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'swallow': { name: 'Swallow', category: 'classic', description: 'Swallow includes OWO and CIM. Available with selected London companions.', faqs: [['How do I book Swallow in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Swallow available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Swallow discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'trampling': { name: 'Trampling', category: 'fetish', description: 'Trampling fetish with our London escorts — physical domination and body worship.', faqs: [['How do I book Trampling in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Trampling available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Trampling discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  'watersports': { name: 'Watersports', category: 'fetish', description: 'Watersports with our London escorts — giving or receiving with selected companions.', faqs: [['How do I book Watersports in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is Watersports available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking Watersports discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
  '30-minute': { name: '30 Minute', category: 'companionship', description: '30-minute escort bookings in London — short, discreet sessions across all districts.', faqs: [['Are 30-minute bookings available?', 'Yes, selected companions offer 30-minute short sessions for both incall and sometimes outcall.'], ['What is included in a 30-minute session?', 'The session includes standard services as agreed with your companion. Please confirm services when booking.'], ['How do I book a 30-minute session?', 'Browse companions who offer short bookings, specify 30 minutes in your request, and we will confirm within 30 minutes.']] },
  '69': { name: '69', category: 'classic', description: 'Mutual oral pleasure in the 69 position with our premium London companions.', faqs: [['How do I book 69 in London?', 'Browse our companions, select your escort, and submit a booking request. We confirm within 30 minutes.'], ['Is 69 available for outcall?', 'Most services are available for both incall and outcall across London. Please confirm when booking.'], ['Is booking 69 discreet?', 'Absolutely. All bookings are handled with complete confidentiality. We never share client information.']] },
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
    openGraph: { title: `${info.name} | Virel London`, description: info.description },
  }
}

export default async function ServicePage({ params }: Props) {
  const info = SERVICES[params.slug]
  if (!info) notFound()

  const models = await prisma.model.findMany({
    where: { status: 'active', visibility: 'public' },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const related = Object.entries(SERVICES)
    .filter(([k, v]) => v.category === info.category && k !== params.slug)
    .slice(0, 9)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: info.name,
        description: info.description,
        areaServed: { '@type': 'City', name: 'London' },
        provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: info.faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://virel-v3.vercel.app/services' },
          { '@type': 'ListItem', position: 3, name: info.name, item: `https://virel-v3.vercel.app/services/${params.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-6xl">

          <nav className="text-sm text-muted-foreground mb-6 flex gap-2 flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-foreground transition-colors">Services</Link>
            <span>/</span>
            <Link href={`/services#${info.category}`} className="hover:text-foreground transition-colors">
              {CATEGORY_LABELS[info.category]}
            </Link>
            <span>/</span>
            <span className="text-foreground">{info.name}</span>
          </nav>

          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{info.name} in London</h1>
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">{info.description}</p>
          </div>

          {models.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Available Companions</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {models.map((model: any) => {
                  const photo = model.media[0]?.url
                  return (
                    <Link key={model.id} href={`/catalog/${model.slug}`}
                      className="group block bg-card rounded-xl overflow-hidden hover:shadow-xl transition-all border border-border hover:border-primary"
                    >
                      <div className="relative aspect-[3/4]">
                        {photo
                          ? <img src={photo} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-5xl bg-muted">👤</div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 p-4 text-white">
                          <p className="font-semibold">{model.name}</p>
                          {model.stats?.age && <p className="text-xs opacity-80">{model.stats.age} yrs{model.primaryLocation ? ` · ${model.primaryLocation.title}` : ''}</p>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <Link href="/london-escorts" className="inline-block border border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-medium">
                  View all companions →
                </Link>
              </div>
            </section>
          )}

          <section className="mb-16 bg-muted/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">About {info.name}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">{info.description}</p>
            <p className="text-muted-foreground leading-relaxed">
              This service is available with selected companions across London. Please confirm availability
              when making your booking enquiry. All services are provided in a safe, consensual, and fully
              discreet environment.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3 max-w-3xl">
              {info.faqs.map(([q, a]: [string, string], i: number) => (
                <details key={i} className="group border border-border rounded-xl overflow-hidden">
                  <summary className="px-6 py-4 cursor-pointer font-medium flex justify-between items-center list-none hover:bg-muted/50 transition-colors">
                    <span>{q}</span>
                    <span className="ml-4 shrink-0 group-open:rotate-180 transition-transform duration-200 text-muted-foreground">▾</span>
                  </summary>
                  <div className="px-6 pb-5 pt-1 text-muted-foreground leading-relaxed">{a}</div>
                </details>
              ))}
            </div>
          </section>

          {related.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Related — {CATEGORY_LABELS[info.category]}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {related.map(([slug, svc]: [string, any]) => (
                  <Link key={slug} href={`/services/${slug}`}
                    className="p-4 border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all text-sm font-medium"
                  >
                    {svc.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="text-center pt-4 border-t border-border">
            <Link href="/services" className="text-primary hover:underline font-medium">← All Services</Link>
          </div>
        </div>
        <Footer />
      </main>
    </>
  )
}
