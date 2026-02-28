// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'London Escorts | Premium Companion Services | Virel',
  description: 'Exclusive premium companions in London. Verified, sophisticated, and discreet. Browse our curated selection of elite escorts available for incall and outcall services.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/london-escorts' },
}

export default async function LondonEscortsPage() {
  const models = await prisma.model.findMany({
    where: { status: 'active', visibility: 'public' },
    orderBy: { createdAt: 'desc' },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
  });

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <nav className="flex text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">London Escorts</span>
        </nav>

        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">London Escorts</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
          Discover London's finest premium companions. Each profile is verified, sophisticated,
          and available for both incall and outcall services across London's most prestigious districts.
        </p>

        {models.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {models.map((model) => {
              const photo = model.media[0]?.url;
              const age = model.stats?.age;
              const nationality = model.stats?.nationality;
              const location = model.primaryLocation?.name;

              return (
                <Link
                  key={model.id}
                  href={`/catalog/${model.slug}`}
                  className="group block bg-muted rounded-xl overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative aspect-[3/4] bg-muted-foreground/10">
                    {photo ? (
                      <img src={photo} alt={model.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-xl font-semibold">{model.name}</h3>
                      <p className="text-sm opacity-80">
                        {[age && `${age} yrs`, nationality, location].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">No companions available at the moment.</p>
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-20 grid md:grid-cols-3 gap-4">
          {['Mayfair', 'Kensington', 'Knightsbridge', 'Chelsea', 'Belgravia', 'Marylebone', 'Westminster', 'Soho', 'Canary Wharf'].map(district => (
            <Link
              key={district}
              href={`/escorts-in-${district.toLowerCase().replace(/\s+/g, '-')}`}
              className="block p-4 border border-border rounded-lg hover:border-accent transition-colors text-center"
            >
              Escorts in {district}
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  )
}
