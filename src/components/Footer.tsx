import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 60 }}>

          {/* Brand */}
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', marginBottom: 16, letterSpacing: '.04em' }}>Virel</p>
            <p style={{ fontSize: 13, color: '#4a4540', lineHeight: 1.8, maxWidth: 260 }}>
              Premium companion services in London. Discreet, sophisticated, and professional.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <a href="https://t.me/virel_bookings" style={{ fontSize: 11, letterSpacing: '.1em', color: '#6b6560', textDecoration: 'none', textTransform: 'uppercase', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b6560')}>
                Telegram
              </a>
              <a href="mailto:bookings@virel.com" style={{ fontSize: 11, letterSpacing: '.1em', color: '#6b6560', textDecoration: 'none', textTransform: 'uppercase' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b6560')}>
                Email
              </a>
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
                <li key={href}>
                  <Link href={href} style={{ fontSize: 13, color: '#4a4540', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ddd5c8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a4540')}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
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
                <li key={href}>
                  <Link href={href} style={{ fontSize: 13, color: '#4a4540', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ddd5c8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a4540')}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Contact</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['London, United Kingdom', 'Available 24/7', 'Discreet & Confidential'].map(item => (
                <li key={item} style={{ fontSize: 13, color: '#4a4540' }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: '#2a2520', letterSpacing: '.06em' }}>
            © {currentYear} Virel. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: '#2a2520', letterSpacing: '.06em' }}>
            Adults only (18+)
          </p>
        </div>
      </div>
    </footer>
  )
}
