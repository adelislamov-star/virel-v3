import { Metadata } from 'next/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/ModelCard'
import { prisma } from '@/lib/db/client'

interface Props {
  params: {
    slug: string
  }
}

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const servicePage = await prisma.sEOWhitelist.findUnique({
    where: {
      slug: params.slug,
      type: 'SERVICE',
      isPublished: true,
    },
  })
  
  if (!servicePage) {
    return { title: 'Service Not Found' }
  }
  
  return {
    title: servicePage.title,
    description: servicePage.metaDesc,
    robots: {
      index: servicePage.isIndexable,
      follow: true,
    },
    alternates: {
      canonical: servicePage.canonicalOverride || servicePage.url,
    },
    openGraph: {
      title: servicePage.title,
      description: servicePage.metaDesc,
      url: servicePage.url,
    },
  }
}

export default async function ServicePage({ params }: Props) {
  const servicePage = await prisma.sEOWhitelist.findUnique({
    where: {
      slug: params.slug,
      type: 'SERVICE',
      isPublished: true,
    },
  })
  
  if (!servicePage) {
    notFound()
  }
  
  // Extract service name
  const serviceName = params.slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  
  // Fetch models offering this service
  // TODO: Add service filtering in model schema
  const models = await prisma.model.findMany({
    where: {
      status: 'ACTIVE',
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
  
  const faqData = servicePage.faqJson as any
  
  // Schema
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `https://virel.com${servicePage.url}#service`,
        name: servicePage.h1,
        description: servicePage.metaDesc,
        provider: {
          '@type': 'Organization',
          name: 'Virel',
          url: 'https://virel.com',
        },
        areaServed: {
          '@type': 'City',
          name: 'London',
        },
      },
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
            name: 'Services',
            item: 'https://virel.com/services',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: serviceName,
            item: `https://virel.com${servicePage.url}`,
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
        
        <div className="container mx-auto px-4 py-4">
          <nav className="flex text-sm text-muted-foreground">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/london-escorts" className="hover:text-accent">Services</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{serviceName}</span>
          </nav>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {servicePage.h1}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {servicePage.metaDesc}
            </p>
          </div>
          
          {/* SEO Content */}
          <div className="prose prose-lg max-w-none mb-16">
            <div dangerouslySetInnerHTML={{ __html: servicePage.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>') }} />
          </div>
          
          {/* Models offering this service */}
          {models.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">
                Companions Offering {serviceName}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {models.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            </div>
          )}
          
          {/* FAQ */}
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
                          <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          
          {/* Related Services */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              Other Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['GFE', 'Dinner Date', 'Travel Companion', 'VIP']
                .filter(s => s.toLowerCase().replace(/\s+/g, '-') !== params.slug)
                .map(service => (
                  <Link
                    key={service}
                    href={`/services/${service.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block p-4 border border-border rounded-lg hover:border-accent transition-colors"
                  >
                    <span className="font-semibold">{service}</span>
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
