'use client'

import Link from 'next/link'
import Image from 'next/image'

// Mock data - replace with real API call
const featuredModels = [
  {
    id: '1',
    slug: 'sophia-mayfair',
    name: 'Sophia',
    age: 24,
    location: 'Mayfair',
    image: '/images/models/sophia.jpg',
    verified: true,
    featured: true,
  },
  {
    id: '2',
    slug: 'isabella-kensington',
    name: 'Isabella',
    age: 26,
    location: 'Kensington',
    image: '/images/models/isabella.jpg',
    verified: true,
    featured: true,
  },
  {
    id: '3',
    slug: 'olivia-chelsea',
    name: 'Olivia',
    age: 23,
    location: 'Chelsea',
    image: '/images/models/olivia.jpg',
    verified: true,
    featured: true,
  },
  {
    id: '4',
    slug: 'emma-knightsbridge',
    name: 'Emma',
    age: 25,
    location: 'Knightsbridge',
    image: '/images/models/emma.jpg',
    verified: true,
    featured: true,
  },
  {
    id: '5',
    slug: 'charlotte-belgravia',
    name: 'Charlotte',
    age: 27,
    location: 'Belgravia',
    image: '/images/models/charlotte.jpg',
    verified: true,
    featured: true,
  },
  {
    id: '6',
    slug: 'amelia-notting-hill',
    name: 'Amelia',
    age: 24,
    location: 'Notting Hill',
    image: '/images/models/amelia.jpg',
    verified: true,
    featured: true,
  },
]

export function FeaturedModels() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredModels.map((model) => (
        <Link
          key={model.id}
          href={`/catalog/${model.slug}`}
          className="group relative overflow-hidden rounded-lg bg-muted aspect-[3/4] block"
        >
          <Image
            src={model.image}
            alt={model.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-semibold">{model.name}</h3>
              {model.verified && (
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm opacity-90">{model.age} • {model.location}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
