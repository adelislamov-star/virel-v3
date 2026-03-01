// @ts-nocheck
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Blog | Virel London Escorts',
  description: 'Guides, tips, and insights from Virel — London\'s premier escort agency. Discover the best districts, hotels, and everything you need to know.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://virel-v3.vercel.app/blog' },
}

// Static blog posts — replace with DB later
export const POSTS = [
  {
    slug: 'guide-to-booking-escort-london',
    title: 'The Complete Guide to Booking an Escort in London',
    excerpt: 'Everything you need to know about booking a premium companion in London — from choosing the right escort to understanding rates and discretion.',
    category: 'Guide',
    readTime: '5 min read',
    date: '2025-12-01',
    image: null,
  },
  {
    slug: 'best-hotels-mayfair-private-meetings',
    title: 'Best Hotels in Mayfair for Private Meetings',
    excerpt: 'A curated guide to London\'s most discreet and luxurious hotels in Mayfair — perfect for hosting a companion or arranging an outcall booking.',
    category: 'Lifestyle',
    readTime: '4 min read',
    date: '2025-11-20',
    image: null,
  },
  {
    slug: 'incall-vs-outcall-difference',
    title: 'Incall vs Outcall: What\'s the Difference?',
    excerpt: 'Not sure whether to book incall or outcall? We explain both options in detail so you can make the right choice for your booking.',
    category: 'Guide',
    readTime: '3 min read',
    date: '2025-11-10',
    image: null,
  },
  {
    slug: 'london-escort-agency-vs-independent',
    title: 'Escort Agency vs Independent Escort: Pros and Cons',
    excerpt: 'Weighing up the differences between booking through a reputable London escort agency and going direct with an independent companion.',
    category: 'Guide',
    readTime: '4 min read',
    date: '2025-10-28',
    image: null,
  },
  {
    slug: 'most-exclusive-london-districts',
    title: 'London\'s Most Exclusive Districts for Escort Services',
    excerpt: 'From Mayfair to Belgravia, we explore London\'s most prestigious postcodes and what makes each neighbourhood special for our companions.',
    category: 'Lifestyle',
    readTime: '6 min read',
    date: '2025-10-15',
    image: null,
  },
  {
    slug: 'discretion-privacy-guide',
    title: 'Discretion & Privacy: How We Protect Our Clients',
    excerpt: 'A transparent look at how Virel handles client information, communications, and bookings to ensure complete confidentiality at every step.',
    category: 'About Virel',
    readTime: '3 min read',
    date: '2025-09-30',
    image: null,
  },
]

const CATEGORIES = ['All', 'Guide', 'Lifestyle', 'About Virel']

export default function BlogPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .blog-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }

        .blog-hero { padding:80px 40px 60px; border-bottom:1px solid rgba(255,255,255,0.05); max-width:1280px; margin:0 auto; }
        @media(max-width:600px){ .blog-hero{padding:60px 20px 40px;} }
        .blog-eyebrow { font-size:10px; letter-spacing:.25em; color:#c9a84c; text-transform:uppercase; display:block; margin-bottom:16px; }
        .blog-title { font-family:'Cormorant Garamond',serif; font-size:clamp(48px,6vw,80px); font-weight:300; color:#f0e8dc; margin:0 0 16px; line-height:1; }
        .blog-title em { font-style:italic; color:#c9a84c; }
        .blog-desc { font-size:14px; color:#6b6560; max-width:500px; line-height:1.8; }

        .blog-grid-wrap { max-width:1280px; margin:0 auto; padding:60px 40px; }
        @media(max-width:600px){ .blog-grid-wrap{padding:40px 20px;} }
        .blog-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(255,255,255,0.03); }
        @media(max-width:900px){ .blog-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:550px){ .blog-grid{grid-template-columns:1fr;} }

        .post-card { background:#080808; text-decoration:none; display:flex; flex-direction:column; padding:36px 32px; border-bottom:1px solid transparent; transition:background .2s,border-color .2s; }
        .post-card:hover { background:#0d0c0a; }
        .post-cat { font-size:10px; letter-spacing:.2em; color:#c9a84c; text-transform:uppercase; margin-bottom:16px; }
        .post-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:300; color:#f0e8dc; line-height:1.3; margin:0 0 14px; transition:color .2s; }
        .post-card:hover .post-title { color:#c9a84c; }
        .post-excerpt { font-size:13px; color:#6b6560; line-height:1.8; margin:0 0 24px; flex:1; }
        .post-meta { font-size:11px; color:#3a3530; letter-spacing:.06em; display:flex; gap:16px; align-items:center; }
        .post-read-more { font-size:10px; letter-spacing:.15em; color:#6b6560; text-transform:uppercase; margin-top:auto; display:block; padding-top:20px; border-top:1px solid rgba(255,255,255,0.05); transition:color .2s; }
        .post-card:hover .post-read-more { color:#c9a84c; }

        .blog-breadcrumb { font-size:11px; letter-spacing:.1em; color:#3a3530; padding:20px 40px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .blog-breadcrumb a { color:#3a3530; text-decoration:none; }
        .blog-breadcrumb a:hover { color:#c9a84c; }
      `}</style>

      <div className="blog-root">
        <Header />

        <div className="blog-breadcrumb">
          <Link href="/">HOME</Link>
          <span style={{ margin:'0 12px' }}>—</span>
          <span style={{ color:'#c9a84c' }}>BLOG</span>
        </div>

        <div className="blog-hero">
          <span className="blog-eyebrow">Insights & Guides</span>
          <h1 className="blog-title">The Virel <em>Journal</em></h1>
          <p className="blog-desc">Expert guides, insider tips, and everything you need to know about premium companionship in London.</p>
        </div>

        <div className="blog-grid-wrap">
          <div className="blog-grid">
            {POSTS.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
                <span className="post-cat">{post.category}</span>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-excerpt">{post.excerpt}</p>
                <div className="post-meta">
                  <span>{new Date(post.date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <span className="post-read-more">Read Article →</span>
              </Link>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
