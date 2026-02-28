// @ts-nocheck
import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export async function FeaturedModels() {
  const models = await prisma.model.findMany({
    where: { status: 'active', visibility: 'public' },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  if (!models.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <p>Companions coming soon.</p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model: any) => {
        const photo = model.media[0]?.url
        return (
          <Link key={model.id} href={`/catalog/${model.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-muted aspect-[3/4] block border border-border hover:border-primary transition-colors"
          >
            {photo
              ? <img src={photo} alt={model.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              : <div className="w-full h-full flex items-center justify-center text-6xl bg-muted">👤</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-semibold">{model.name}</h3>
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm opacity-80">
                {[model.stats?.age && `${model.stats.age} yrs`, model.primaryLocation?.name].filter(Boolean).join(' · ')}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
