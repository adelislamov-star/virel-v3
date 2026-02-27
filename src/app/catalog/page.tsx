import { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CatalogFilters } from '@/components/CatalogFilters'
import { ModelCard } from '@/components/ModelCard'

export const metadata: Metadata = {
  title: 'Browse Companions – Virel London',
  description: 'Browse our exclusive selection of verified premium companions in London. Filter by location, age, services, and preferences.',
  openGraph: {
    title: 'Browse Companions – Virel London',
    description: 'Browse our exclusive selection of verified premium companions in London',
  },
}

// Mock data - replace with actual database query
const models = [
  {
    id: '1',
    slug: 'sophia-mayfair',
    name: 'Sophia',
    age: 24,
    nationality: 'British',
    location: ['Mayfair', 'Kensington'],
    height: 170,
    hairColor: 'Blonde',
    eyeColor: 'Blue',
    image: '/images/models/sophia.jpg',
    verified: true,
    featured: true,
  },
  // Add more models here
]

export default function CatalogPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-8">
          Browse Companions
        </h1>
        
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-20 h-fit">
            <CatalogFilters />
          </aside>

          {/* Models Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {models.length} companions available
              </p>
              <select className="border border-border rounded-lg px-4 py-2 bg-background">
                <option>Featured First</option>
                <option>Newest First</option>
                <option>Age: Low to High</option>
                <option>Age: High to Low</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {models.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center gap-2">
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                1
              </button>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                2
              </button>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                3
              </button>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
