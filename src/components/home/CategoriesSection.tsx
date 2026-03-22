import Link from 'next/link'

const FALLBACK_CATEGORIES = [
  { slug: 'dinner-date', name: 'Dinner Date', description: 'Elegant companionship for fine dining, theatre and private social occasions across London\'s finest venues.' },
  { slug: 'girlfriend-experience', name: 'Girlfriend Experience', description: 'Authentic, warm companionship with genuine connection — for evenings, weekends, or longer arrangements.' },
  { slug: 'erotic-massage', name: 'Erotic Massage', description: 'Sensual and deeply relaxing experiences delivered in complete privacy and absolute discretion.' },
  { slug: 'party-companion', name: 'Party Companion', description: 'Vibrant, charming presence for private events, clubs and social celebrations.' },
  { slug: 'overnight', name: 'Overnight & Extended', description: 'Extended intimate companionship — from a private evening through to a weekend arrangement.' },
  { slug: 'belly-dance', name: 'Belly Dance', description: 'Private sensual performances — an unforgettable and uniquely intimate experience.' },
]

interface CategoryItem {
  slug: string
  name: string
  description: string | null
}

interface CategoriesSectionProps {
  categories: CategoryItem[]
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const items = categories.length >= 6 ? categories.slice(0, 6) : FALLBACK_CATEGORIES

  return (
    <section className="section" style={{ background: '#0f0e0c' }}>
      <div className="sec-top">
        <div>
          <p className="sec-eyebrow">Experiences</p>
          <h2 className="sec-h2">Our <em>Services</em></h2>
        </div>
        <Link href="/services" className="sec-link">All services</Link>
      </div>
      <div className="cats-grid">
        {items.map((cat, i) => (
          <Link key={cat.slug} href={`/services/${cat.slug}`} className="cat">
            <span className="cat-num">{String(i + 1).padStart(2, '0')}</span>
            <div className="cat-title">{cat.name}</div>
            {cat.description && <div className="cat-desc">{cat.description}</div>}
            <span className="cat-arr">&#8599;</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
