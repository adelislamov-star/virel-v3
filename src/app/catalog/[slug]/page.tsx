import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingForm } from '@/components/booking/BookingForm'
import { prisma } from '@/lib/db/client'

interface ModelProfileProps {
  params: {
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ModelProfileProps): Promise<Metadata> {
  const model = await prisma.model.findUnique({
    where: { slug: params.slug },
  })

  if (!model) {
    return {
      title: 'Model Not Found',
    }
  }

  const title = model.metaTitle || `${model.name} - ${model.location[0]} Companion | Virel`
  const description = model.metaDescription || 
    `Meet ${model.name}, ${model.age} year old ${model.nationality} companion in ${model.location.join(', ')}. ${model.description.slice(0, 150)}...`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [model.photos[0]],
    },
    alternates: {
      canonical: `/catalog/${model.slug}`,
    },
  }
}

export default async function ModelProfilePage({ params }: ModelProfileProps) {
  const model = await prisma.model.findUnique({
    where: { slug: params.slug },
    include: {
      availability: {
        where: {
          date: {
            gte: new Date(),
          },
        },
        take: 7,
      },
    },
  })

  if (!model || model.status === 'ARCHIVED') {
    notFound()
  }

  // JSON-LD Schema for Person/Profile
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: model.name,
    description: model.description,
    image: model.photos[0],
    knowsLanguage: model.languages,
    address: {
      '@type': 'PostalAddress',
      addressLocality: model.location.join(', '),
      addressCountry: 'GB',
    },
  }

  const services = model.services as any

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className="min-h-screen">
        <Header />

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex text-sm text-muted-foreground">
            <a href="/" className="hover:text-accent">Home</a>
            <span className="mx-2">/</span>
            <a href="/catalog" className="hover:text-accent">Browse</a>
            <span className="mx-2">/</span>
            <span className="text-foreground">{model.name}</span>
          </nav>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left Column - Photos & Info */}
            <div>
              {/* Main Photo */}
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-6">
                <Image
                  src={model.photos[0]}
                  alt={model.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                {model.status === 'ON_HOLIDAY' && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold">
                    On Holiday
                  </div>
                )}
                {model.verified && (
                  <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>

              {/* Photo Gallery */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {model.photos.slice(1, 7).map((photo, index) => (
                  <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden">
                    <Image
                      src={photo}
                      alt={`${model.name} photo ${index + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform cursor-pointer"
                      sizes="(max-width: 768px) 33vw, 20vw"
                    />
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">About {model.name}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {model.description}
                </p>
              </div>

              {/* Services & Rates */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Services & Rates</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {services.incall && (
                    <div className="border border-border rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-2">Incall</h3>
                      <p className="text-3xl font-bold text-accent mb-2">
                        £{services.rates.incall}
                        <span className="text-base font-normal text-muted-foreground">/hour</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Visit {model.name} at her luxury apartment
                      </p>
                    </div>
                  )}
                  {services.outcall && (
                    <div className="border border-border rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-2">Outcall</h3>
                      <p className="text-3xl font-bold text-accent mb-2">
                        £{services.rates.outcall}
                        <span className="text-base font-normal text-muted-foreground">/hour</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {model.name} comes to your location
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Locations */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Service Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {model.location.map((loc) => (
                    <a
                      key={loc}
                      href={`/areas/${loc.toLowerCase().replace(/\s+/g, '-')}`}
                      className="px-4 py-2 border border-border rounded-lg hover:border-accent hover:text-accent transition-colors"
                    >
                      {loc}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking & Details */}
            <div>
              {/* Quick Info Card */}
              <div className="sticky top-20 space-y-6">
                <div className="bg-muted/30 rounded-lg p-6">
                  <h1 className="font-serif text-3xl font-bold mb-2">{model.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <span>{model.age} years</span>
                    <span>•</span>
                    <span>{model.nationality}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Height</span>
                      <span className="font-medium">{model.height} cm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hair</span>
                      <span className="font-medium">{model.hairColor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Eyes</span>
                      <span className="font-medium">{model.eyeColor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bust</span>
                      <span className="font-medium">{model.breastSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Languages</span>
                      <span className="font-medium">{model.languages.join(', ')}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{model.location.join(', ')}</span>
                    </div>
                  </div>

                  {model.status === 'ACTIVE' ? (
                    <a
                      href="#booking-form"
                      className="block w-full bg-accent hover:bg-accent/90 text-accent-foreground text-center py-3 rounded-lg font-semibold transition-all"
                    >
                      Book Now
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-muted text-muted-foreground py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Currently Unavailable
                    </button>
                  )}
                </div>

                {/* Booking Form */}
                {model.status === 'ACTIVE' && (
                  <div id="booking-form" className="bg-muted/30 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Book {model.name}</h3>
                    <BookingForm model={model} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Models */}
          <div className="mt-16">
            <h2 className="font-serif text-3xl font-bold mb-8">Similar Companions</h2>
            {/* Add SimilarModels component here */}
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}
