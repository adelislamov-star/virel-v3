// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

const SERVICES: Record<string, {
  title: string; h1: string; description: string; content: string
  faqs: Array<{ q: string; a: string }>
}> = {
  'gfe': {
    title: 'GFE Escorts London | Girlfriend Experience | Virel',
    h1: 'Girlfriend Experience (GFE) in London',
    description: 'The ultimate Girlfriend Experience in London. Our GFE escorts offer warmth, intimacy, and genuine connection for an unforgettable encounter.',
    content: `The Girlfriend Experience (GFE) is one of our most requested services. It goes beyond a standard escort booking to offer something truly special — the warmth, affection, and intimacy of a genuine connection.\n\nOur GFE companions are selected for their natural warmth and ability to make you feel completely at ease. Whether you're looking for a companion for dinner, a cultural event, or a private evening, our GFE escorts will make every moment feel authentic and memorable.`,
    faqs: [
      { q: 'What is the Girlfriend Experience (GFE)?', a: 'GFE is a companionship service that focuses on creating a warm, intimate, and genuine connection. It includes affectionate conversation, hand-holding, kissing, and a natural, relaxed dynamic — similar to spending time with a partner.' },
      { q: 'How long does a GFE booking typically last?', a: 'GFE bookings typically start from 1 hour, but we recommend longer bookings of 2-3 hours to fully enjoy the experience. Overnight stays are also available.' },
      { q: 'Is GFE available for outcall in London?', a: 'Yes, our GFE companions are available for both incall and outcall services across London, including hotel visits and private residences.' },
    ],
  },
  'dinner-date': {
    title: 'Dinner Date Escorts London | Companion for Dining | Virel',
    h1: 'Dinner Date Companions in London',
    description: 'Elegant dinner date companions for London\'s finest restaurants. Our escorts are cultured, sophisticated, and perfect dining partners.',
    content: `A dinner date with one of our companions transforms an ordinary evening into something truly extraordinary. Our dinner date escorts are cultured, articulate, and impeccably presented — perfect for London's finest restaurants.\n\nFrom Michelin-starred establishments in Mayfair to intimate bistros in Chelsea, our companions know how to make every dining experience memorable. They are excellent conversationalists who will make the evening feel completely natural and enjoyable.`,
    faqs: [
      { q: 'What does a dinner date booking include?', a: 'A dinner date booking typically includes companionship for the duration of your meal, elegant conversation, and a sophisticated presence. Bookings usually start from 2 hours.' },
      { q: 'Can my companion accompany me to a private event after dinner?', a: 'Absolutely. Many clients extend their booking to include drinks, theatre visits, or private events after dinner. Simply discuss your plans when booking.' },
      { q: 'How should I book a dinner date companion?', a: 'Browse our available companions, select your preferred escort, and submit a booking request. We recommend booking 2-3 hours in advance for evening bookings.' },
    ],
  },
  'travel-companion': {
    title: 'Travel Companion London | Escort for Travel | Virel',
    h1: 'Travel Companion Services',
    description: 'Sophisticated travel companions for business trips, holidays, and international travel. Our escorts are experienced, discreet, and perfect travel partners.',
    content: `Travelling alone doesn't have to mean travelling alone. Our travel companions are experienced, sophisticated, and discreet — ideal for business trips, holidays, and international travel.\n\nWhether you need a companion for a weekend in Paris, a business trip to Dubai, or a luxury cruise, our travel escorts are available worldwide. They are experienced travellers who adapt seamlessly to any environment.`,
    faqs: [
      { q: 'Can I book a companion for international travel?', a: 'Yes, our companions are available for international travel. All travel arrangements, accommodation, and expenses are covered by the client. Please enquire in advance for international bookings.' },
      { q: 'How far in advance should I book a travel companion?', a: 'We recommend booking at least 48-72 hours in advance for domestic travel, and 5-7 days for international trips to ensure your preferred companion is available.' },
      { q: 'Is a travel companion booking discreet?', a: 'Absolutely. All our companions are bound by strict confidentiality agreements. Your privacy is our highest priority, wherever in the world you travel.' },
    ],
  },
  'vip': {
    title: 'VIP Escort Service London | Elite Companions | Virel',
    h1: 'VIP Escort Service in London',
    description: 'London\'s most exclusive VIP escort service. Elite companions for the most discerning clients. The pinnacle of premium companionship.',
    content: `Our VIP escort service represents the absolute pinnacle of premium companionship. Reserved for our most discerning clients, VIP bookings offer access to our most exceptional companions with a fully tailored, bespoke experience.\n\nVIP clients receive priority service, dedicated account management, and access to companions not available through standard bookings. Every detail is handled with meticulous care to ensure an experience that exceeds expectations.`,
    faqs: [
      { q: 'What makes a booking VIP?', a: 'VIP bookings include priority companion selection, dedicated account management, bespoke experience planning, and access to our most exclusive companions. Everything is tailored to your specific preferences.' },
      { q: 'How do I access VIP services?', a: 'Contact us directly to enquire about VIP services. New VIP clients may be asked to provide a brief introduction to ensure the best match with our companions.' },
      { q: 'What is the minimum booking for VIP service?', a: 'VIP bookings typically start from 3 hours, with overnight and multi-day bookings available. Please contact us for current availability and rates.' },
    ],
  },
  'overnight': {
    title: 'Overnight Escort London | All Night Companions | Virel',
    h1: 'Overnight Escort Services in London',
    description: 'Overnight companion services in London. Spend an unforgettable evening with one of our premium escorts. Available 7 nights a week.',
    content: `An overnight booking with one of our companions creates a truly immersive experience. Fall asleep and wake up with a warm, beautiful companion — the ultimate luxury for the discerning gentleman.\n\nOur overnight escorts are available throughout London, at hotels and private residences. Overnight bookings typically run from 10pm to 10am, or can be customised to suit your schedule.`,
    faqs: [
      { q: 'What time does an overnight booking start and end?', a: 'Standard overnight bookings run from approximately 10pm to 10am. However, we can accommodate different schedules — simply discuss your requirements when booking.' },
      { q: 'Are overnight bookings available at hotels?', a: 'Yes, all our companions are available for hotel outcall including overnight stays at London\'s finest hotels. They are experienced and completely discreet.' },
      { q: 'How far in advance should I book an overnight companion?', a: 'We recommend booking at least 3-4 hours in advance for overnight bookings, though same-day bookings may be available depending on companion availability.' },
    ],
  },
}

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = SERVICES[params.slug]
  if (!info) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: info.title,
    description: info.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/services/${params.slug}` },
    openGraph: { title: info.title, description: info.description },
  }
}

export default async function ServicePage({ params }: Props) {
  const info = SERVICES[params.slug]
  if (!info) notFound()

  // Get models offering this service
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

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: info.h1,
        description: info.description,
        areaServed: { '@type': 'City', name: 'London' },
        provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: info.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://virel-v3.vercel.app/services' },
          { '@type': 'ListItem', position: 3, name: info.h1, item: `https://virel-v3.vercel.app/services/${params.slug}` },
        ],
      },
    ],
  }

  const otherServices = Object.keys(SERVICES).filter(s => s !== params.slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <main className="min-h-screen">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <nav className="text-sm text-muted-foreground mb-6 flex gap-2">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link href="/london-escorts" className="hover:text-accent">London Escorts</Link>
            <span>/</span>
            <span>{info.h1}</span>
          </nav>

          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{info.h1}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-12">{info.description}</p>

          {/* Models */}
          {models.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Available Companions</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {models.map((model: any) => {
                  const photo = model.media[0]?.url
                  return (
                    <Link key={model.id} href={`/catalog/${model.slug}`}
                      className="group block bg-muted rounded-xl overflow-hidden hover:shadow-xl transition-all"
                    >
                      <div className="relative aspect-[3/4]">
                        {photo
                          ? <img src={photo} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl bg-muted-foreground/10">👤</div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 p-4 text-white">
                          <p className="font-semibold">{model.name}</p>
                          <p className="text-xs opacity-80">{model.primaryLocation?.title}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-6 text-center">
                <Link href="/london-escorts" className="text-primary hover:underline font-medium">View all companions →</Link>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-16 max-w-3xl">
            {info.content.split('\n\n').map((para: string, i: number) => (
              <p key={i} className="text-muted-foreground mb-4 leading-relaxed">{para}</p>
            ))}
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3 max-w-3xl">
              {info.faqs.map((faq, i) => (
                <details key={i} className="group border border-border rounded-lg">
                  <summary className="px-6 py-4 cursor-pointer font-medium flex justify-between items-center list-none hover:bg-muted/50 transition-colors">
                    {faq.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform ml-4 flex-shrink-0">▾</span>
                  </summary>
                  <div className="px-6 pb-4 text-muted-foreground">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>

          {/* Other Services */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Other Services</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {otherServices.map(slug => {
                const name = SERVICES[slug].h1.replace(' in London', '').replace(' Services', '')
                return (
                  <Link key={slug} href={`/services/${slug}`}
                    className="p-3 border border-border rounded-lg hover:border-primary transition-colors text-center text-sm font-medium"
                  >
                    {name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}
