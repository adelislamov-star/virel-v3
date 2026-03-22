import Link from 'next/link'

import './not-found.css'

export default function NotFound() {
  return (
    <>
      <div className="nf-root">

        <div className="nf-content">
          <h1 className="nf-title">404</h1>
          <p className="nf-sub">The page you're looking for doesn't exist or has been moved.</p>
          <Link href="/" className="nf-btn">Return Home</Link>
        </div>
      </div>
    </>
  )
}
