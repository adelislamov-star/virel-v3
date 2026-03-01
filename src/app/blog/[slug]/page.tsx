// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { POSTS } from '../page'

interface Props { params: { slug: string } }

const CONTENT: Record<string, string> = {
  'guide-to-booking-escort-london': `
## How to Book a Premium Escort in London

Booking a companion in London should be a straightforward, comfortable experience. At Virel, we've designed the process to be as simple and discreet as possible. Here's everything you need to know.

### Step 1 — Browse Our Companions

Visit our [companions page](/london-escorts) to browse verified profiles. Each companion has a detailed profile with authentic photos, personal stats, services offered, and full rate information for both incall and outcall.

Take your time. Look through a few profiles to find someone who matches your preferences in terms of personality, appearance, and availability.

### Step 2 — Choose Your Service Type

**Incall** means you visit the companion at her private location. This is often the more convenient option as she has a comfortable, discreet space ready for you.

**Outcall** means the companion travels to you — typically your hotel room or private residence. Outcall rates are slightly higher to account for travel time and taxi costs.

### Step 3 — Submit Your Request

On the companion's profile, you'll find our booking form. Fill in:
- Your preferred date and time
- Duration (30 min, 1 hour, etc.)
- Your contact number
- Any preferences or notes

We confirm all bookings within **30 minutes** during operating hours.

### Step 4 — Confirmation

Once confirmed, you'll receive details directly. All communication is handled discreetly. We never call from identifiable numbers and all messages are handled confidentially.

### Tips for a Great Experience

- **Be punctual.** Companions have busy schedules. Arriving on time ensures you get the full duration.
- **Be clear about what you want.** The booking form has a notes field — use it.
- **Treat her with respect.** Our companions are professionals who deserve courtesy.
- **Payment is typically at the start.** Have the agreed amount ready in cash.

### Rates & What's Included

All rates are clearly listed on each profile. What's included varies by companion — check their services section. Outcall bookings include a taxi fee for some companions, which is noted on their profile.

If you have any questions before booking, [contact us](/contact) and we'll assist you personally.
`,
  'incall-vs-outcall-difference': `
## Incall vs Outcall: Which Should You Choose?

One of the most common questions we receive is: *what's the difference between incall and outcall, and which is better?*

The short answer: both are excellent — it depends on your situation.

### What is Incall?

Incall means you travel to the companion's location. She has a private, discreet apartment or space that's been prepared specifically for visits.

**Advantages of incall:**
- Lower rates — no travel costs involved
- The companion is comfortable in her own space
- Location is typically central and easy to reach
- Faster confirmation times

**When incall works best:**
- You're staying in London centrally and can travel easily
- You prefer not to give your hotel or home address
- You want a more straightforward, faster booking

### What is Outcall?

Outcall means the companion travels to you — your hotel room, serviced apartment, or private residence.

**Advantages of outcall:**
- Maximum convenience — no travel required on your part
- Ideal for hotel stays
- Complete privacy at your location
- More relaxed, on your own terms

**When outcall works best:**
- You're at a hotel and don't want to leave
- You prefer the privacy and comfort of your own space
- You're entertaining and want a companion to arrive

### Rates

Outcall bookings are typically £50–£100 more than incall for the same duration, reflecting the companion's travel time and taxi costs. Some companions list the taxi fee separately — this is clearly shown on each profile.

### Our Recommendation

If convenience is your priority and you're at a hotel, **outcall** is ideal. If you're looking for the best value and don't mind a short journey, **incall** is excellent.

Either way, our companions deliver an exceptional experience. The service and quality are identical — only the logistics differ.

Browse our [companions](/london-escorts) to see who offers incall and outcall in your preferred area.
`,
  'best-hotels-mayfair-private-meetings': `
## Best Hotels in Mayfair for Private Meetings

Mayfair is home to some of London's finest hotels — perfect for hosting a companion or arranging an outcall booking. Here are our recommendations.

### The Dorchester

Park Lane's iconic address. The Dorchester is synonymous with discretion and luxury. Staff here are impeccably professional and accustomed to welcoming guests of all backgrounds without question.

**Why we recommend it:** Exceptional service, beautiful rooms, central Park Lane location. Our companions are familiar with the hotel and comfortable visiting.

### Claridge's

Brook Street's Art Deco masterpiece. Claridge's attracts royalty, celebrities, and business leaders — which means the staff are well-trained in absolute discretion.

**Why we recommend it:** Timeless elegance, very private, excellent bar and restaurant for dinner beforehand.

### The Connaught

Mayfair's most exclusive hotel. The Connaught is smaller and more intimate than its neighbours, creating a genuinely private atmosphere.

**Why we recommend it:** Quietly prestigious, exceptional spa, world-class Hélène Darroze restaurant.

### Brown's Hotel

London's oldest hotel and one of its most charming. Brown's combines historic character with modern luxury and a wonderfully relaxed atmosphere.

**Why we recommend it:** Intimate scale, beautiful English character, outstanding afternoon tea.

### Tips for Hotel Outcall Bookings

- Book a standard room or above — studios can feel cramped
- Notify us of the hotel name when booking so your companion can plan accordingly
- Have the room key ready — waiting in the lobby is unnecessary
- Our companions are experienced at hotel visits and know how to arrive discreetly

View companions available for [Mayfair outcall](/escorts-in/mayfair).
`,
  'london-escort-agency-vs-independent': `
## Escort Agency vs Independent Escort: What's the Difference?

When looking for a companion in London, you'll encounter two main options: booking through an established agency like Virel, or finding an independent escort. Here's an honest comparison.

### What an Agency Offers

**Verification.** Every companion at Virel is personally verified. We confirm identity, check photos are genuine, and meet companions before they join our platform. With an independent escort found online, you're taking that at face value.

**Quality control.** We maintain standards. If a companion receives feedback that isn't up to our expectations, we address it. We care about your experience because our reputation depends on it.

**Discretion infrastructure.** We have systems in place — secure communications, professional booking processes, no data sharing. An independent escort may not have the same infrastructure.

**Support.** If something goes wrong — a last-minute cancellation, a misunderstanding — we're here to resolve it. With an independent, you're on your own.

**Variety.** We have multiple companions, so if your first choice isn't available, we can offer alternatives.

### What Independents Offer

**Direct contact.** You deal directly with the companion, which some clients prefer.

**Potentially lower rates.** Without agency fees, independents may charge slightly less.

**Specific kinks or services.** Some clients have very specific requirements that a curated agency may not cater to.

### Our Take

For most clients — particularly those who value reliability, verification, and discretion — an established agency is the better choice. The small premium over some independents is more than justified by the peace of mind.

We've built Virel to combine agency reliability with a personal, boutique feel. You get the best of both worlds.

Browse our [verified companions](/london-escorts).
`,
  'most-exclusive-london-districts': `
## London's Most Exclusive Districts for Escort Services

London has dozens of fantastic neighbourhoods, but some are particularly renowned for luxury, privacy, and quality. Here's our guide to the best postcodes.

### Mayfair (W1K/W1J)

The gold standard. Mayfair sits at the top of London's luxury hierarchy — home to the finest hotels, Michelin-starred restaurants, and private members clubs. Our Mayfair companions are among our most requested.

**Best for:** Hotel outcall, fine dining dates, the full luxury experience.

[Escorts in Mayfair →](/escorts-in/mayfair)

### Knightsbridge (SW1X/SW3)

Home to Harrods and Harvey Nichols, Knightsbridge is where London's wealthiest residents and visitors congregate. The area has a refined, international feel.

**Best for:** Shopping trips, hotel visits (Mandarin Oriental, The Berkeley), evening entertainment.

[Escorts in Knightsbridge →](/escorts-in/knightsbridge)

### Belgravia (SW1W)

London's most exclusive residential neighbourhood. Belgravia's white stucco townhouses and private garden squares create an atmosphere of utter discretion.

**Best for:** Private residence visits, absolute discretion, the most exclusive clientele.

[Escorts in Belgravia →](/escorts-in/belgravia)

### Chelsea (SW3/SW10)

Chelsea has character and energy alongside luxury. The King's Road, excellent restaurants, and beautiful Victorian streets make it one of London's most enjoyable areas.

**Best for:** Dinner dates, a more relaxed luxury experience, longer evenings.

[Escorts in Chelsea →](/escorts-in/chelsea)

### Kensington (W8)

Kensington combines culture — the museums, the Royal Palace — with residential elegance. A quieter, more understated luxury than Mayfair.

**Best for:** Incall visits, cultural evenings, a refined and low-key experience.

[Escorts in Kensington →](/escorts-in/kensington)

### Canary Wharf (E14)

London's financial district attracts international business travellers and city professionals. The cluster of luxury hotels makes it ideal for outcall.

**Best for:** Business travellers, hotel outcall, after-work evenings.

[Escorts in Canary Wharf →](/escorts-in/canary-wharf)
`,
  'discretion-privacy-guide': `
## How Virel Protects Your Privacy

At Virel, discretion isn't a feature — it's a foundation. Here's exactly how we protect your information and ensure your privacy at every step.

### What Information We Collect

When you make a booking, we collect:
- Your name (first name is sufficient)
- Your phone number (required for confirmation)
- Your email (optional)
- Booking details (date, time, companion, duration)

That's it. We don't ask for your surname, address, employer, or any other identifying information.

### How We Store Your Data

Booking information is stored securely and used solely to confirm and manage your booking. We do not maintain long-term client databases. Historical booking data is not retained beyond what's operationally necessary.

### Our Communications

- We contact you only via the number you provide
- We never call from identifiable Virel numbers
- Messages are professional and contain no explicit content
- We never leave voicemails with identifying information

### What We Never Do

- We never share client information with companions beyond what's necessary for the booking
- We never share client information with third parties
- We never use client information for marketing
- Companions do not have access to client contact details after a booking is complete

### Our Companions' Discretion

Every companion at Virel signs a confidentiality agreement. They do not discuss clients with other companions or outside parties. Your privacy is protected on both sides of the booking.

### If You Have Concerns

If you have specific privacy requirements — a particular name preference, specific communication methods, or other needs — [contact us](/contact) before booking and we'll accommodate you.

Your comfort and security are our priority. We've built Virel to be the kind of agency we'd want to use ourselves.
`,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = POSTS.find(p => p.slug === params.slug)
  if (!post) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: `${post.title} | Virel Blog`,
    description: post.excerpt,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://virel-v3.vercel.app/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://virel-v3.vercel.app/blog/${params.slug}`,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

function renderMarkdown(content: string) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 300, color: '#f0e8dc', margin: '48px 0 20px', lineHeight: 1.2 }}>{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, color: '#c9a84c', margin: '32px 0 12px' }}>{line.slice(4)}</h3>)
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={i} style={{ fontSize: 14, color: '#ddd5c8', lineHeight: 1.9, margin: '0 0 8px', fontWeight: 500 }}>{line.slice(2, -2)}</p>)
    } else if (line.startsWith('- ')) {
      const items = [line]
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++; items.push(lines[i])
      }
      elements.push(
        <ul key={i} style={{ margin: '0 0 20px', paddingLeft: 20 }}>
          {items.map((item, j) => {
            const text = item.slice(2)
            const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/)
            return (
              <li key={j} style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.9, marginBottom: 4 }}>
                {parts.map((part, k) => {
                  if (k % 3 === 1) return <Link key={k} href={parts[k + 1]} style={{ color: '#c9a84c', textDecoration: 'none' }}>{part}</Link>
                  if (k % 3 === 2) return null
                  return part
                })}
              </li>
            )
          })}
        </ul>
      )
    } else if (line.trim() === '') {
      // skip empty
    } else {
      // Regular paragraph with link parsing
      const parts = line.split(/\[([^\]]+)\]\(([^)]+)\)/)
      elements.push(
        <p key={i} style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.9, margin: '0 0 20px' }}>
          {parts.map((part, k) => {
            if (k % 3 === 1) return <Link key={k} href={parts[k + 1]} style={{ color: '#c9a84c', textDecoration: 'none' }}>{part}</Link>
            if (k % 3 === 2) return null
            // bold within paragraph
            const boldParts = part.split(/\*\*([^*]+)\*\*/)
            return boldParts.map((bp, bk) => bk % 2 === 1
              ? <strong key={bk} style={{ color: '#ddd5c8' }}>{bp}</strong>
              : bp
            )
          })}
        </p>
      )
    }
    i++
  }
  return elements
}

