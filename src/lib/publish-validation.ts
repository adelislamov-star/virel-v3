import { prisma } from '@/lib/db/client'

export interface AuditCheck {
  key: string
  label: string
  passed: boolean
  dbCount: number
  siteCount: number
  hint: string
}

export interface PublishAuditResult {
  ready: boolean
  score: number
  checks: AuditCheck[]
}

export async function auditModelReadiness(modelId: string): Promise<PublishAuditResult> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: {
      stats: true,
      media: { where: { isPublic: true } },
      modelRates: {
        include: { callRateMaster: true },
        where: { OR: [{ incallPrice: { not: null } }, { outcallPrice: { not: null } }] },
      },
      services: { where: { isEnabled: true, service: { isPublic: true } }, include: { service: true } },
      modelLocations: { include: { district: true } },
    },
  })

  if (!model) {
    return {
      ready: false,
      score: 0,
      checks: [{
        key: 'exists', label: 'Model found', passed: false,
        dbCount: 0, siteCount: 0, hint: 'Model not found in database',
      }],
    }
  }

  const statsFields = [
    'age', 'height', 'weight', 'bustSize', 'bustType', 'eyeColour', 'hairColour',
    'nationality', 'dressSize', 'feetSize', 'smokingStatus', 'tattooStatus', 'orientation',
  ]
  const statsInDB = model.stats
    ? statsFields.filter(f => {
        const v = (model.stats as any)[f]
        return v != null && v !== ''
      }).length + (model.stats.languages?.length ? 1 : 0)
    : 0
  const totalStatsInDB = statsInDB

  const checks: AuditCheck[] = [
    {
      key: 'name',
      label: 'Name & Slug',
      passed: !!(model.name?.trim() && model.slug?.trim()),
      dbCount: model.name && model.slug ? 1 : 0,
      siteCount: model.name && model.slug ? 1 : 0,
      hint: 'Fill in model name and URL slug in Basic Info',
    },
    {
      key: 'bio',
      label: 'Bio / Description',
      passed: !!(model.bio && model.bio.trim().length >= 20),
      dbCount: model.bio ? model.bio.trim().length : 0,
      siteCount: model.bio ? model.bio.trim().length : 0,
      hint: 'Add a bio of at least 20 characters in Marketing section',
    },
    {
      key: 'photos',
      label: 'Photos',
      passed: model.media.length >= 1,
      dbCount: model.media.length,
      siteCount: model.media.length,
      hint: 'Upload at least 1 public photo in Media section',
    },
    {
      key: 'rates',
      label: 'Rates',
      passed: model.modelRates.length >= 1,
      dbCount: model.modelRates.length,
      siteCount: model.modelRates.length,
      hint: 'Add at least 1 rate with a price in Rates section',
    },
    {
      key: 'services',
      label: 'Services',
      passed: model.services.length >= 1,
      dbCount: model.services.length,
      siteCount: model.services.length,
      hint: 'Enable at least 1 service in Services section',
    },
    {
      key: 'stats',
      label: 'Physical Details',
      passed: totalStatsInDB >= 5,
      dbCount: totalStatsInDB,
      siteCount: totalStatsInDB,
      hint: `Only ${totalStatsInDB} detail fields filled. Add at least 5 (age, height, nationality, etc.)`,
    },
  ]

  const passed = checks.filter(c => c.passed).length
  const score = Math.round((passed / checks.length) * 100)

  return {
    ready: checks.every(c => c.passed),
    score,
    checks,
  }
}
