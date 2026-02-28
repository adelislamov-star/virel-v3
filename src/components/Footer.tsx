import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif text-xl font-bold mb-4">Virel</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium companion services in London. Discreet, elegant, and professional.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Companions</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/london-escorts" className="text-muted-foreground hover:text-foreground transition-colors">London Escorts</Link></li>
              <li><Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors">Services</Link></li>
              <li><Link href="/escorts-in/mayfair" className="text-muted-foreground hover:text-foreground transition-colors">Escorts in Mayfair</Link></li>
              <li><Link href="/escorts-in/kensington" className="text-muted-foreground hover:text-foreground transition-colors">Escorts in Kensington</Link></li>
              <li><Link href="/escorts-in/knightsbridge" className="text-muted-foreground hover:text-foreground transition-colors">Escorts in Knightsbridge</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/join" className="text-muted-foreground hover:text-foreground transition-colors">Model Application</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>London, United Kingdom</li>
              <li>Available 24/7</li>
              <li><a href="https://t.me/virel_bookings" className="hover:text-foreground transition-colors">Telegram</a></li>
              <li><a href="mailto:bookings@virel.com" className="hover:text-foreground transition-colors">bookings@virel.com</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Virel. All rights reserved. · Adults only (18+)</p>
        </div>
      </div>
    </footer>
  )
}
