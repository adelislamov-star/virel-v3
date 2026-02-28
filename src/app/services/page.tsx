import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Escort Services London | All Companion Services | Virel',
  description: 'Browse all 41 escort services available in London — GFE, massage, BDSM, fetish, roleplay and more. Find your perfect companion experience.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/services' },
}

const CATEGORIES: Record<string,string> = {
  'classic': 'Classic Services',
  'massage': 'Massage Services',
  'bdsm': 'BDSM and Domination',
  'fetish': 'Fetish and Fantasy',
  'entertainment': 'Entertainment',
  'companionship': 'Companionship',
}

const CATEGORY_ICONS: Record<string,string> = {
  'classic': '💋',
  'massage': '🤲',
  'bdsm': '⛓️',
  'fetish': '👠',
  'entertainment': '🎭',
  'companionship': '🥂',
}

const SERVICES_BY_CAT: Record<string, Array<{slug:string;name:string;description:string}>> = {
  'classic': [
    { slug: '69', name: '69', description: 'Mutual oral pleasure in the 69 position with our premium London companions.' },
    { slug: 'cif', name: 'CIF', description: 'CIF available with selected London escorts. Please confirm when booking.' },
    { slug: 'cim', name: 'CIM', description: 'CIM includes OWO. Available with selected enthusiastic London companions.' },
    { slug: 'cob', name: 'COB', description: 'Come on body finish with our premium London escorts.' },
    { slug: 'deep-throat', name: 'Deep Throat', description: 'Deep throat oral with our experienced London companions.' },
    { slug: 'dfk', name: 'DFK', description: 'Deep French Kissing — the most intimate kiss, hallmark of the Girlfriend Experience.' },
    { slug: 'double-penetration', name: 'Double Penetration', description: 'Double penetration with selected London escorts. Please confirm when booking.' },
    { slug: 'fk', name: 'FK', description: 'French Kissing — passionate and intimate with our London escorts.' },
    { slug: 'gfe', name: 'GFE', description: 'Girlfriend Experience in London — warmth, intimacy, affection and genuine connection.' },
    { slug: 'owo', name: 'OWO', description: 'Oral Without condom — one of our most requested services with selected London companions.' },
    { slug: 'rimming-receiving', name: 'Rimming (Receiving)', description: 'Rimming receiving — you perform on our companion. Available with selected escorts.' },
    { slug: 'swallow', name: 'Swallow', description: 'Swallow includes OWO and CIM. Available with selected London companions.' },
    { slug: 'a-level', name: 'A Level', description: 'A-Level (anal sex) with selected London escorts. Available for incall and outcall across London.' },
    { slug: 'fingering', name: 'Fingering', description: 'Manual stimulation available with all our London companions.' },
  ],
  'massage': [
    { slug: 'body-to-body-massage', name: 'Body to Body Massage', description: 'Full body-to-body massage in London. Skin on skin contact using warm oils.' },
    { slug: 'nuru-massage', name: 'Nuru Massage', description: 'Authentic Japanese Nuru massage in London using special ultra-slippery gel.' },
    { slug: 'prostate-massage', name: 'Prostate Massage', description: 'Prostate massage with our London escorts — intensely pleasurable for men.' },
  ],
  'companionship': [
    { slug: '30-minute', name: '30 Minute', description: '30-minute escort bookings in London — short, discreet sessions across all districts.' },
    { slug: 'couples', name: 'Couples', description: 'Companion bookings for couples in London. Add a new dimension to your relationship.' },
    { slug: 'incall', name: 'Incall', description: 'Incall escort services in London. Visit your companion at her private discreet location.' },
    { slug: 'outcall', name: 'Outcall', description: 'Outcall escort services in London. Your companion travels to your hotel or home.' },
    { slug: 'party', name: 'Party', description: 'Party girl companions in London — fun, vibrant, and ready for a night out.' },
    { slug: 'shower', name: 'Shower', description: 'Shower together with your companion — intimate, refreshing, and sensual.' },
  ],
  'fetish': [
    { slug: 'cuckolding', name: 'Cuckolding', description: 'Cuckolding fantasy with our London escorts. Consensual, exciting, and thrilling.' },
    { slug: 'foot-fetish', name: 'Foot Fetish', description: 'Foot fetish service in London — worship, massage, and adore beautiful feet.' },
    { slug: 'latex', name: 'Latex', description: 'Companions in latex outfits in London. The iconic fetish look.' },
    { slug: 'poppers-play', name: 'Poppers Play', description: 'Poppers-friendly companions in London. Please confirm availability when booking.' },
    { slug: 'sensual-wrestling', name: 'Sensual Wrestling', description: 'Sensual wrestling with our London escorts — playful, physical, and arousing.' },
    { slug: 'strap-on', name: 'Strap On', description: 'Strap-on pegging with our London escorts. Available with selected experienced companions.' },
    { slug: 'trampling', name: 'Trampling', description: 'Trampling fetish with our London escorts — physical domination and body worship.' },
    { slug: 'watersports', name: 'Watersports', description: 'Watersports with our London escorts — giving or receiving with selected companions.' },
  ],
  'bdsm': [
    { slug: 'ball-busting', name: 'Ball Busting', description: 'Ball busting with our London mistresses. Controlled CBT sensation play for the adventurous.' },
    { slug: 'bondage', name: 'Bondage', description: 'Bondage with our London escorts. Rope, cuffs, and restraint play.' },
    { slug: 'caning', name: 'Caning', description: 'Caning by our London mistresses. Classic impact play with a cane.' },
    { slug: 'fisting-giving', name: 'Fisting (Giving)', description: 'Fisting giving by our experienced London companions.' },
    { slug: 'humiliation', name: 'Humiliation', description: 'Verbal and role-based humiliation with our London mistresses.' },
    { slug: 'rope-bondage', name: 'Rope Bondage', description: 'Rope bondage with our London mistresses — Shibari and western-style tying.' },
    { slug: 'slapping', name: 'Slapping', description: 'Controlled slapping as part of power exchange with our London companions.' },
    { slug: 'spanking', name: 'Spanking', description: 'Spanking with our London escorts — classic discipline and impact play.' },
  ],
  'entertainment': [
    { slug: 'filming-with-mask', name: 'Filming with Mask', description: 'Filming permitted with mask for privacy. Available with selected London escorts. Personal use only.' },
    { slug: 'roleplay', name: 'Roleplay', description: 'Creative roleplay scenarios with our London escorts. Bring your fantasies to life.' },
  ],
}

