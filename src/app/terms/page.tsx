import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Terms of Service | Virel',
  description: 'Terms of service for using Virel companion services in London.',
  alternates: { canonical: '/terms' },
  robots: { index: false },
}

const sections = [
  { title: '1. Age Restriction', body: 'You must be 18 years of age or older to use this website. By accessing Virel, you confirm that you are an adult and that accessing adult content is legal in your jurisdiction.' },
  { title: '2. Nature of Service', body: 'Virel is a companion introduction service. All companions listed are independent adults who offer their time and social companionship. This website facilitates introductions only. Any arrangement made between clients and companions is a private matter between consenting adults.' },
  { title: '3. Acceptable Use', body: 'You agree not to use this website for any unlawful purpose. You agree not to harass, abuse, or threaten any companion. Repeated no-shows or last-minute cancellations may result in being blocked from the service.' },
  { title: '4. Accuracy of Information', body: 'We make every effort to ensure profiles are accurate and photos are authentic. However, we cannot guarantee availability at any given time. Rates are set by the companions themselves and are subject to change.' },
  { title: '5. Limitation of Liability', body: 'Virel acts solely as an introduction platform. We are not responsible for the conduct of companions or clients during or after any arranged meeting. Use of this service is entirely at your own risk.' },
  { title: '6. Changes to Terms', body: 'We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of any revised terms.' },
]

export default function TermsPage() {
  return (
    <main style={{ background: '#080808', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <Header />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '80px 40px 120px' }}>
        <nav style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', marginBottom: 48 }}>
          <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>TERMS</span>
        </nav>
        <p style={{ fontSize: 10, letterSpacing: '.3em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Legal</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 12px', lineHeight: 1.1 }}>Terms of Service</h1>
        <p style={{ fontSize: 12, color: '#3a3530', letterSpacing: '.06em', marginBottom: 56 }}>Last updated: January 2026</p>
        <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.3),transparent)', marginBottom: 56 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {sections.map(s => (
            <div key={s.title}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: '#c9a84c', margin: '0 0 12px' }}>{s.title}</h2>
              <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.9, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
