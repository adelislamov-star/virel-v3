import Link from 'next/link'
import { PRIME_DISTRICTS, OTHER_DISTRICTS } from '@/data/districts'

export function FooterNew() {
  return (
    <footer className="vr-footer">
      <div className="ft-grid">
        <div>
          <div className="ft-logo">Vaurel</div>
          <p className="ft-desc">Private companion agency. London. Discreet, personal, effortless.</p>
          <a href="mailto:bookings@vaurel.co.uk" className="ft-email">bookings@vaurel.co.uk</a>
        </div>
        <div className="ft-col">
          <div className="ft-col-h">Agency</div>
          <ul>
            <li><Link href="/companions">Companions</Link></li>
            <li><Link href="/services">Experiences</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/join">Join Vaurel</Link></li>
          </ul>
        </div>
        <div className="ft-col">
          <div className="ft-col-h">Information</div>
          <ul>
            <li><Link href="/discretion">Discretion</Link></li>
            <li><Link href="/verification">Verification</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div className="ft-col">
          <div className="ft-col-h">Contact</div>
          <ul>
            <li><a href="https://t.me/+447562279678">Telegram</a></li>
            <li><a href="https://wa.me/447562279678">WhatsApp</a></li>
            <li><a href="mailto:bookings@vaurel.co.uk">Email</a></li>
            <li><Link href="/signin">Sign In</Link></li>
          </ul>
        </div>
      </div>
      <div className="ft-seo">
        <div className="ft-seo-links">
          {PRIME_DISTRICTS.map(d => (
            <Link key={d.slug} href={`/london/${d.slug}-escorts`}>
              Escorts in {d.name}
            </Link>
          ))}
        </div>
        <div className="ft-seo-links" style={{ marginTop: 8 }}>
          {OTHER_DISTRICTS.map(d => (
            <Link key={d.slug} href={`/london/${d.slug}-escorts`}>
              Escorts in {d.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="ft-bottom">
        <span className="ft-copy">&copy; 2026 Vaurel. All rights reserved. &middot; Adults only (18+)</span>
        <div className="ft-legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/discretion">Discretion</Link>
        </div>
      </div>
    </footer>
  )
}
