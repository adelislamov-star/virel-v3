import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Companion',
  description: 'Book a companion in London with Virel. Simple, discreet, professional.',
  robots: 'noindex',
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children
}
