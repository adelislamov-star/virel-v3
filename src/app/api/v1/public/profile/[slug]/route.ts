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
          include: { callRateMaster: true },
          orderBy: { callRateMaster: { sortOrder: 'asc' } },
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
    // Rates table — directly from DB relation
    const rates = model.modelRates
      .filter((mr) => mr.incallPrice != null || mr.outcallPrice != null)
      .map((mr) => ({
        label: mr.callRateMaster?.label ?? '—',
        sortOrder: mr.callRateMaster?.sortOrder ?? 99,
        incall: mr.incallPrice != null ? Number(mr.incallPrice) : null,
        outcall: mr.outcallPrice != null ? Number(mr.outcallPrice) : null,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
    // Lowest price for display
    const allPrices = [
      ...rates.map((r) => r.incall).filter((v): v is number => v != null),
      ...rates.map((r) => r.outcall).filter((v): v is number => v != null),
    ]
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
