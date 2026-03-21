import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './not-found.css'

export default function NotFound() {
  return (
    <>
      <div className="nf-root">
        <Header />
        <div className="nf-content">
          <h1 className="nf-title">404</h1>
          <p className="nf-sub">The page you're looking for doesn't exist or has been moved.</p>
          <Link href="/" className="nf-btn">Return Home</Link>
        </div>
        <Footer />
      </div>
    </>
  )
}
