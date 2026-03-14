export interface Service {
  id: string
  title: string
  name: string | null
  slug: string
  category: 'signature' | 'intimate' | 'wellness' | 'fetish' | 'bespoke'
  publicName: string | null
  description: string | null
  introText: string | null
  fullDescription: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  isPublic: boolean
  isPopular: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { models: number }
}

export interface ServiceStats {
  total: number
  public: number
  membersOnly: number
  active: number
}
