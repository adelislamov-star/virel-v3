export const revalidate = 86400

import Link from 'next/link'

import { siteConfig } from '@/../config/site'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'
import './contact.css'

export const metadata = {
  title: `Contact | ${siteConfig.name} London Escorts`,
  description: `Contact ${siteConfig.name} for bookings, enquiries, or model applications. Available 24/7. Telegram, WhatsApp, or email.`,
  alternates: { canonical: `${siteConfig.domain}/contact` },
}

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'Contact' }]} />

      <div className="contact-root">

        <div className="contact-bc">
          <Link href="/">HOME</Link>
          <span style={{ margin:'0 12px' }}>—</span>
          <span style={{ color:'#c9a84c' }}>CONTACT</span>
        </div>

        <div className="contact-inner">
          <span className="c-eyebrow">Get in Touch</span>
          <h1 className="c-title">Contact <em>Vaurel</em></h1>
          <p className="c-subtitle">
            We're available around the clock. For the fastest response, use Telegram or WhatsApp.
            All communications are handled with complete discretion.
          </p>

          <div className="c-channels">
            <a href={siteConfig.telegram} className="c-channel" target="_blank" rel="noopener noreferrer">
              <div className="c-channel-left">
                <span className="c-channel-icon">✈</span>
                <div>
                  <p className="c-channel-name">Telegram</p>
                  <p className="c-channel-detail">@virel_bookings</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <span className="c-channel-badge">Fastest</span>
                <span className="c-channel-arrow">→</span>
              </div>
            </a>

            <a href="https://wa.me/447562279678" className="c-channel" target="_blank" rel="noopener noreferrer">
              <div className="c-channel-left">
                <span className="c-channel-icon">◉</span>
                <div>
                  <p className="c-channel-name">WhatsApp</p>
                  <p className="c-channel-detail">+44 75 6227 9678 · available 24/7</p>
                </div>
              </div>
              <span className="c-channel-arrow">→</span>
            </a>

            <a href={`mailto:${siteConfig.email}`} className="c-channel">
              <div className="c-channel-left">
                <span className="c-channel-icon">◈</span>
                <div>
                  <p className="c-channel-name">Email</p>
                  <p className="c-channel-detail">{siteConfig.email}</p>
                </div>
              </div>
              <span className="c-channel-arrow">→</span>
            </a>
          </div>

          <div className="c-join">
            <h2 className="c-join-title">Model Application</h2>
            <p className="c-join-text">
              Interested in joining Vaurel as a companion? We welcome applications from sophisticated,
              professional individuals looking to work with London's premier agency.
            </p>
            <Link href="/join" className="c-join-link">Apply Now →</Link>
          </div>
        </div>

      </div>
    </>
  )
}
