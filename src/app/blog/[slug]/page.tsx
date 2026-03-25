// @ts-nocheck
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { siteConfig } from '@/../config/site'
import { prisma } from '@/lib/db/client'
import '../article.css'

function computeReadTime(content: string): string {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, publishedAt: true },
  })
  if (!post) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || '',
    alternates: { canonical: `${siteConfig.domain}/blog/${slug}` },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || '',
      url: `${siteConfig.domain}/blog/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, otherPosts] = await Promise.all([
    prisma.blogPost.findUnique({ where: { slug, isPublished: true } }),
    prisma.blogPost.findMany({
      where: { slug: { not: slug }, isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, category: true },
      take: 3,
    }),
  ])
  if (!post) notFound()

  const readTime = computeReadTime(post.content)

  const graphSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt?.toISOString(),
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
            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(siteConfig.lang, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
            <span>·</span>
            <span>{readTime}</span>
          </div>
        </div>

        <div className="article-body">
          <p className="article-excerpt">{post.excerpt}</p>

          <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />

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

      </div>
    </>
  )
}
