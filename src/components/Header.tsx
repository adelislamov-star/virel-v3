'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
          Virel
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/london-escorts" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            Companions
          </Link>
          <Link href="/services" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            Services
          </Link>
          <Link href="/faq" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/contact" className="text-sm hover:text-foreground text-muted-foreground transition-colors">
            Contact
          </Link>
          <Link href="/join"
            className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Join Us
          </Link>
        </div>

        {/* Mobile */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4 text-sm">
            <Link href="/london-escorts" onClick={() => setMobileMenuOpen(false)}>Companions</Link>
            <Link href="/services" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link href="/join" onClick={() => setMobileMenuOpen(false)} className="border border-border px-4 py-2 rounded-lg text-center">
              Join Us
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
