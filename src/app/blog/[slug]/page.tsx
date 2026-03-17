// @ts-nocheck
export const revalidate = 86400

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteConfig } from '@/../config/site'
import { blogPosts } from '@/../data/blog-posts'
import '../article.css'

export function generateStaticParams() {
  return blogPosts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find(p => p.slug === slug)
  if (!post) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${siteConfig.domain}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteConfig.domain}/blog/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = blogPosts.find(p => p.slug === slug)
  if (!post) notFound()

  const otherPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 3)

  const graphSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        author: { '@type': 'Organization', name: siteConfig.name },
        publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.domain },
        url: `${siteConfig.domain}/blog/${slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteConfig.domain}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${siteConfig.domain}/blog/${slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }} />

      <div className="article-root">
        <Header />

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: 8 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li><Link href="/blog" style={{ color: '#6b6560', textDecoration: 'none' }}>Blog</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li aria-current="page" style={{ color: '#C5A572' }}>{post.title}</li>
          </ol>
        </nav>

        <div className="article-hero">
          <span className="article-cat">{post.category}</span>
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span>{new Date(post.publishedAt).toLocaleDateString(siteConfig.lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        <div className="article-body">
          <p className="article-excerpt">{post.description}</p>

          <div className="article-content">
            {post.content.map((section, i) => (
              <div key={i}>
                {section.heading && <h2>{section.heading}</h2>}
                {section.body.map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16 }}>
            <Link href="/companions" style={{ padding: '14px 28px', background: '#c9a84c', color: '#080808', textDecoration: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
              Browse Companions
            </Link>
            <Link href="/blog" style={{ padding: '14px 28px', border: '1px solid rgba(255,255,255,0.1)', color: '#6b6560', textDecoration: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>
              More Articles
            </Link>
          </div>
        </div>

        {/* Related posts */}
        {otherPosts.length > 0 && (
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
        )}

        <Footer />
      </div>
    </>
  )
}
