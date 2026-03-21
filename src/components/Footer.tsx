'use client'
import Link from 'next/link'
import { siteConfig } from '@/../config/site'
import './Footer.css'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', marginBottom: 16, letterSpacing: '.04em' }}>{siteConfig.name}</p>
            <p style={{ fontSize: 13, color: '#4a4540', lineHeight: 1.8, maxWidth: 260 }}>
              Premium companion services in London. Discreet, sophisticated, and professional.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <a href={siteConfig.telegram} className="f-contact" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href={`mailto:${siteConfig.email}`} className="f-contact">Email</a>
            </div>
          </div>

          {/* Companions & Districts */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Companions</p>
            <ul className="footer-district-list">
              {[
                ['/categories', 'Escorts by Category'],
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
              <li><a href={siteConfig.telegram} className="f-link" target="_blank" rel="noopener noreferrer">Telegram</a></li>
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