export default function ServicesPage() {
  const order = ['classic','massage','companionship','fetish','bdsm','entertainment']
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Escort Services in London</h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
          Browse all services available with our London companions.
          Please confirm availability with your chosen escort when booking.
        </p>

        <div className="flex flex-wrap gap-2 mb-12">
          {order.filter(c => SERVICES_BY_CAT[c]).map(cat => (
            <a key={cat} href={`#${cat}`}
              className="px-4 py-2 bg-muted rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {CATEGORY_ICONS[cat]} {CATEGORIES[cat]}
            </a>
          ))}
        </div>

        <div className="space-y-16">
          {order.filter(c => SERVICES_BY_CAT[c]).map(cat => (
            <section key={cat} id={cat}>
              <h2 className="text-2xl font-bold mb-6 pb-3 border-b border-border flex items-center gap-3">
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{CATEGORIES[cat]}</span>
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES_BY_CAT[cat].map(svc => (
                  <Link key={svc.slug} href={`/services/${svc.slug}`}
                    className="group p-5 border border-border rounded-xl hover:border-primary hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{svc.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{svc.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 bg-muted/50 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-3">Find Your Perfect Companion</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Browse our verified London escorts and book your preferred service today.</p>
          <Link href="/london-escorts"
            className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-lg"
          >
            Browse Companions
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
