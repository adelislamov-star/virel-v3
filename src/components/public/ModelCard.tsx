import Link from 'next/link'
import Image from 'next/image'

export interface ModelCardProps {
  name: string
  slug: string
  nationality: string | null
  coverPhotoUrl: string | null
  availability: string | null
  districtName: string | null
  minIncallPrice: number | null
}

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
}

export function ModelCard({
  name, slug, nationality, coverPhotoUrl, availability,
  districtName, minIncallPrice,
}: ModelCardProps) {
  const displayName = toTitleCase(name)
  const isAvailable = availability === 'Available Now'

  return (
    <Link href={`/companions/${slug}`} className="card">
      <div className="card-img">
        {coverPhotoUrl ? (
          <Image
            src={coverPhotoUrl}
            alt={`${displayName} — London companion Vaurel`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="card-placeholder">
            <span className="card-placeholder-letter">{displayName.charAt(0)}</span>
          </div>
        )}
        <div className="card-img-overlay" />
        <span className={`card-avail${isAvailable ? ' online' : ''}`} />
        <span className="card-enquire">View Profile</span>
      </div>
      <div className="card-info">
        <div className="card-name">{displayName}</div>
        <div className="card-meta">
          {nationality && <span className="card-tag">{nationality}</span>}
          {nationality && districtName && <span className="card-sep" />}
          {districtName && <span className="card-location">{districtName}</span>}
        </div>
        {minIncallPrice != null && minIncallPrice > 0 && (
          <div className="card-price">From £{minIncallPrice.toLocaleString('en-GB')} / hr</div>
        )}
      </div>
    </Link>
  )
}
