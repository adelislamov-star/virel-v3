import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Contact | Virel London Escorts',
  description: 'Contact Virel for bookings, enquiries, or model applications. Available 24/7.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <nav className="text-sm text-muted-foreground mb-6 flex gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span>Contact</span>
        </nav>

        <h1 className="font-serif text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          We are available 24/7. For the fastest response, use the booking form on any companion's profile.
          For general enquiries, use the options below.
        </p>

        <div className="space-y-4 mb-12">
          <a href="https://t.me/virel_bookings"
            className="flex items-center gap-4 p-5 border border-border rounded-xl hover:border-primary transition-colors group"
          >
            <span className="text-3xl">💬</span>
            <div>
              <p className="font-semibold group-hover:text-primary transition-colors">Telegram</p>
              <p className="text-sm text-muted-foreground">@virel_bookings · fastest response</p>
            </div>
          </a>

          <a href="https://wa.me/447000000000"
            className="flex items-center gap-4 p-5 border border-border rounded-xl hover:border-primary transition-colors group"
          >
            <span className="text-3xl">📱</span>
            <div>
              <p className="font-semibold group-hover:text-primary transition-colors">WhatsApp</p>
              <p className="text-sm text-muted-foreground">+44 7000 000 000 · available 24/7</p>
            </div>
          </a>

          <a href="mailto:bookings@virel.com"
            className="flex items-center gap-4 p-5 border border-border rounded-xl hover:border-primary transition-colors group"
          >
            <span className="text-3xl">✉️</span>
            <div>
              <p className="font-semibold group-hover:text-primary transition-colors">Email</p>
              <p className="text-sm text-muted-foreground">bookings@virel.com</p>
            </div>
          </a>
        </div>

        <div className="p-6 bg-muted/50 rounded-xl">
          <h2 className="font-semibold mb-2">Looking to join our agency?</h2>
          <p className="text-sm text-muted-foreground mb-4">Models can apply through our dedicated registration form.</p>
          <Link href="/join"
            className="inline-block border border-border px-5 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Model Application →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
