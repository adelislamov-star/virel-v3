import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Escort Services London | All Companion Services | Virel',
  description: 'Browse all escort services available in London — GFE, massage, BDSM, fetish, roleplay and more. Find your perfect companion experience.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/services' },
}

const CATEGORIES: Record<string,string> = {
  classic: 'Classic Services',
  massage: 'Massage Services',
  bdsm: 'BDSM & Domination',
  fetish: 'Fetish & Fantasy',
  entertainment: 'Entertainment',
  companionship: 'Companionship',
}

const SERVICES_BY_CAT: Record<string, Array<{slug:string;name:string;description:string}>> = {
  classic: [
    { slug: '69', name: '69', description: 'Mutual oral pleasure in the 69 position with our premium London companions.' },
    { slug: 'cif', name: 'CIF', description: 'Available with selected London escorts. Please confirm when booking.' },
    { slug: 'cim', name: 'CIM', description: 'Includes OWO. Available with selected enthusiastic London companions.' },
    { slug: 'cob', name: 'COB', description: 'Come on body finish with our premium London escorts.' },
    { slug: 'deep-throat', name: 'Deep Throat', description: 'Deep throat oral with our experienced London companions.' },
    { slug: 'dfk', name: 'DFK', description: 'Deep French Kissing — the most intimate kiss, hallmark of the Girlfriend Experience.' },
    { slug: 'double-penetration', name: 'Double Penetration', description: 'Available with selected London escorts. Please confirm when booking.' },
    { slug: 'fk', name: 'FK', description: 'French Kissing — passionate and intimate with our London escorts.' },
    { slug: 'gfe', name: 'GFE', description: 'Girlfriend Experience — warmth, intimacy, affection and genuine connection.' },
    { slug: 'owo', name: 'OWO', description: 'Oral Without condom — one of our most requested services with selected companions.' },
    { slug: 'rimming-receiving', name: 'Rimming (Receiving)', description: 'You perform on our companion. Available with selected escorts.' },
    { slug: 'swallow', name: 'Swallow', description: 'Includes OWO and CIM. Available with selected London companions.' },
    { slug: 'a-level', name: 'A Level', description: 'A-Level with selected London escorts. Available for incall and outcall.' },
    { slug: 'fingering', name: 'Fingering', description: 'Manual stimulation available with all our London companions.' },
  ],
  massage: [
    { slug: 'body-to-body-massage', name: 'Body to Body', description: 'Full body-to-body massage using warm oils. Skin on skin contact.' },
    { slug: 'nuru-massage', name: 'Nuru Massage', description: 'Authentic Japanese Nuru massage using special ultra-slippery gel.' },
    { slug: 'prostate-massage', name: 'Prostate Massage', description: 'Intensely pleasurable prostate massage with our London escorts.' },
  ],
  companionship: [
    { slug: '30-minute', name: '30 Minute', description: 'Short, discreet 30-minute sessions across all London districts.' },
    { slug: 'couples', name: 'Couples', description: 'Companion bookings for couples — add a new dimension to your relationship.' },
    { slug: 'incall', name: 'Incall', description: 'Visit your companion at her private, discreet London location.' },
    { slug: 'outcall', name: 'Outcall', description: 'Your companion travels to your hotel or home across London.' },
    { slug: 'party', name: 'Party', description: 'Fun, vibrant companions ready for a night out in London.' },
    { slug: 'shower', name: 'Shower Together', description: 'Intimate, refreshing, and sensual shower with your companion.' },
  ],
  fetish: [
    { slug: 'cuckolding', name: 'Cuckolding', description: 'Consensual cuckolding fantasy with our London escorts.' },
    { slug: 'foot-fetish', name: 'Foot Fetish', description: 'Worship, massage, and adore beautiful feet with our companions.' },
    { slug: 'latex', name: 'Latex', description: 'Companions in latex outfits — the iconic fetish look.' },
    { slug: 'poppers-play', name: 'Poppers Play', description: 'Poppers-friendly companions in London. Confirm availability when booking.' },
    { slug: 'sensual-wrestling', name: 'Sensual Wrestling', description: 'Playful, physical, and arousing wrestling with our London escorts.' },
    { slug: 'strap-on', name: 'Strap On', description: 'Strap-on pegging with selected experienced London companions.' },
    { slug: 'trampling', name: 'Trampling', description: 'Physical domination and body worship with our London escorts.' },
    { slug: 'watersports', name: 'Watersports', description: 'Giving or receiving with selected London companions.' },
  ],
  bdsm: [
    { slug: 'ball-busting', name: 'Ball Busting', description: 'Controlled CBT sensation play with our London mistresses.' },
    { slug: 'bondage', name: 'Bondage', description: 'Rope, cuffs, and restraint play with our London escorts.' },
    { slug: 'caning', name: 'Caning', description: 'Classic impact play with a cane by our London mistresses.' },
    { slug: 'fisting-giving', name: 'Fisting (Giving)', description: 'Fisting by our experienced London companions.' },
    { slug: 'humiliation', name: 'Humiliation', description: 'Verbal and role-based humiliation with our London mistresses.' },
    { slug: 'rope-bondage', name: 'Rope Bondage', description: 'Shibari and western-style rope tying with our London mistresses.' },
    { slug: 'slapping', name: 'Slapping', description: 'Controlled slapping as part of power exchange.' },
    { slug: 'spanking', name: 'Spanking', description: 'Classic discipline and impact play with our London escorts.' },
  ],
  entertainment: [
    { slug: 'filming-with-mask', name: 'Filming (Masked)', description: 'Filming permitted with mask for privacy. Personal use only.' },
    { slug: 'roleplay', name: 'Roleplay', description: 'Creative roleplay scenarios — bring your fantasies to life.' },
  ],
}

