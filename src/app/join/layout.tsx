import { Metadata } from 'next'
import { siteConfig } from '@/../config/site'

export const metadata: Metadata = {
  title: `Join ${siteConfig.name} | Apply as a Companion`,
  description: 'Apply to join London\'s premier companion agency. Professional, discreet, and supportive.',
  robots: 'noindex',
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
