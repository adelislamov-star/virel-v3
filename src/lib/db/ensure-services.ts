import { prisma } from './client'

let servicesChecked = false

// All service codes used by the AI parsing system
// slug = lowercase with hyphens (e.g. A_LEVEL -> a-level)
const DEFAULT_SERVICES: { title: string; slug: string; isPopular: boolean }[] = [
  // Popular / Common
  { title: 'GFE', slug: 'gfe', isPopular: true },
  { title: 'OWO', slug: 'owo', isPopular: true },
  { title: 'OWC', slug: 'owc', isPopular: false },
  { title: 'DFK', slug: 'dfk', isPopular: true },
  { title: 'FK', slug: 'fk', isPopular: false },
  { title: '69', slug: '69', isPopular: true },
  { title: 'CIM', slug: 'cim', isPopular: false },
  { title: 'CIF', slug: 'cif', isPopular: false },
  { title: 'COB', slug: 'cob', isPopular: false },
  { title: 'Swallow', slug: 'swallow', isPopular: false },
  { title: 'Snowballing', slug: 'snowballing', isPopular: false },
  { title: 'DT', slug: 'dt', isPopular: false },
  { title: 'Fingering', slug: 'fingering', isPopular: false },
  // Extras
  { title: 'A-Level', slug: 'a-level', isPopular: false },
  { title: 'DP', slug: 'dp', isPopular: false },
  { title: 'PSE', slug: 'pse', isPopular: false },
  { title: 'Party Girl', slug: 'party-girl', isPopular: false },
  { title: 'Face Sitting', slug: 'face-sitting', isPopular: false },
  { title: 'Dirty Talk', slug: 'dirty-talk', isPopular: false },
  { title: 'Lady Services', slug: 'lady-services', isPopular: false },
  // WS / Rimming
  { title: 'WS Giving', slug: 'ws-giving', isPopular: false },
  { title: 'WS Receiving', slug: 'ws-receiving', isPopular: false },
  { title: 'Rimming Giving', slug: 'rimming-giving', isPopular: false },
  { title: 'Rimming Receiving', slug: 'rimming-receiving', isPopular: false },
  // Fetish
  { title: 'Smoking Fetish', slug: 'smoking-fetish', isPopular: false },
  { title: 'Roleplay', slug: 'roleplay', isPopular: false },
  { title: 'Filming (Mask)', slug: 'filming-mask', isPopular: false },
  { title: 'Filming (No Mask)', slug: 'filming-no-mask', isPopular: false },
  { title: 'Foot Fetish', slug: 'foot-fetish', isPopular: false },
  { title: 'Open Minded', slug: 'open-minded', isPopular: false },
  { title: 'Light Dom', slug: 'light-dom', isPopular: false },
  { title: 'Spanking Giving', slug: 'spanking-giving', isPopular: false },
  { title: 'Spanking Soft Receiving', slug: 'spanking-soft-receiving', isPopular: false },
  // Group
  { title: 'Duo', slug: 'duo', isPopular: true },
  { title: 'Bi Duo', slug: 'bi-duo', isPopular: false },
  { title: 'Couples', slug: 'couples', isPopular: false },
  { title: 'MMF', slug: 'mmf', isPopular: false },
  { title: 'Group', slug: 'group', isPopular: false },
  // Massage
  { title: 'Massage', slug: 'massage', isPopular: true },
  { title: 'Prostate', slug: 'prostate', isPopular: false },
  { title: 'Professional Massage', slug: 'professional-massage', isPopular: false },
  { title: 'B2B', slug: 'b2b', isPopular: false },
  { title: 'Erotic Massage', slug: 'erotic-massage', isPopular: false },
  { title: 'Lomi Lomi', slug: 'lomilomi', isPopular: false },
  { title: 'Nuru', slug: 'nuru', isPopular: false },
  { title: 'Sensual', slug: 'sensual', isPopular: false },
  { title: 'Tantric', slug: 'tantric', isPopular: false },
  // Entertainment
  { title: 'Striptease', slug: 'striptease', isPopular: false },
  { title: 'Lapdancing', slug: 'lapdancing', isPopular: false },
  { title: 'Belly Dance', slug: 'belly-dance', isPopular: false },
  // BDSM / Toys
  { title: 'Uniforms', slug: 'uniforms', isPopular: false },
  { title: 'Toys', slug: 'toys', isPopular: false },
  { title: 'Strap On', slug: 'strap-on', isPopular: false },
  { title: 'Poppers', slug: 'poppers', isPopular: false },
  { title: 'Handcuffs', slug: 'handcuffs', isPopular: false },
  { title: 'Domination', slug: 'domination', isPopular: false },
  { title: 'Fisting Giving', slug: 'fisting-giving', isPopular: false },
  { title: 'Tie & Tease', slug: 'tie-and-tease', isPopular: false },
  // Other common
  { title: 'Dinner Date', slug: 'dinner-date', isPopular: true },
  // Exact slugs from parsed documents to improve matching
  { title: 'Anal Sex', slug: 'anal-sex', isPopular: false },
  { title: 'Filming with Mask', slug: 'filming-with-mask', isPopular: false },
  { title: 'Open Mind', slug: 'open-mind', isPopular: false },
  { title: 'Light Domination', slug: 'light-domination', isPopular: false },
  { title: 'DUO Bi', slug: 'duo-bi', isPopular: false },
  { title: 'Couples Service', slug: 'couples-service', isPopular: false },
  { title: 'Prostate Massage', slug: 'prostate-massage', isPopular: false },
  { title: 'Body-to-Body Massage', slug: 'body-to-body-massage', isPopular: false },
  { title: 'Sensual Massage', slug: 'sensual-massage', isPopular: false },
  { title: 'Fisting', slug: 'fisting', isPopular: false },
  { title: 'Light Spanking Receiving', slug: 'light-spanking-receiving', isPopular: false },
  { title: 'Tie Up and Tease', slug: 'tie-up-and-tease', isPopular: false },
]

/**
 * Ensure all standard services exist in the database.
 * Safe to call repeatedly — skips existing slugs.
 */
export async function ensureServices(): Promise<number> {
  if (servicesChecked) return 0

  try {
    const existing = await prisma.service.findMany({ select: { slug: true } })
    const existingSlugs = new Set(existing.map(s => s.slug))

    const missing = DEFAULT_SERVICES.filter(s => !existingSlugs.has(s.slug))

    if (missing.length > 0) {
      await prisma.service.createMany({
        data: missing,
        skipDuplicates: true,
      })
      console.log(`[ensure-services] Created ${missing.length} services`)
    }

    servicesChecked = true
    return missing.length
  } catch (e) {
    console.error('[ensure-services] Failed:', e)
    return 0
  }
}
