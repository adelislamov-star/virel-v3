// @ts-nocheck
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FeaturedModels } from '@/components/FeaturedModels'
import { FAQ } from '@/components/FAQ'

export const metadata = {
  title: 'Virel | Premium Escort Agency London',
  description: 'London\'s premier escort agency. Verified, sophisticated companions for incall and outcall. Discreet, elegant, available 24/7 across all London districts.',
  alternates: { canonical: 'https://virel-v3.vercel.app' },
}

const DISTRICTS = [
  'Mayfair', 'Kensington', 'Knightsbridge', 'Chelsea', 'Belgravia',
  'Marylebone', 'Westminster', 'Soho', 'Canary Wharf', 'Notting Hill',
  'Paddington', 'Victoria',
]

const POPULAR_SERVICES = [
  { slug: 'gfe', name: 'GFE' },
  { slug: 'owo', name: 'OWO' },
  { slug: 'dfk', name: 'DFK' },
  { slug: 'nuru-massage', name: 'Nuru Massage' },
  { slug: 'a-level', name: 'A Level' },
  { slug: 'outcall', name: 'Outcall' },
  { slug: 'incall', name: 'Incall' },
  { slug: 'overnight', name: 'Overnight' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative bg-zinc-950 py-28 md:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950" />
        <div className="relative container mx-auto px-4 text-center text-white">
          <p className="text-sm uppercase tracking-widest text-zinc-400 mb-4">London's Premier Agency</p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Exclusive Companion<br />Services in London
          </h1>
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Verified, sophisticated companions for discerning gentlemen.
            Incall and outcall across London's finest districts.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/london-escorts"
              className="bg-white text-zinc-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-100 transition-colors"
            >
              Browse Companions
            </Link>
            <Link href="/services"
              className="border border-zinc-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-zinc-400 transition-colors"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: '✓', title: '100% Verified', text: 'Every companion is personally verified with authentic photos' },
              { icon: '🔒', title: 'Complete Discretion', text: 'Your privacy is our highest priority — total confidentiality' },
              { icon: '⏱', title: '24/7 Available', text: 'Book anytime, day or night, with fast confirmation' },
            ].map(item => (
              <div key={item.title} className="p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold mb-3">Featured Companions</h2>
            <p className="text-muted-foreground">Our most sought-after London escorts</p>
          </div>
          <FeaturedModels />
          <div className="text-center mt-10">
            <Link href="/london-escorts"
              className="inline-block border border-border px-8 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
            >
              View All Companions →
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold mb-8 text-center">Popular Services</h2>
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            {POPULAR_SERVICES.map(s => (
              <Link key={s.slug} href={`/services/${s.slug}`}
                className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:border-primary hover:shadow-sm transition-all"
              >
                {s.name}
              </Link>
            ))}
            <Link href="/services"
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* Districts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold mb-8 text-center">Escorts by District</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {DISTRICTS.map(d => (
              <Link key={d} href={`/escorts-in/${d.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-3 border border-border rounded-xl text-center text-sm hover:border-primary transition-colors"
              >
                Escorts in {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-serif text-4xl font-bold text-center mb-12">FAQ</h2>
          <FAQ />
        </div>
      </section>

      <Footer />
    </main>
  )
}
