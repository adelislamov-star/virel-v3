// @ts-nocheck
export const revalidate = 86400

import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteConfig } from '@/../config/site'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'
import './about.css'

export const metadata: Metadata = {
  title: `About ${siteConfig.name} | Premium Companion Agency London`,
  description: `${siteConfig.name} is London's premier companion agency. Learn about our commitment to discretion, quality, and genuine connections.`,
  alternates: { canonical: `${siteConfig.domain}/about` },
}

const VALUES = [
  { title: 'Privacy First', desc: 'Complete discretion at every step. Your personal information is protected with enterprise-grade security.' },
  { title: 'Quality Assured', desc: 'Every companion is personally verified and meets our exacting standards for professionalism and elegance.' },
  { title: 'Genuine Connections', desc: 'We believe in authentic experiences. Our companions are chosen for their warmth, intelligence and charm.' },
  { title: 'Concierge Service', desc: 'From restaurant reservations to transport arrangements, our team ensures every detail is perfect.' },
]

export default function AboutPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'About' }]} />

      <Header />

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '96px 24px 80px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24 }}>About Us</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.05, margin: '0 0 16px' }}>
          About <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Vaurel</em>
        </h1>
        <p style={{ fontSize: 16, color: '#6b6560', marginBottom: 56, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20 }}>
          London&apos;s Premier Companion Agency
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, color: '#8a8580', lineHeight: 1.9, marginBottom: 64 }}>
          <p style={{ margin: 0 }}>
            Vaurel was founded with a singular vision: to redefine the companion experience in London. We believe that
            true luxury lies not in ostentation, but in the quality of connection — in moments of genuine warmth,
            intelligent conversation, and effortless elegance.
          </p>
          <p style={{ margin: 0 }}>
            Every companion in our portfolio has been personally selected for their unique combination of beauty,
            sophistication, and personality. We work exclusively with professionals who share our commitment to
            discretion and who bring authentic warmth to every encounter.
          </p>
          <p style={{ margin: 0 }}>
            Based in the heart of London, we serve all major districts including Mayfair, Knightsbridge, Chelsea,
            Kensington, and the City. Whether you require a companion for an evening at The Dorchester, a weekend
            getaway, or an intimate dinner for two, our concierge team ensures every detail is arranged to perfection.
          </p>
          <p style={{ margin: 0 }}>
            Your privacy is our absolute priority. From encrypted communications to discreet billing, every aspect
            of our service has been designed with your confidentiality in mind.
          </p>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 64 }} />

        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px' }}>
          Our Values
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 64 }}>
          {VALUES.map(v => (
            <div key={v.title} className="about-val">
              <h3 style={{ fontSize: 14, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C5A572', margin: '0 0 12px', fontWeight: 400 }}>
                {v.title}
              </h3>
              <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.8, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/contact" className="about-cta">Contact Our Team</Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
