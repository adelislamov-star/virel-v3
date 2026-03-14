import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const district = await prisma.district.findUnique({
      where: { slug },
      include: {
        transportHubs: { where: { isActive: true } },
        modelLocations: {
          where: { model: { status: 'published', deletedAt: null } },
          include: {
            model: {
              select: {
                id: true,
                name: true,
                slug: true,
                tagline: true,
                availability: true,
                isVerified: true,
                isExclusive: true,
                media: {
                  where: { isPrimary: true },
                  select: { url: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!district || !district.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'District not found' } },
        { status: 404 },
      );
    }

    const models = district.modelLocations.map((ml) => ({
      ...ml.model,
      coverPhotoUrl: ml.model.media[0]?.url ?? null,
      isPrimary: ml.isPrimary,
      media: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: { ...district, models, modelLocations: undefined },
    });
  } catch (error) {
    console.error('[public/districts/[slug] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
