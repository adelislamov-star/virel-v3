import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    district: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Escorts in ${params.district} | Virel London`,
  }
}

export default async function GeoPage({ params }: Props) {
  const districtName = params.district
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-4xl font-bold mb-4">
          Escorts in {districtName}
        </h1>
        <p className="text-muted-foreground">Coming soon.</p>
        <Link href="/london-escorts" className="text-accent hover:underline mt-4 inline-block">
          Browse all London companions →
        </Link>
      </div>
    </main>
  )
}

// Generate metadata from whitelist
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const geoPage = await prisma.sEOWhitelist.findUnique({
    where: {
      slug: `escorts-in-${params.district}`,
      type: 'GEO',
      isPublished: true,
    },
  })
  
  if (!geoPage) {
    return {
      title: 'Page Not Found',
    }
  }
  
  return {
    title: geoPage.title,
    description: geoPage.metaDesc,
    robots: {
      index: geoPage.isIndexable,
      follow: true,
    },
    alternates: {
      canonical: geoPage.canonicalOverride || geoPage.url,
    },
    openGraph: {
      title: geoPage.title,
      description: geoPage.metaDesc,
      url: geoPage.url,
      type: 'website',
    },
  }
}

export default async function GeoPage({ params }: Props) {
  // Fetch whitelist page
  const geoPage = await prisma.sEOWhitelist.findUnique({
    where: {
      slug: `escorts-in-${params.district}`,
      type: 'GEO',
      isPublished: true,
    },
  })
  
  if (!geoPage) {
    notFound()
  }
  
  // Extract district name from slug
  const districtName = params.district
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  // Fetch models serving this district
  const models = await prisma.model.findMany({
    where: {
      status: 'ACTIVE',
      location: {
        has: districtName,
      },
    },
    orderBy: [
      { featured: 'desc' },
      { priority: 'desc' },
    ],
    take: 12,
    select: {
      id: true,
      slug: true,
      name: true,
      age: true,
      nationality: true,
      location: true,
      hairColor: true,
      eyeColor: true,
      coverPhoto: true,
      photos: true,
      verified: true,
      featured: true,
    },
  })
  
  // Parse FAQ from JSON
  const faqData = geoPage.faqJson as any
  
  // JSON-LD Schema
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      // CollectionPage
      {
        '@type': 'CollectionPage',
        '@id': `https://virel.com${geoPage.url}#page`,
        url: `https://virel.com${geoPage.url}`,
        name: geoPage.h1,
        description: geoPage.metaDesc,
        isPartOf: {
          '@id': 'https://virel.com/#website',
        },
      },
      // ItemList
      {
        '@type': 'ItemList',
        itemListElement: models.map((model, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://virel.com/catalog/${model.slug}`,
          name: model.name,
        })),
      },
      // FAQPage
      ...(faqData?.questions ? [{
        '@type': 'FAQPage',
        mainEntity: faqData.questions.map((faq: any) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }] : []),
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://virel.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'London Escorts',
            item: 'https://virel.com/london-escorts',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `Escorts in ${districtName}`,
            item: `https://virel.com${geoPage.url}`,
          },
        ],
      },
    ],
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      
      <main className="min-h-screen">
        <Header />
        
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/london-escorts" className="hover:text-accent">London Escorts</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Escorts in {districtName}</span>
          </nav>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {geoPage.h1}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {geoPage.metaDesc}
            </p>
          </div>
          
          {/* Models Grid */}
          {models.length >= 8 ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  Available Companions in {districtName}
                </h2>
                <p className="text-muted-foreground">
                  {models.length} verified companions serving {districtName}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {models.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 mb-16">
              <p className="text-lg text-muted-foreground mb-4">
                Currently limited availability in {districtName}
              </p>
              <Link 
                href="/london-escorts"
                className="text-accent hover:underline"
              >
                Browse all London companions →
              </Link>
            </div>
          )}
          
          {/* SEO Content */}
          <div className="prose prose-lg max-w-none mb-16">
            <div dangerouslySetInnerHTML={{ __html: geoPage.content.replace(/\n/g, '<br/>') }} />
          </div>
          
          {/* FAQ Section */}
          {faqData?.questions && faqData.questions.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqData.questions.map((faq: any, index: number) => (
                  <div key={index} className="border border-border rounded-lg overflow-hidden">
                    <details className="group">
                      <summary className="px-6 py-4 cursor-pointer font-semibold hover:bg-muted/50 transition-colors list-none">
                        <div className="flex items-center justify-between">
                          <span>{faq.question}</span>
                          <svg 
                            className="w-5 h-5 transition-transform group-open:rotate-180" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>
                      <div className="px-6 pb-4 text-muted-foreground">
                        {faq.answer}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Related Areas */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              Other London Districts
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {['Mayfair', 'Kensington', 'Knightsbridge', 'Chelsea', 'Belgravia', 
                'Marylebone', 'Westminster', 'Soho', 'Canary Wharf']
                .filter(d => d !== districtName)
                .slice(0, 6)
                .map(district => (
                  <Link
                    key={district}
                    href={`/escorts-in-${district.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block p-4 border border-border rounded-lg hover:border-accent transition-colors"
                  >
                    <span className="font-semibold">Escorts in {district}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}
