import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/../config/site'
import { categories, groupLabels } from '@/../data/categories'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'
import './categories.css'

export const metadata: Metadata = {
  title: 'London Escorts by Category',
  description: `Browse our London companions by category. Blonde, brunette, Russian, GFE and more. Verified companions from £${siteConfig.priceFrom}/hr.`,
  alternates: { canonical: `${siteConfig.domain}/categories` },
}

export default function CategoriesPage() {
  const groups = ['appearance', 'nationality', 'experience'] as const

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'Categories' }]} />
      <Header />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <nav style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#C5A572' }}>Categories</span>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 16px' }}>
          London Escorts by <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Category</em>
        </h1>
        <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 600, margin: '0 0 64px' }}>
          Find your ideal companion by appearance, nationality, or experience type.
          Every profile is personally verified.
        </p>
      </section>

      {groups.map(group => {
        const items = categories.filter(c => c.group === group)
        return (
          <section key={group} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 64px' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 40 }} />
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
              {groupLabels[group]}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {items.map(cat => (
                <Link key={cat.slug} href={`/categories/${cat.slug}`} className="cat-card">
                  <div className="cat-card-name">{cat.name} Escorts</div>
                  <div className="cat-card-sub">London</div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        <Link
          href="/companions"
          style={{ display: 'inline-block', padding: '16px 40px', background: '#C5A572', color: '#0A0A0A', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'inherit' }}
        >
          Browse All Companions
        </Link>
      </section>

      <Footer />
    </main>
  )
}
