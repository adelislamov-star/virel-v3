import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CatalogFilters } from '@/components/CatalogFilters'
import { ModelCard } from '@/components/ModelCard'
import { prisma } from '@/lib/db/client'

interface SearchParams {
  page?: string
  // Filters (non-indexable unless in whitelist)
  age_min?: string
  age_max?: string
  district?: string
  hair?: string
  nationality?: string
}

interface Props {
  searchParams: SearchParams
}

// Metadata generation
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseInt(searchParams.page || '1')
  const isFiltered = Object.keys(searchParams).some(k => k !== 'page')
  
  // Base metadata
  const baseTitle = 'London Escorts | Premium Companion Services | Virel'
  const baseDesc = 'Exclusive premium companions in London. Verified, sophisticated, and discreet. Browse our curated selection of elite escorts available for incall and outcall services.'
  
  // Pagination metadata
  const title = page > 1 ? `London Escorts - Page ${page} | Virel` : baseTitle
  const description = page > 1 ? `${baseDesc} Page ${page}.` : baseDesc
  
  // Canonical strategy:
  // - Main catalog: canonical to itself
  // - Pagination: canonical to self (allows indexation)
  // - Filtered pages: canonical to base catalog (noindex)
  const canonical = isFiltered 
    ? '/london-escorts'
    : page > 1 
      ? `/london-escorts/page/${page}`
      : '/london-escorts'
  
  // Robots for filtered pages
  const robots = isFiltered ? {
    index: false,
    follow: true,
  } : {
    index: true,
    follow: true,
  }
  
  return {
    title,
    description,
    robots,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function LondonEscortsPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page || '1')
  const perPage = 12
  const skip = (page - 1) * perPage
  
  // Build where clause from filters
  const where: any = {
    status: 'ACTIVE',
  }
  
  // Apply filters if present
  if (searchParams.age_min) {
    where.age = { ...where.age, gte: parseInt(searchParams.age_min) }
  }
  if (searchParams.age_max) {
    where.age = { ...where.age, lte: parseInt(searchParams.age_max) }
  }
  if (searchParams.district) {
    where.location = { has: searchParams.district }
  }
  if (searchParams.hair) {
    where.hairColor = searchParams.hair
  }
  if (searchParams.nationality) {
    where.nationality = searchParams.nationality
  }
  
  // Fetch models
  const [models, totalCount] = await Promise.all([
    prisma.model.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: perPage,
      skip,
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
    }),
    prisma.model.count({ where }),
  ])
  
  const totalPages = Math.ceil(totalCount / perPage)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1
  
  // Check if filtered (non-whitelist)
  const isFiltered = Object.keys(searchParams).some(k => k !== 'page')
  
  // JSON-LD Schema
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      // CollectionPage
      {
        '@type': 'CollectionPage',
        '@id': 'https://virel.com/london-escorts#page',
        url: 'https://virel.com/london-escorts',
        name: 'London Escorts',
        description: 'Premium companion services in London',
        isPartOf: {
          '@id': 'https://virel.com/#website',
        },
        breadcrumb: {
          '@id': 'https://virel.com/london-escorts#breadcrumb',
        },
      },
      // ItemList
      {
        '@type': 'ItemList',
        itemListElement: models.map((model, index) => ({
          '@type': 'ListItem',
          position: skip + index + 1,
          url: `https://virel.com/catalog/${model.slug}`,
          name: model.name,
        })),
      },
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://virel.com/london-escorts#breadcrumb',
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
            <span className="text-foreground">London Escorts</span>
            {page > 1 && (
              <>
                <span className="mx-2">/</span>
                <span className="text-foreground">Page {page}</span>
              </>
            )}
          </nav>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              London Escorts
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Discover London's finest premium companions. Each profile is verified, sophisticated, 
              and available for both incall and outcall services across London's most prestigious districts.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:sticky lg:top-20 h-fit">
              <CatalogFilters currentParams={searchParams} />
            </aside>

            {/* Models Grid */}
            <div>
              {/* Results Info */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {totalCount} {totalCount === 1 ? 'companion' : 'companions'} available
                  {page > 1 && ` (Page ${page} of ${totalPages})`}
                </p>
                <select 
                  className="border border-border rounded-lg px-4 py-2 bg-background"
                  defaultValue="featured"
                >
                  <option value="featured">Featured First</option>
                  <option value="newest">Newest First</option>
                  <option value="age_asc">Age: Low to High</option>
                  <option value="age_desc">Age: High to Low</option>
                </select>
              </div>

              {/* Models Grid */}
              {models.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {models.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground mb-4">
                    No companions match your current filters
                  </p>
                  <Link 
                    href="/london-escorts"
                    className="text-accent hover:underline"
                  >
                    Clear all filters
                  </Link>
                </div>
              )}

              {/* Pagination - HTML links for SEO */}
              {totalPages > 1 && (
                <nav className="flex justify-center gap-2" aria-label="Pagination">
                  {hasPrevPage && (
                    <Link
                      href={page === 2 ? '/london-escorts' : `/london-escorts/page/${page - 1}`}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (page <= 4) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = page - 3 + i
                    }
                    
                    const isCurrentPage = pageNum === page
                    
                    return (
                      <Link
                        key={pageNum}
                        href={pageNum === 1 ? '/london-escorts' : `/london-escorts/page/${pageNum}`}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          isCurrentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border hover:bg-muted'
                        }`}
                        aria-current={isCurrentPage ? 'page' : undefined}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                  
                  {hasNextPage && (
                    <Link
                      href={`/london-escorts/page/${page + 1}`}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
              
              {/* SEO Content */}
              {page === 1 && !isFiltered && (
                <div className="mt-16 prose prose-lg max-w-none">
                  <h2>Premium Companion Services in London</h2>
                  <p>
                    Welcome to London's premier companion platform. Our carefully curated selection 
                    represents the finest premium companionship services across the capital's most 
                    prestigious districts.
                  </p>
                  
                  <h3>Why Choose Our London Companions</h3>
                  <p>
                    Each companion undergoes comprehensive verification, ensuring authenticity and 
                    professionalism. From Mayfair's exclusive addresses to Kensington's cultural 
                    sophistication, our companions understand and embody the elegance of London's 
                    premium districts.
                  </p>
                  
                  <h3>Areas We Serve</h3>
                  <div className="grid md:grid-cols-3 gap-4 not-prose">
                    {['Mayfair', 'Kensington', 'Knightsbridge', 'Chelsea', 'Belgravia', 
                      'Marylebone', 'Westminster', 'Soho', 'Canary Wharf'].map(district => (
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
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}
