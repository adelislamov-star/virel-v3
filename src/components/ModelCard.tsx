import Link from 'next/link'
import Image from 'next/image'

interface ModelCardProps {
  model: {
    id: string
    slug: string
    name: string
    age: number
    location: string[]
    hairColor: string
    image: string
    verified: boolean
    featured: boolean
  }
}

export function ModelCard({ model }: ModelCardProps) {
  return (
    <Link
      href={`/catalog/${model.slug}`}
      className="group block bg-muted rounded-lg overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={model.image}
          alt={model.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {model.featured && (
          <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg">{model.name}</h3>
          {model.verified && (
            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {model.age} years • {model.hairColor}
        </p>
        <p className="text-xs text-muted-foreground">
          {model.location.join(', ')}
        </p>
      </div>
    </Link>
  )
}
