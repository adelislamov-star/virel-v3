// @ts-nocheck
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FeaturedModels } from '@/components/FeaturedModels'
import { FAQ } from '@/components/FAQ'

export const metadata = {
  title: 'London Escorts | Premium Escort Agency London | Virel',
  description: 'London\'s premier escort agency. Verified, sophisticated companions for incall and outcall. Discreet, elegant, available 24/7 across all London districts.',
  alternates: { canonical: 'https://virel-v3.vercel.app' },
}

const DISTRICTS = [
  { name: 'Mayfair', slug: 'mayfair' },
  { name: 'Kensington', slug: 'kensington' },
  { name: 'Knightsbridge', slug: 'knightsbridge' },
  { name: 'Chelsea', slug: 'chelsea' },
  { name: 'Belgravia', slug: 'belgravia' },
  { name: 'Marylebone', slug: 'marylebone' },
  { name: 'Westminster', slug: 'westminster' },
  { name: 'Soho', slug: 'soho' },
  { name: 'Canary Wharf', slug: 'canary-wharf' },
  { name: 'Notting Hill', slug: 'notting-hill' },
  { name: 'Paddington', slug: 'paddington' },
  { name: 'Victoria', slug: 'victoria' },
]

const POPULAR_SERVICES = [
  { slug: 'gfe', name: 'GFE – Girlfriend Experience' },
  { slug: 'dinner-date', name: 'Dinner Date' },
  { slug: 'travel-companion', name: 'Travel Companion' },
  { slug: 'vip', name: 'VIP Escort' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-zinc-950 py-32 md:py-48 overflow-hidden">
        {/* layered gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_rgba(120,80,255,0.08),_transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,_rgba(255,180,50,0.04),_transparent)]" />
          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative container mx-auto px-4 text-center text-white max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-zinc-400 mb-8 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            London's Premier Agency
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            Elite London Escorts &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
              Companion Services
            </span>
          </h1>
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Verified, sophisticated companions for discerning gentlemen.
            Incall and outcall across London's finest districts.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/london-escorts"
              className="bg-amber-400 text-zinc-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
            >
              Browse Companions
            </Link>
            <Link href="/contact"
              className="border border-zinc-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-zinc-300 hover:bg-white/5 transition-colors"
            >
              Book Now
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 flex justify-center gap-12 text-center">
            {[
              { value: '100%', label: 'Verified Photos' },
              { value: '24/7', label: 'Available' },
              { value: '30min', label: 'Confirmation' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-amber-400">{s.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-14 border-y border-border bg-zinc-900/40">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: '✦',
                title: '100% Verified',
                text: 'Every companion is personally verified. Authentic photos, real profiles — guaranteed.',
              },
              {
                icon: '◈',
                title: 'Complete Discretion',
                text: 'Your privacy is our highest priority. Total confidentiality on every booking.',
              },
              {
                icon: '◉',
                title: 'Premium Selection',
                text: 'Handpicked companions available across Mayfair, Chelsea, Kensington and beyond.',
              },
            ].map(item => (
              <div key={item.title} className="p-6">
                <div className="text-amber-400 text-2xl mb-3 font-light">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COMPANIONS ── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-3">Handpicked for you</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3">Featured Companions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our most sought-after London escorts — verified, sophisticated, available now.
            </p>
          </div>
          <FeaturedModels />
          <div className="text-center mt-12">
            <Link href="/london-escorts"
              className="inline-flex items-center gap-2 border border-border px-8 py-3.5 rounded-xl font-semibold hover:bg-muted hover:border-amber-400/50 transition-all"
            >
              View All Companions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20 bg-muted/20 border-y border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-3">What we offer</p>
            <h2 className="font-serif text-4xl font-bold">Popular Services</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {POPULAR_SERVICES.map(s => (
              <Link key={s.slug} href={`/services/${s.slug}`}
                className="group flex items-center justify-between p-5 border border-border rounded-xl hover:border-amber-400/60 hover:bg-amber-400/5 transition-all"
              >
                <span className="font-medium">{s.name}</span>
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services" className="text-sm text-muted-foreground hover:text-amber-400 transition-colors">
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* ── DISTRICTS ── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-3">London coverage</p>
            <h2 className="font-serif text-4xl font-bold mb-3">Escorts by District</h2>
            <p className="text-muted-foreground">Available across all major London areas</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {DISTRICTS.map(d => (
              <Link key={d.slug} href={`/escorts-in/${d.slug}`}
                className="group p-4 border border-border rounded-xl text-center text-sm hover:border-amber-400/60 hover:bg-amber-400/5 transition-all"
              >
                <span className="font-medium">{d.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-muted/20 border-y border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-3">Simple process</p>
            <h2 className="font-serif text-4xl font-bold">How to Book</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse & Choose', text: 'Browse our curated selection of verified companions and choose your perfect match.' },
              { step: '02', title: 'Submit Request', text: 'Fill in the booking form with your preferred date, time, and duration.' },
              { step: '03', title: 'Confirmation', text: 'Receive confirmation within 30 minutes. Discreet, professional, every time.' },
            ].map(item => (
              <div key={item.step} className="text-center p-6">
                <div className="text-4xl font-bold text-amber-400/30 mb-4 font-serif">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/london-escorts"
              className="bg-amber-400 text-zinc-900 px-8 py-4 rounded-xl font-semibold hover:bg-amber-300 transition-colors"
            >
              Browse Companions
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-3">Got questions?</p>
            <h2 className="font-serif text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <FAQ />
          <div className="text-center mt-10">
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-amber-400 transition-colors">
              View all questions →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
