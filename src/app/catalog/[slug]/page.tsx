// @ts-nocheck
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingForm } from '@/components/booking/BookingForm'
import { prisma } from '@/lib/db/client'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const model = await prisma.model.findUnique({ where: { slug: params.slug } })
  if (!model) return { title: 'Not Found' }
  return {
    title: `${model.name} - London Companion | Virel`,
    description: `Meet ${model.name}, a premium companion available in London.`,
  }
}

export default async function ModelProfilePage({ params }: Props) {
  const model = await prisma.model.findUnique({
    where: { slug: params.slug, status: 'active', visibility: 'public' },
    include: {
      stats: true,
      media: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' } },
      primaryLocation: true,
    },
  })

  if (!model) notFound()

  // Rates via raw query (table exists outside Prisma schema)
  let rates: any[] = []
  try {
    rates = await prisma.$queryRaw`
      SELECT duration_type, call_type, price, taxi_fee, currency, is_active
      FROM model_rates
      WHERE model_id = ${model.id} AND is_active = true
      ORDER BY price ASC
    `
  } catch (e) {
    // table may not exist yet
  }

  const primaryPhoto = model.media.find((m: any) => m.isPrimary)?.url || model.media[0]?.url
  const gallery = model.media.filter((m: any) => m.isPublic)

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="text-sm text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/london-escorts" className="hover:text-accent">London Escorts</Link>
          <span>/</span>
          <span>{model.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_400px] gap-10">
          {/* Left */}
          <div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-4">
              {primaryPhoto
                ? <img src={primaryPhoto} alt={model.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>
              }
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mb-8">
                {gallery.slice(0, 8).map((photo: any) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
                    <img src={photo.url} alt={model.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}

            {model.stats && (
              <div className="bg-muted/50 rounded-xl p-6 mb-6">
                <h2 className="font-semibold text-lg mb-4">About {model.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {model.stats.age && <div><p className="text-muted-foreground">Age</p><p className="font-medium">{model.stats.age}</p></div>}
                  {model.stats.nationality && <div><p className="text-muted-foreground">Nationality</p><p className="font-medium">{model.stats.nationality}</p></div>}
                  {model.stats.height && <div><p className="text-muted-foreground">Height</p><p className="font-medium">{model.stats.height} cm</p></div>}
                  {model.stats.weight && <div><p className="text-muted-foreground">Weight</p><p className="font-medium">{model.stats.weight} kg</p></div>}
                  {model.stats.hairColour && <div><p className="text-muted-foreground">Hair</p><p className="font-medium">{model.stats.hairColour}</p></div>}
                  {model.stats.eyeColour && <div><p className="text-muted-foreground">Eyes</p><p className="font-medium">{model.stats.eyeColour}</p></div>}
                  {model.stats.bustSize && <div><p className="text-muted-foreground">Bust</p><p className="font-medium">{model.stats.bustSize}</p></div>}
                  {model.stats.languages?.length > 0 && (
                    <div className="col-span-2"><p className="text-muted-foreground">Languages</p><p className="font-medium">{model.stats.languages.join(', ')}</p></div>
                  )}
                </div>
              </div>
            )}

            {rates.length > 0 && (
              <div className="bg-muted/50 rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4">Rates</h2>
                <div className="divide-y divide-border">
                  {rates.map((rate: any, i: number) => (
                    <div key={i} className="flex justify-between py-3">
                      <span className="text-muted-foreground capitalize">{rate.duration_type?.replace('_', ' ')} · {rate.call_type}</span>
                      <span className="font-semibold">£{Number(rate.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Booking */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="mb-4">
                <h1 className="font-serif text-3xl font-bold">{model.name}</h1>
                <p className="text-muted-foreground">
                  {[model.stats?.age && `${model.stats.age} yrs`, model.primaryLocation?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm text-green-500 font-medium">Available Now</span>
              </div>
              <BookingForm model={{ id: model.id, name: model.name, rates }} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
