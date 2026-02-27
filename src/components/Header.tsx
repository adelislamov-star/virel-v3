'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-bold">
          Virel
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/catalog" className="hover:text-accent transition-colors">
            Browse
          </Link>
          <Link href="/about" className="hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/faq" className="hover:text-accent transition-colors">
            FAQ
          </Link>
          <Link href="/contact" className="hover:text-accent transition-colors">
            Contact
          </Link>
          <Link 
            href="/admin" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-all"
          >
            Admin
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link href="/catalog" className="hover:text-accent transition-colors">
              Browse
            </Link>
            <Link href="/about" className="hover:text-accent transition-colors">
              About
            </Link>
            <Link href="/faq" className="hover:text-accent transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-accent transition-colors">
              Contact
            </Link>
            <Link 
              href="/admin" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg text-center transition-all"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
