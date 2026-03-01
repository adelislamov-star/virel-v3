'use client'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        .f-link { font-size:13px; color:#4a4540; text-decoration:none; transition:color .2s; }
        .f-link:hover { color:#ddd5c8; }
        .f-contact { font-size:11px; letter-spacing:.1em; color:#6b6560; text-decoration:none; text-transform:uppercase; transition:color .2s; }
        .f-contact:hover { color:#c9a84c; }
      `}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 60 }}>

          {/* Brand */}
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', marginBottom: 16, letterSpacing: '.04em' }}>Virel</p>
            <p style={{ fontSize: 13, color: '#4a4540', lineHeight: 1.8, maxWidth: 260 }}>
              Premium companion services in London. Discreet, sophisticated, and professional.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <a href="https://t.me/virel_bookings" className="f-contact">Telegram</a>
              <a href="mailto:bookings@virel.com" className="f-contact">Email</a>
            </div>
          </div>

          {/* Companions */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Companions</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['/london-escorts', 'London Escorts'],
                ['/escorts-in/mayfair', 'Escorts in Mayfair'],
                ['/escorts-in/kensington', 'Escorts in Kensington'],
                ['/escorts-in/knightsbridge', 'Escorts in Knightsbridge'],
                ['/escorts-in/chelsea', 'Escorts in Chelsea'],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="f-link">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Information</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['/faq', 'FAQ'],
                ['/contact', 'Contact'],
                ['/join', 'Model Application'],
                ['/terms', 'Terms of Service'],
                ['/privacy', 'Privacy Policy'],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="f-link">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Contact</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><a href="https://t.me/virel_bookings" className="f-link">Telegram</a></li>
              <li><a href="mailto:bookings@virel.com" className="f-link">bookings@virel.com</a></li>
              <li style={{ fontSize: 13, color: '#4a4540' }}>London, United Kingdom</li>
              <li style={{ fontSize: 13, color: '#4a4540' }}>Available 24/7</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: '#2a2520', letterSpacing: '.06em' }}>© {currentYear} Virel. All rights reserved. · Adults only (18+)</p>
          <p style={{ fontSize: 11, color: '#2a2520', letterSpacing: '.06em' }}>
            <Link href="/privacy" className="f-link" style={{ fontSize: 11, color: '#2a2520' }}>Privacy</Link>
            {' · '}
            <Link href="/terms" className="f-link" style={{ fontSize: 11, color: '#2a2520' }}>Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
