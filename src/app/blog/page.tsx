// @ts-nocheck
export const revalidate = 86400

import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteConfig } from '@/../config/site'
import { blogPosts } from '@/../data/blog-posts'
import './blog.css'

export const metadata: Metadata = {
  title: 'Blog',
  description: `Guides, tips, and insights from ${siteConfig.name} — London's premier companion agency. Discover the best districts, hotels, and everything you need to know.`,
  alternates: { canonical: `${siteConfig.domain}/blog` },
}

export default function BlogPage() {
  const sorted = [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

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
            {sorted.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="post-card">
                <span className="post-cat">{post.category}</span>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-excerpt">{post.description}</p>
                <div className="post-meta">
                  <span>{new Date(post.publishedAt).toLocaleDateString(siteConfig.lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
