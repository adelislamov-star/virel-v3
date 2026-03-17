'use client'
import Link from 'next/link'
import { siteConfig } from '@/../config/site'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        .f-link { font-size:13px; color:#4a4540; text-decoration:none; transition:color .2s; }
        .f-link:hover { color:#ddd5c8; }
        .f-contact { font-size:11px; letter-spacing:.1em; color:#6b6560; text-decoration:none; text-transform:uppercase; transition:color .2s; }
        .f-contact:hover { color:#c9a84c; }
        .footer-inner { max-width:1280px; margin:0 auto; padding:80px 40px 40px; }
        .footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:60px; margin-bottom:60px; }
        .footer-bottom { padding-top:32px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
        .footer-district-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
        @media (max-width:900px) {
          .footer-inner { padding:60px 24px 32px; }
          .footer-grid { grid-template-columns:1fr 1fr; gap:40px 24px; }
        }
        @media (max-width:640px) {
          .footer-grid { grid-template-columns:1fr; gap:32px; }
          .footer-district-list { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
          .footer-bottom { flex-direction:column; text-align:center; }
        }
      `}</style>
      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', marginBottom: 16, letterSpacing: '.04em' }}>{siteConfig.name}</p>
            <p style={{ fontSize: 13, color: '#4a4540', lineHeight: 1.8, maxWidth: 260 }}>
              Premium companion services in London. Discreet, sophisticated, and professional.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <a href={siteConfig.telegram} className="f-contact">Telegram</a>
              <a href={`mailto:${siteConfig.email}`} className="f-contact">Email</a>
            </div>
          </div>

          {/* Companions & Districts */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Companions</p>
            <ul className="footer-district-list">
              {[
                ['/companions', 'London Escorts'],
                ['/london/mayfair-escorts/', 'Escorts in Mayfair'],
                ['/london/kensington-escorts/', 'Escorts in Kensington'],
                ['/london/knightsbridge-escorts/', 'Escorts in Knightsbridge'],
                ['/london/chelsea-escorts/', 'Escorts in Chelsea'],
                ['/london/belgravia-escorts/', 'Escorts in Belgravia'],
                ['/london/marylebone-escorts/', 'Escorts in Marylebone'],
                ['/london/westminster-escorts/', 'Escorts in Westminster'],
                ['/london/soho-escorts/', 'Escorts in Soho'],
                ['/london/canary-wharf-escorts/', 'Escorts in Canary Wharf'],
              ].map(([href, label]) => (
                <li key={href}><Link href={href} className="f-link">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Information</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['/faq', 'FAQ'],
                ['/services', 'Services'],
                ['/how-it-works', 'How It Works'],
                ['/discretion', 'Discretion & Privacy'],
                ['/verification', 'Verification'],
                ['/contact', 'Contact'],
                ['/join', 'Join Us'],
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
              <li><a href={siteConfig.telegram} className="f-link">Telegram</a></li>
              <li><a href={`mailto:${siteConfig.email}`} className="f-link" style={{ wordBreak: 'break-all' }}>{siteConfig.email}</a></li>
              <li style={{ fontSize: 13, color: '#4a4540' }}>London, United Kingdom</li>
              <li style={{ fontSize: 13, color: '#4a4540' }}>Available 24/7</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 11, color: '#2a2520', letterSpacing: '.04em', lineHeight: 1.8, textAlign: 'center', marginBottom: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          All services are for companionship only. Any activities between consenting adults are a matter of personal choice.
        </p>

        {/* Bottom */}
        <div className="footer-bottom">
          <p style={{ fontSize: 11, color: '#2a2520', letterSpacing: '.06em' }}>&copy; {currentYear} {siteConfig.name}. All rights reserved. &middot; Adults only (18+)</p>
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
