export interface Category {
  slug: string
  name: string
  group: 'appearance' | 'nationality' | 'experience'
}

export const categories: Category[] = [
  // Appearance
  { slug: 'blonde', name: 'Blonde', group: 'appearance' },
  { slug: 'brunette', name: 'Brunette', group: 'appearance' },
  { slug: 'redhead', name: 'Redhead', group: 'appearance' },
  { slug: 'petite', name: 'Petite', group: 'appearance' },
  { slug: 'slim', name: 'Slim', group: 'appearance' },
  { slug: 'curvy', name: 'Curvy', group: 'appearance' },
  { slug: 'busty', name: 'Busty', group: 'appearance' },
  { slug: 'tall', name: 'Tall', group: 'appearance' },
  { slug: 'mature', name: 'Mature', group: 'appearance' },
  { slug: 'young', name: 'Young', group: 'appearance' },

  // Nationality
  { slug: 'russian', name: 'Russian', group: 'nationality' },
  { slug: 'ukrainian', name: 'Ukrainian', group: 'nationality' },
  { slug: 'polish', name: 'Polish', group: 'nationality' },
  { slug: 'czech', name: 'Czech', group: 'nationality' },
  { slug: 'french', name: 'French', group: 'nationality' },
  { slug: 'italian', name: 'Italian', group: 'nationality' },
  { slug: 'spanish', name: 'Spanish', group: 'nationality' },
  { slug: 'brazilian', name: 'Brazilian', group: 'nationality' },
  { slug: 'latin', name: 'Latin', group: 'nationality' },
  { slug: 'asian', name: 'Asian', group: 'nationality' },
  { slug: 'eastern-european', name: 'Eastern European', group: 'nationality' },

  // Experience
  { slug: 'gfe', name: 'GFE', group: 'experience' },
  { slug: 'vip', name: 'VIP', group: 'experience' },
  { slug: 'elite', name: 'Elite', group: 'experience' },
  { slug: 'high-class', name: 'High Class', group: 'experience' },
  { slug: 'dinner-date', name: 'Dinner Date', group: 'experience' },
  { slug: 'overnight', name: 'Overnight', group: 'experience' },
  { slug: 'travel-companion', name: 'Travel Companion', group: 'experience' },
  { slug: 'bisexual', name: 'Bisexual', group: 'experience' },
  { slug: 'party', name: 'Party', group: 'experience' },
]

export const groupLabels: Record<string, string> = {
  appearance: 'By Appearance',
  nationality: 'By Nationality',
  experience: 'By Experience',
}