export default function BlogPostPage({ params }: Props) {
  const post = POSTS.find(p => p.slug === params.slug)
  if (!post) notFound()

  const content = CONTENT[params.slug]
  const otherPosts = POSTS.filter(p => p.slug !== params.slug).slice(0, 3)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    publisher: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
    url: `https://virel-v3.vercel.app/blog/${post.slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .article-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }
        .article-breadcrumb { font-size:11px; letter-spacing:.1em; color:#3a3530; padding:20px 40px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .article-breadcrumb a { color:#3a3530; text-decoration:none; }
        .article-breadcrumb a:hover { color:#c9a84c; }
        .article-hero { max-width:800px; margin:0 auto; padding:80px 40px 60px; border-bottom:1px solid rgba(255,255,255,0.05); }
        .article-cat { font-size:10px; letter-spacing:.25em; color:#c9a84c; text-transform:uppercase; display:block; margin-bottom:20px; }
        .article-title { font-family:'Cormorant Garamond',serif; font-size:clamp(36px,5vw,60px); font-weight:300; color:#f0e8dc; margin:0 0 20px; line-height:1.15; }
        .article-meta { font-size:12px; color:#3a3530; letter-spacing:.06em; display:flex; gap:20px; }
        .article-body { max-width:800px; margin:0 auto; padding:60px 40px 80px; }
        .article-excerpt { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:300; color:#9a9189; line-height:1.6; margin-bottom:48px; padding-bottom:48px; border-bottom:1px solid rgba(255,255,255,0.06); font-style:italic; }
        .related-wrap { max-width:1280px; margin:0 auto; padding:60px 40px; border-top:1px solid rgba(255,255,255,0.05); }
        @media(max-width:600px){ .article-hero,.article-body,.related-wrap{padding-left:20px;padding-right:20px;} }
        .related-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(255,255,255,0.03); margin-top:32px; }
        @media(max-width:700px){ .related-grid{grid-template-columns:1fr;} }
        .related-card { background:#080808; padding:28px 24px; text-decoration:none; transition:background .2s; }
        .related-card:hover { background:#0d0c0a; }
        .related-cat { font-size:10px; letter-spacing:.18em; color:#c9a84c; text-transform:uppercase; margin-bottom:10px; display:block; }
        .related-title { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; color:#ddd5c8; line-height:1.3; transition:color .2s; }
        .related-card:hover .related-title { color:#c9a84c; }
      `}</style>

      <div className="article-root">
        <Header />

        <div className="article-breadcrumb">
          <Link href="/">HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <Link href="/blog">BLOG</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>{post.category.toUpperCase()}</span>
        </div>

        <div className="article-hero">
          <span className="article-cat">{post.category}</span>
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        <div className="article-body">
          <p className="article-excerpt">{post.excerpt}</p>
          {content ? renderMarkdown(content) : (
            <p style={{ color: '#6b6560', fontStyle: 'italic' }}>Content coming soon.</p>
          )}

          <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16 }}>
            <Link href="/london-escorts" style={{ padding: '14px 28px', background: '#c9a84c', color: '#080808', textDecoration: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
              Browse Companions
            </Link>
            <Link href="/blog" style={{ padding: '14px 28px', border: '1px solid rgba(255,255,255,0.1)', color: '#6b6560', textDecoration: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>
              More Articles
            </Link>
          </div>
        </div>

        {/* Related posts */}
        <div className="related-wrap">
          <span style={{ fontSize: 10, letterSpacing: '.2em', color: '#c9a84c', textTransform: 'uppercase' }}>More Articles</span>
          <div className="related-grid">
            {otherPosts.map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="related-card">
                <span className="related-cat">{p.category}</span>
                <p className="related-title">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
