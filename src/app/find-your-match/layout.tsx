import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Your Perfect Companion',
  description: 'Answer 5 quick questions and we\'ll match you with your ideal London companion.',
  alternates: { canonical: 'https://virel-v3.vercel.app/find-your-match' },
}

export default function FindYourMatchLayout({ children }: { children: React.ReactNode }) {
  return children
}
