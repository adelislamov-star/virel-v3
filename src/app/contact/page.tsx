import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Contact | Virel London Escorts',
  description: 'Contact Virel for bookings, enquiries, or model applications. Available 24/7. Telegram, WhatsApp, or email.',
  alternates: { canonical: 'https://virel-v3.vercel.app/contact' },
}

export default function ContactPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .contact-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }
        .contact-bc { font-size:11px; letter-spacing:.1em; color:#3a3530; padding:20px 40px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .contact-bc a { color:#3a3530; text-decoration:none; }
        .contact-bc a:hover { color:#c9a84c; }
        .contact-inner { max-width:800px; margin:0 auto; padding:80px 40px; }
        @media(max-width:600px){ .contact-inner{padding:60px 20px;} }
        .c-eyebrow { font-size:10px; letter-spacing:.25em; color:#c9a84c; text-transform:uppercase; display:block; margin-bottom:16px; }
        .c-title { font-family:'Cormorant Garamond',serif; font-size:clamp(40px,6vw,68px); font-weight:300; color:#f0e8dc; margin:0 0 16px; line-height:1.05; }
        .c-title em { font-style:italic; color:#c9a84c; }
        .c-subtitle { font-size:14px; color:#6b6560; line-height:1.9; margin:0 0 64px; max-width:480px; }

        .c-channels { display:flex; flex-direction:column; gap:1px; background:rgba(255,255,255,0.04); margin-bottom:64px; }
        .c-channel { display:flex; align-items:center; justify-content:space-between; padding:28px 32px; background:#080808; text-decoration:none; transition:background .2s; }
        .c-channel:hover { background:#0d0c0a; }
        .c-channel-left { display:flex; align-items:center; gap:24px; }
        .c-channel-icon { font-family:'Cormorant Garamond',serif; font-size:28px; color:#c9a84c; opacity:0.6; width:32px; text-align:center; }
        .c-channel-name { font-size:16px; color:#ddd5c8; margin:0 0 4px; }
        .c-channel-detail { font-size:12px; color:#4a4540; letter-spacing:.04em; }
        .c-channel-badge { font-size:10px; letter-spacing:.14em; color:#c9a84c; text-transform:uppercase; border:1px solid rgba(201,168,76,0.25); padding:4px 12px; }
        .c-channel:hover .c-channel-arrow { color:#c9a84c; }
        .c-channel-arrow { color:#2a2520; font-size:16px; transition:color .2s; }

        .c-join { border:1px solid rgba(255,255,255,0.07); padding:40px; }
        .c-join-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:300; color:#f0e8dc; margin:0 0 10px; }
        .c-join-text { font-size:13px; color:#6b6560; line-height:1.8; margin:0 0 24px; }
        .c-join-link { font-size:11px; letter-spacing:.16em; color:#c9a84c; text-decoration:none; text-transform:uppercase; border:1px solid rgba(201,168,76,0.3); padding:12px 24px; display:inline-block; transition:all .2s; }
        .c-join-link:hover { background:rgba(201,168,76,0.06); border-color:#c9a84c; }
      `}</style>

      <div className="contact-root">
        <Header />

        <div className="contact-bc">
          <Link href="/">HOME</Link>
          <span style={{ margin:'0 12px' }}>—</span>
          <span style={{ color:'#c9a84c' }}>CONTACT</span>
        </div>

        <div className="contact-inner">
          <span className="c-eyebrow">Get in Touch</span>
          <h1 className="c-title">Contact <em>Virel</em></h1>
          <p className="c-subtitle">
            We're available around the clock. For the fastest response, use Telegram or WhatsApp.
            All communications are handled with complete discretion.
          </p>

          <div className="c-channels">
            <a href="https://t.me/virel_bookings" className="c-channel" target="_blank" rel="noopener">
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

            <a href="https://wa.me/447000000000" className="c-channel" target="_blank" rel="noopener">
              <div className="c-channel-left">
                <span className="c-channel-icon">◉</span>
                <div>
                  <p className="c-channel-name">WhatsApp</p>
                  <p className="c-channel-detail">+44 7000 000 000 · available 24/7</p>
                </div>
              </div>
              <span className="c-channel-arrow">→</span>
            </a>

            <a href="mailto:bookings@virel.com" className="c-channel">
              <div className="c-channel-left">
                <span className="c-channel-icon">◈</span>
                <div>
                  <p className="c-channel-name">Email</p>
                  <p className="c-channel-detail">bookings@virel.com</p>
                </div>
              </div>
              <span className="c-channel-arrow">→</span>
            </a>
          </div>

          <div className="c-join">
            <h2 className="c-join-title">Model Application</h2>
            <p className="c-join-text">
              Interested in joining Virel as a companion? We welcome applications from sophisticated,
              professional individuals looking to work with London's premier agency.
            </p>
            <Link href="/join" className="c-join-link">Apply Now →</Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
