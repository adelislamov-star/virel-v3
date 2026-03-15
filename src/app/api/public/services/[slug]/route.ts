import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        models: {
          where: { model: { status: 'active', deletedAt: null } },
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

    if (!service || !service.isPublic) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 },
      );
    }

    const models = service.models.map((ms) => ({
      ...ms.model,
      coverPhotoUrl: ms.model.media[0]?.url ?? null,
      media: undefined,
    }));

    const { models: _m, ...serviceData } = service;
    return NextResponse.json({
      success: true,
      data: { ...serviceData, models },
    });
  } catch (error) {
    console.error('[public/services/[slug] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
