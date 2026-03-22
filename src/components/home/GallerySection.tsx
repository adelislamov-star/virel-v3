import Image from 'next/image'
import Link from 'next/link'

interface CompanionCard {
  slug: string
  name: string
  tagline: string | null
  photoUrl: string | null
  district: string | null
}

interface GallerySectionProps {
  companions: CompanionCard[]
}

export function GallerySection({ companions }: GallerySectionProps) {
  if (companions.length === 0) return null

  return (
    <section className="section">
      <div className="sec-top">
        <div>
          <p className="sec-eyebrow">Our Companions</p>
          <h2 className="sec-h2">A curated <em>selection</em></h2>
        </div>
        <Link href="/companions" className="sec-link">View all companions</Link>
      </div>
      <div className="gallery-grid">
        {companions.map((c) => (
          <Link key={c.slug} href={`/companions/${c.slug}`} className="gc">
            {c.photoUrl ? (
              <Image
                src={c.photoUrl}
                alt={`${c.name} — London companion Vaurel`}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center 10%' }}
                sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#161410' }} />
            )}
            <div className="gc-overlay" />
            <div className="gc-body">
              <div className="gc-name">{c.name}</div>
              {c.tagline && <div className="gc-tagline">{c.tagline}</div>}
              {c.district && <div className="gc-loc">{c.district}</div>}
            </div>
            <span className="gc-btn">View Profile</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
