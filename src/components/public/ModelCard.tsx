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
    <>
      <style>{`
        .mc-card { position:relative; aspect-ratio:3/4; overflow:hidden; background:#111; display:block; text-decoration:none; }
        .mc-card img { width:100%; height:100%; object-fit:cover; transition:transform 1s cubic-bezier(.25,.46,.45,.94); filter:grayscale(10%); }
        .mc-card:hover img { transform:scale(1.06); filter:grayscale(0%); }
        .mc-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.3) 40%,transparent 70%); }
        .mc-content { position:absolute; bottom:0; left:0; right:0; padding:28px 24px; }
        .mc-avail { display:inline-flex; align-items:center; gap:6px; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#4ade80; margin-bottom:10px; }
        .mc-avail-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; }
        .mc-name { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:#fff; margin:0 0 4px; }
        .mc-tagline { font-size:11px; letter-spacing:.08em; color:rgba(255,255,255,.45); text-transform:uppercase; margin:0 0 10px; line-height:1.4; }
        .mc-district { font-size:11px; letter-spacing:.06em; color:rgba(255,255,255,.4); margin:0 0 4px; }
        .mc-price { font-size:13px; letter-spacing:.05em; text-transform:uppercase; color:#C5A572; margin:6px 0 0; }
        .mc-badges { display:flex; gap:6px; margin-top:10px; }
        .mc-badge { font-size:9px; letter-spacing:.12em; text-transform:uppercase; padding:3px 8px; border:1px solid rgba(255,255,255,.15); color:rgba(255,255,255,.6); }
        .mc-badge-excl { border-color:rgba(197,165,114,.4); color:#C5A572; }
        .mc-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#0f0f0f,#1a1a1a); }
      `}</style>
      <Link href={`/companions/${slug}`} className="mc-card">
        {coverPhotoUrl ? (
          <Image
            fill
            src={coverPhotoUrl}
            alt={name}
            style={{ objectFit: 'cover' }}
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
    </>
  )
}