const ORDER = ['classic','massage','companionship','fetish','bdsm','entertainment']

export default function ServicesPage() {
  return (
    <main style={{ background: '#080808', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .svc-card { display:block; padding:24px 28px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); text-decoration:none; transition:border-color .25s, background .25s; }
        .svc-card:hover { border-color:rgba(201,168,76,0.35); background:rgba(201,168,76,0.04); }
        .svc-card:hover .svc-name { color:#c9a84c; }
        .cat-pill { display:inline-block; padding:8px 18px; border:1px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#6b6560; text-decoration:none; transition:border-color .2s, color .2s; }
        .cat-pill:hover { border-color:rgba(201,168,76,0.4); color:#c9a84c; }
        .browse-btn { display:inline-block; border:1px solid rgba(201,168,76,0.4); color:#c9a84c; padding:16px 40px; font-size:11px; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:all .25s; font-family:inherit; }
        .browse-btn:hover { background:rgba(201,168,76,0.08); border-color:#c9a84c; }
      `}</style>

      <Header />

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 24 }}>Our Services</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.05, margin: '0 0 24px' }}>
          Companion Services<br />
          <em style={{ fontStyle: 'italic', color: '#c9a84c' }}>in London</em>
        </h1>
        <p style={{ fontSize: 15, color: '#6b6560', maxWidth: 520, lineHeight: 1.8, margin: '0 0 48px' }}>
          Browse all services available with our London companions. Please confirm availability with your chosen escort when booking.
        </p>

        {/* Category nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ORDER.map(cat => (
            <a key={cat} href={`#${cat}`} className="cat-pill">{CATEGORIES[cat]}</a>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />
      </div>

      {/* Categories */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          {ORDER.filter(c => SERVICES_BY_CAT[c]).map(cat => (
            <div key={cat} id={cat}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
                  {CATEGORIES[cat]}
                </h2>
                <span style={{ fontSize: 11, letterSpacing: '.15em', color: '#3a3530', textTransform: 'uppercase' }}>
                  {SERVICES_BY_CAT[cat].length} services
                </span>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
                {SERVICES_BY_CAT[cat].map(svc => (
                  <Link key={svc.slug} href={`/services/${svc.slug}`} className="svc-card">
                    <p className="svc-name" style={{ fontSize: 15, fontWeight: 400, color: '#ddd5c8', margin: '0 0 10px', transition: 'color .25s' }}>
                      {svc.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#4a4540', lineHeight: 1.7, margin: 0 }}>
                      {svc.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px' }}>
        <div style={{ border: '1px solid rgba(201,168,76,0.15)', padding: '64px 80px', textAlign: 'center', background: 'rgba(201,168,76,0.02)' }}>
          <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 20 }}>Ready to Book</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Find Your Perfect Companion
          </h2>
          <p style={{ fontSize: 14, color: '#4a4540', marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}>
            Browse our verified London escorts and book your preferred service today.
          </p>
          <Link href="/london-escorts" className="browse-btn">Browse Companions</Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
