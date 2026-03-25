'use client'

import Link from 'next/link'
import { useBookingModal } from '@/components/public/BookingModalProvider'

export function CtaSection() {
  const { openModal } = useBookingModal()

  return (
    <section className="cta-section">
      <div className="cta-lines">
        <div className="cl" /><div className="cl" /><div className="cl" /><div className="cl" />
      </div>
      <div className="cta-inner">
        <h2 className="cta-h2">Ready to make<br /><em>an arrangement?</em></h2>
        <p className="cta-sub">Personal response &middot; 15 minutes &middot; Available 24/7</p>
        <p style={{
          fontSize: 13,
          color: 'rgba(248,244,238,0.18)',
          maxWidth: 560,
          margin: '0 auto 36px',
          lineHeight: 1.9,
          letterSpacing: '.02em'
        }}>
          Vaurel is London&apos;s most discreet escort agency — connecting discerning clients with personally verified companions across the city. Available 24 hours, seven days a week.
        </p>
        <div className="cta-btns">
          <Link href="/companions" className="btn-gold">Browse Companions</Link>
          <button className="btn-outline" onClick={openModal}>Make an Enquiry</button>
        </div>
        <div className="cta-contacts">
          <a href="https://t.me/vaurel_bookings" className="cta-contact">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.5 2.5L2 10l7 2.5 2 7.5 3-4 5 3.5z"/></svg>
            Telegram
          </a>
          <div className="cta-sep" />
          <a href="mailto:bookings@vaurel.co.uk" className="cta-contact">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
            bookings@vaurel.co.uk
          </a>
        </div>
      </div>
    </section>
  )
}
