import { Metadata } from 'next'
import { siteConfig } from '@/../config/site'

export const metadata: Metadata = {
  title: 'Find Your Perfect Companion',
  description: 'Answer 5 quick questions and we\'ll match you with your ideal London companion.',
  alternates: { canonical: `${siteConfig.domain}/find-your-match` },
  robots: { index: false, follow: false },
}

export default function FindYourMatchLayout({ children }: { children: React.ReactNode }) {
  return children
}
