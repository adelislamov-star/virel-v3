'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useBookingModal } from '@/components/public/BookingModalProvider'

interface HeroSectionProps {
  heroPhotoUrl: string | null
}

export function HeroSection({ heroPhotoUrl }: HeroSectionProps) {
  const { openModal } = useBookingModal()
  return (
    <section className="hero">
      <div className="hero-img">
        {heroPhotoUrl ? (
          <Image
            src={heroPhotoUrl}
            alt="Vaurel — private companion agency London"
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center 12%' }}
            sizes="100vw"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0C0B09 0%, #161410 100%)' }} />
        )}
      </div>
      <div className="hero-body">
        <p className="hero-kicker">London &middot; Private Companionship</p>
        <h1
          className="hero-h1"
          aria-label="London Escort Agency — Carefully Selected, Discreet"
        >
          Carefully<br />selected.<br /><em>Discreet.</em>
        </h1>
        <p className="hero-sub">
          A private companion agency in London. Every introduction arranged personally, with complete discretion.
        </p>
        <div className="hero-btns">
          <Link href="/companions" className="btn-gold">Meet Our Companions</Link>
          <button className="btn-outline" onClick={openModal}>Make an Enquiry</button>
        </div>
        <p className="hero-seo-sub">
          London's premier escort agency — discreet companion introductions across Mayfair, Knightsbridge &amp; Chelsea.
        </p>
      </div>
    </section>
  )
}
