import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'FAQ | Virel London Escorts',
  description: 'Frequently asked questions about booking a companion with Virel. Rates, discretion, incall, outcall and more.',
  alternates: { canonical: 'https://virel-v3.vercel.app/faq' },
}

const FAQS = [
  { q: 'How do I book a companion?', a: 'Browse our companions on the London Escorts page, select your preferred model, choose your date and duration, and submit a booking request. We confirm within 30 minutes.' },
  { q: 'Are all companions verified?', a: 'Yes. Every companion on Virel is personally verified. Photos are authentic and up to date. We do not publish unverified profiles.' },
  { q: 'What is the difference between incall and outcall?', a: 'Incall means you visit the companion at her private location. Outcall means she comes to you — your hotel, apartment, or residence. Outcall rates include a travel surcharge.' },
  { q: 'How discreet is the service?', a: 'Completely. We never share client information with any third party. All communications are confidential. Billing appears as a neutral descriptor.' },
  { q: 'What are the payment options?', a: 'Payment is made directly to the companion in cash at the time of the appointment. No online payment is required to make a booking.' },
  { q: 'Can I book for the same day?', a: 'Yes. Same-day bookings are available subject to companion availability. We recommend booking at least 2–3 hours in advance for the best experience.' },
  { q: 'What areas of London do you cover?', a: 'We cover all London districts including Mayfair, Kensington, Knightsbridge, Chelsea, Belgravia, Canary Wharf, and all major areas. Airport visits to Heathrow and Gatwick are also available.' },
  { q: 'Can I request a specific companion?', a: 'Yes. Simply find the companion you like and submit a booking request directly from her profile page.' },
  { q: 'What if I need to cancel?', a: 'Please notify us as early as possible. We understand plans change. Repeated last-minute cancellations may affect future booking availability.' },
  { q: 'Are overnight bookings available?', a: 'Yes. Overnight bookings are available with select companions. Rates vary — see individual profiles for pricing.' },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .faq-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }
        .faq-bc { font-size:11px; letter-spacing:.1em; color:#3a3530; padding:20px 40px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .faq-bc a { color:#3a3530; text-decoration:none; }
        .faq-bc a:hover { color:#c9a84c; }
        .faq-inner { max-width:800px; margin:0 auto; padding:80px 40px; }
        @media(max-width:600px){ .faq-inner{padding:60px 20px;} }
        .f-eyebrow { font-size:10px; letter-spacing:.25em; color:#c9a84c; text-transform:uppercase; display:block; margin-bottom:16px; }
        .f-title { font-family:'Cormorant Garamond',serif; font-size:clamp(40px,6vw,68px); font-weight:300; color:#f0e8dc; margin:0 0 16px; line-height:1.05; }
        .f-title em { font-style:italic; color:#c9a84c; }
        .f-subtitle { font-size:14px; color:#6b6560; line-height:1.9; margin:0 0 64px; }

        .faq-list { display:flex; flex-direction:column; border-top:1px solid rgba(255,255,255,0.06); margin-bottom:64px; }
        .faq-item { border-bottom:1px solid rgba(255,255,255,0.06); }
        .faq-q { padding:24px 0; cursor:pointer; font-size:16px; color:#ddd5c8; list-style:none; display:flex; justify-content:space-between; align-items:center; gap:24px; }
        .faq-q::-webkit-details-marker { display:none; }
        .faq-plus { color:#c9a84c; font-size:20px; font-weight:300; flex-shrink:0; width:16px; text-align:center; transition:transform .25s; line-height:1; }
        details[open] .faq-plus { transform:rotate(45deg); }
        .faq-a { padding:0 32px 24px 0; font-size:13px; color:#6b6560; line-height:2; }

        .f-cta { border:1px solid rgba(255,255,255,0.07); padding:40px; text-align:center; }
        .f-cta-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:#f0e8dc; margin:0 0 10px; }
        .f-cta-text { font-size:13px; color:#6b6560; margin:0 0 24px; }
        .f-cta-link { font-size:11px; letter-spacing:.16em; color:#c9a84c; text-decoration:none; text-transform:uppercase; border:1px solid rgba(201,168,76,0.3); padding:12px 28px; display:inline-block; transition:all .2s; }
        .f-cta-link:hover { background:rgba(201,168,76,0.06); border-color:#c9a84c; }
      `}</style>

      <div className="faq-root">
        <Header />

        <div className="faq-bc">
          <Link href="/">HOME</Link>
          <span style={{ margin:'0 12px' }}>—</span>
          <span style={{ color:'#c9a84c' }}>FAQ</span>
        </div>

        <div className="faq-inner">
          <span className="f-eyebrow">Questions & Answers</span>
          <h1 className="f-title">Frequently <em>Asked</em></h1>
          <p className="f-subtitle">Everything you need to know about booking with Virel.</p>

          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-q">
                  <span>{faq.q}</span>
                  <span className="faq-plus">+</span>
                </summary>
                <p className="faq-a">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="f-cta">
            <p className="f-cta-title">Still have questions?</p>
            <p className="f-cta-text">Our team is available 24/7 to assist you.</p>
            <Link href="/contact" className="f-cta-link">Contact Us →</Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
