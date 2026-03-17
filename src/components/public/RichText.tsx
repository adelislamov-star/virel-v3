/**
 * Renders a plain-text string that may contain <a href="...">text</a> tags
 * as React elements, replacing <a> with Next.js <Link> for internal paths.
 */
'use client'

import Link from 'next/link'
import { Fragment, type CSSProperties } from 'react'

const LINK_RE = /<a\s+href="([^"]+)">(.*?)<\/a>/g

const linkStyle: CSSProperties = {
  color: '#C5A572',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(197,165,114,0.3)',
}

export function RichText({ text }: { text: string }) {
  const parts: (string | { href: string; label: string })[] = []
  let last = 0

  for (const m of text.matchAll(LINK_RE)) {
    if (m.index! > last) parts.push(text.slice(last, m.index!))
    parts.push({ href: m[1], label: m[2] })
    last = m.index! + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <Fragment key={i}>{p}</Fragment>
        ) : p.href.startsWith('/') ? (
          <Link key={i} href={p.href} style={linkStyle}>{p.label}</Link>
        ) : (
          <a key={i} href={p.href} style={linkStyle} target="_blank" rel="noopener noreferrer">{p.label}</a>
        )
      )}
    </>
  )
}
