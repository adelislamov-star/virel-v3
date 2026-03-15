import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const model = await prisma.model.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        availability: true,
        isVerified: true,
        isExclusive: true,
        publicTags: true,
        measurements: true,
        education: true,
        travel: true,
        wardrobe: true,
        seoTitle: true,
        seoDescription: true,
        status: true,
        deletedAt: true,
        stats: {
          select: {
            age: true,
            height: true,
            weight: true,
            bustSize: true,
            bustType: true,
            hairColour: true,
            eyeColour: true,
            nationality: true,
            languages: true,
            orientation: true,
            dressSize: true,
            smokingStatus: true,
          },
        },
        modelRates: {
          include: { callRateMaster: { select: { label: true, durationMin: true, sortOrder: true } } },
          orderBy: { callRateMaster: { sortOrder: 'asc' } },
        },
        modelLocations: {
          include: {
            district: { select: { id: true, name: true, slug: true } },
          },
        },
        services: {
          where: { service: { isPublic: true } },
          include: {
            service: { select: { id: true, title: true, publicName: true, category: true } },
          },
        },
        media: {
          where: { isPublic: true },
          select: { id: true, url: true, type: true, isPrimary: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!model || model.status !== 'active' || model.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Model not found' } },
        { status: 404 },
      );
    }

    // Filter out intimate services
    const filteredServices = model.services
      .filter((ms) => ms.service.category !== 'Intimate')
      .map((ms) => ({
        id: ms.service.id,
        name: ms.service.publicName || ms.service.title,
        category: ms.service.category,
        isExtra: ms.isExtra,
        extraPrice: ms.extraPrice,
      }));

    const { status, deletedAt, services: _svc, ...rest } = model;

    return NextResponse.json({
      success: true,
      data: { ...rest, services: filteredServices },
    });
  } catch (error) {
    console.error('[public/models/[slug] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
