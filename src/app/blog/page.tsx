// @ts-nocheck
export const revalidate = 86400

import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteConfig } from '@/../config/site'
import { prisma } from '@/lib/db/client'
import './blog.css'

export const metadata: Metadata = {
  title: `London Escort Blog & Guides | ${siteConfig.name}`,
  description: `Guides, tips, and insights from ${siteConfig.name} — London's premier companion agency. Discover the best districts, hotels, and everything you need to know.`,
  alternates: { canonical: `${siteConfig.domain}/blog` },
}

function computeReadTime(content: string): string {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, title: true, excerpt: true, category: true, publishedAt: true, content: true },
  })

  return (
    <>
      <div className="blog-root">
        <Header />

        <div className="blog-breadcrumb">
          <Link href="/">HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>BLOG</span>
        </div>

        <div className="blog-hero">
          <span className="blog-eyebrow">Insights &amp; Guides</span>
          <h1 className="blog-title">The Vaurel <em>Journal</em></h1>
          <p className="blog-desc">Expert guides, insider tips, and everything you need to know about premium companionship in London.</p>
        </div>

        <div className="blog-grid-wrap">
          <div className="blog-grid">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
                <span className="post-cat">{post.category}</span>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-excerpt">{post.excerpt}</p>
                <div className="post-meta">
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(siteConfig.lang, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                  <span>·</span>
                  <span>{computeReadTime(post.content)}</span>
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
