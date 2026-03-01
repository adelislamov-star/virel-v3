import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy | Virel',
  description: 'Privacy policy for Virel — how we handle your data and protect your confidentiality.',
  alternates: { canonical: '/privacy' },
  robots: { index: false },
}

const sections = [
  { title: '1. Information We Collect', body: 'When you submit a booking request, we collect your name, phone number, and email address (optional). This information is used solely to process and confirm your booking.' },
  { title: '2. How We Use Your Data', body: 'Your personal data is used only to facilitate bookings and respond to enquiries. We do not sell, share, or transfer your data to any third party for marketing or commercial purposes.' },
  { title: '3. Data Retention', body: 'Booking records are retained for operational purposes. You may request deletion of your data at any time by contacting us directly.' },
  { title: '4. Cookies', body: 'This website uses minimal cookies for essential functionality only. We do not use tracking or advertising cookies.' },
  { title: '5. Security', body: 'All data is stored securely. We use industry-standard encryption for data in transit. Access to client data is restricted to authorised personnel only.' },
  { title: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at bookings@virel.com.' },
]

export default function PrivacyPage() {
  return (
    <main style={{ background: '#080808', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <Header />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '80px 40px 120px' }}>
        <nav style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', marginBottom: 48 }}>
          <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>PRIVACY</span>
        </nav>
        <p style={{ fontSize: 10, letterSpacing: '.3em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>Legal</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 12px', lineHeight: 1.1 }}>Privacy Policy</h1>
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
