// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
function formatServiceName(raw: string): string {
  if (!raw) return ''
  if (/[A-Z]/.test(raw) || raw.includes(' ')) return raw
  const acronyms = ['b2b', 'owc', 'gfe', 'fk', 'dfk', 'owo', 'pse', 'bdsm', '69']
  if (acronyms.includes(raw.toLowerCase())) return raw.toUpperCase()
  return raw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
export const runtime = 'nodejs'
export const revalidate = 0
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const model = await prisma.model.findUnique({
      where: { slug: params.slug, status: 'active', deletedAt: null },
      include: {
        stats: true,
        media: {
          where: { isPublic: true },
          orderBy: { sortOrder: 'asc' },
        },
        modelRates: {
          orderBy: { durationType: 'asc' },
        },
        services: {
          where: { isEnabled: true, service: { isPublic: true } },
          include: { service: true },
          orderBy: { service: { sortOrder: 'asc' } },
        },
        modelLocations: {
          include: { district: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })
    if (!model) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 })
    }
    // Primary photo and gallery
    const primaryPhoto = model.media.find((m) => m.isPrimary)?.url ?? model.media[0]?.url ?? null
    const galleryUrls = model.media
      .filter((m) => m.isPublic && m.url !== primaryPhoto)
      .map((m) => m.url)
    // Rates table — group by durationType into incall/outcall rows
    const { durationLabel: getDurLabel } = await import('@/lib/durationLabel')
    const { sortRates } = await import('@/lib/sortRates')
    const sorted = sortRates(model.modelRates.map(r => ({ duration_type: r.durationType, ...r })))
    const rateMap = new Map<string, { incall: number | null; outcall: number | null; taxiFee: number | null }>()
    for (const r of sorted) {
      const entry = rateMap.get(r.durationType) ?? { incall: null, outcall: null, taxiFee: null }
      if (r.callType === 'incall') entry.incall = Number(r.price)
      if (r.callType === 'outcall') { entry.outcall = Number(r.price); entry.taxiFee = r.taxiFee ? Number(r.taxiFee) : null }
      rateMap.set(r.durationType, entry)
    }
    const rates = Array.from(rateMap.entries()).map(([durationType, p]) => ({
      label: getDurLabel(durationType),
      durationType,
      incall: p.incall,
      outcall: p.outcall,
      taxiFee: p.taxiFee,
    }))
    // Lowest price for display
    const allPrices = model.modelRates.map(r => Number(r.price)).filter(v => v > 0)
    const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null
    // Services
    const services = model.services.map((ms) => ({
      serviceId: ms.serviceId,
      slug: ms.service?.slug ?? '',
      name: formatServiceName(ms.service?.publicName ?? ms.service?.name ?? ms.service?.slug ?? ''),
      isExtra: ms.isExtra ?? false,
      isDoublePrice: ms.isDoublePrice ?? false,
      isPOA: ms.isPOA ?? false,
      extraPrice: ms.extraPrice != null ? Number(ms.extraPrice) : null,
    }))
    // Locations
    const districts = model.modelLocations.map((ml) => ({
      name: ml.district?.name ?? '',
      slug: ml.district?.slug ?? '',
      isPrimary: ml.isPrimary,
    }))
    const primaryDistrict = districts.find((d) => d.isPrimary)?.name
      ?? districts[0]?.name
      ?? null
    // Stats / physical details
    const stats = model.stats
    return NextResponse.json({
      success: true,
      data: {
        id: model.id,
        name: model.name,
        slug: model.slug,
        tagline: model.tagline,
        bio: model.bio,
        seoTitle: model.seoTitle,
        seoDescription: model.seoDescription,
        availability: model.availability,
        isVerified: model.isVerified,
        isExclusive: model.isExclusive,
        lastActiveAt: model.lastActiveAt?.toISOString() ?? null,
        nearestStation: model.nearestStation,
        telegramTag: model.telegram ? model.telegramPhone ?? null : null,
        whatsapp: model.whatsapp ?? null,
        primaryPhoto,
        galleryUrls,
        rates,
        lowestPrice,
        services,
        districts,
        primaryDistrict,
        stats: stats ? {
          age: stats.age,
          height: stats.height,
          weight: stats.weight,
          bustSize: stats.bustSize,
          bustType: stats.bustType,
          eyeColour: stats.eyeColour,
          hairColour: stats.hairColour,
          nationality: stats.nationality,
          ethnicity: model.ethnicity,
          languages: stats.languages,
          dressSize: stats.dressSize,
          feetSize: stats.feetSize,
          smokingStatus: stats.smokingStatus,
          tattooStatus: stats.tattooStatus,
          measurements: model.measurements,
          orientation: stats.orientation,
        } : null,
      },
    })
  } catch (e: any) {
    console.error('[public/profile] error:', e)
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
