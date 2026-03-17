import Link from 'next/link'
import Image from 'next/image'

export interface ModelCardProps {
  name: string
  slug: string
  tagline: string | null
  coverPhotoUrl: string | null
  availability: string | null
  isVerified: boolean
  isExclusive: boolean
  districtName: string | null
  minIncallPrice: number | null
}

export function ModelCard({
  name, slug, tagline, coverPhotoUrl, availability,
  isVerified, isExclusive, districtName, minIncallPrice,
}: ModelCardProps) {
  return (
      <Link href={`/companions/${slug}`} className="mc-card">
        {coverPhotoUrl ? (
          <Image
            width={400}
            height={500}
            src={coverPhotoUrl}
            alt={name}
            style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
          />
        ) : (
          <div className="mc-placeholder">
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 64, color: '#2a2520', fontWeight: 300 }}>
              {name.charAt(0)}
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.18em', color: '#2a2520', textTransform: 'uppercase', marginTop: 8 }}>
              Photo Coming Soon
            </span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 5 }}>
          <span style={{ fontSize: 10, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, letterSpacing: '0.55em', color: 'rgba(197, 165, 114, 0.5)', textTransform: 'uppercase' }}>VAUREL</span>
        </div>
        <div className="mc-overlay" />
        <div className="mc-content">
          {availability === 'Available Now' && (
            <div className="mc-avail">
              <span className="mc-avail-dot" />
              Available Now
            </div>
          )}
          <h3 className="mc-name">{name}</h3>
          {tagline && <p className="mc-tagline">{tagline}</p>}
          {districtName && <p className="mc-district">📍 {districtName}</p>}
          {minIncallPrice != null && minIncallPrice > 0 && (
            <p className="mc-price">From £{minIncallPrice.toLocaleString('en-GB')}/hr</p>
          )}
          {(isVerified || isExclusive) && (
            <div className="mc-badges">
              {isVerified && <span className="mc-badge">✓ Verified</span>}
              {isExclusive && <span className="mc-badge mc-badge-excl">★ Exclusive</span>}
            </div>
          )}
        </div>
      </Link>
  )
}
