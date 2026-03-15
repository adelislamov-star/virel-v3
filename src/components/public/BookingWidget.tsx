'use client'

interface Rate {
  label: string
  durationMin: number
  incallPrice: number | null
  outcallPrice: number | null
}

interface BookingWidgetProps {
  modelName: string
  modelSlug: string
  availability: string | null
  isVerified: boolean
  isExclusive: boolean
  lastActiveAt: string | null
  rates: Rate[]
}

function isActiveToday(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  const today = new Date()
  const last = new Date(lastActiveAt)
  return (
    last.getDate() === today.getDate() &&
    last.getMonth() === today.getMonth() &&
    last.getFullYear() === today.getFullYear()
  )
}

export function BookingWidget({
  modelName, modelSlug, availability,
  isVerified, isExclusive, lastActiveAt, rates,
}: BookingWidgetProps) {
  const incallRates = rates.filter(r => r.incallPrice != null && r.incallPrice > 0)
  const outcallRates = rates.filter(r => r.outcallPrice != null && r.outcallPrice > 0)
  const hasAnyPrice = incallRates.length > 0 || outcallRates.length > 0

  const whatsappUrl = process.env.NEXT_PUBLIC_AGENCY_WHATSAPP
    ? `https://wa.me/${process.env.NEXT_PUBLIC_AGENCY_WHATSAPP}?text=${encodeURIComponent(`Hi, I'd like to book ${modelName}`)}`
    : '/contact'
  const telegramUrl = process.env.NEXT_PUBLIC_AGENCY_TELEGRAM
    ? `https://t.me/${process.env.NEXT_PUBLIC_AGENCY_TELEGRAM}`
    : '/contact'

  return (
    <>
      <style>{`
        .bw-root { position:sticky; top:80px; font-family:'DM Sans',sans-serif; }
        .bw-name { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:300; color:#f5f0e8; margin:0 0 8px; }
        .bw-badges { display:flex; gap:8px; margin-bottom:24px; }
        .bw-badge { font-size:9px; letter-spacing:.14em; text-transform:uppercase; padding:4px 10px; }
        .bw-badge-v { border:1px solid rgba(74,222,128,.3); color:#4ade80; }
        .bw-badge-e { border:1px solid rgba(197,165,114,.4); color:#C5A572; }
        .bw-badge-g { border:1px solid rgba(255,255,255,.15); color:#808080; }
        .bw-badge-active { border:1px solid rgba(74,222,128,.3); color:#4ade80; display:flex; align-items:center; gap:4px; }
        .bw-active-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; animation:bw-pulse 2s infinite; }
        @keyframes bw-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .bw-section-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#808080; margin:24px 0 12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,.07); }
        .bw-rate-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.04); }
        .bw-rate-label { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:300; color:rgba(232,224,212,.8); }
        .bw-rate-price { font-size:14px; color:#C5A572; letter-spacing:.03em; }
        .bw-avail { display:flex; align-items:center; gap:8px; margin:24px 0; font-size:12px; letter-spacing:.08em; color:#4ade80; }
        .bw-avail-dot { width:8px; height:8px; border-radius:50%; background:#4ade80; }
        .bw-no-price { font-size:13px; color:#808080; font-style:italic; margin:16px 0; }
        .bw-btn { display:block; width:100%; padding:15px; text-align:center; font-size:11px; letter-spacing:.15em; text-transform:uppercase; text-decoration:none; cursor:pointer; border:none; font-family:inherit; margin-bottom:8px; transition:all .2s; box-sizing:border-box; }
        .bw-btn-primary { background:#C5A572; color:#0A0A0A; font-weight:500; }
        .bw-btn-primary:hover { background:#d4b87a; }
        .bw-btn-secondary { background:transparent; border:1px solid #333; color:#808080; }
        .bw-btn-secondary:hover { border-color:#C5A572; color:#C5A572; }
      `}</style>
      <div className="bw-root">
        <h2 className="bw-name">{modelName}</h2>
        <div className="bw-badges">
          {isExclusive && <span className="bw-badge bw-badge-e">★ Exclusive</span>}
          {isVerified && <span className="bw-badge bw-badge-v">✓ Verified Photos</span>}
          <span className="bw-badge bw-badge-g">✓ Genuine Photos</span>
          {isActiveToday(lastActiveAt) && (
            <span className="bw-badge bw-badge-active"><span className="bw-active-dot" /> Active Today</span>
          )}
        </div>

        {!hasAnyPrice && (
          <p className="bw-no-price">Contact us for pricing</p>
        )}

        {availability === 'Available Now' && (
          <div className="bw-avail">
            <span className="bw-avail-dot" />
            Available Now
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <a href={`/book?modelSlug=${modelSlug}`} className="bw-btn bw-btn-primary">Book Now</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bw-btn bw-btn-secondary">
            📱 WhatsApp
          </a>
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="bw-btn bw-btn-secondary">
            ✈ Telegram
          </a>
          <p style={{ fontSize: 11, color: '#5a5450', textAlign: 'center', marginTop: 12, letterSpacing: '.04em' }}>
            Our team typically responds within 15 minutes
          </p>
        </div>
      </div>
    </>
  )
}
