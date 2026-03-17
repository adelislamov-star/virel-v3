import { Metadata } from 'next'
import { siteConfig } from '@/../config/site'

export const metadata: Metadata = {
  title: 'Book a Companion',
  description: `Book a companion in London with ${siteConfig.name}. Simple, discreet, professional.`,
  robots: 'noindex',
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children
}
