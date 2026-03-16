import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';
import { requireRole, isActor } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const { id } = await params;
    const locations = await prisma.modelLocation.findMany({
      where: { modelId: id },
      include: {
        district: { select: { id: true, name: true, slug: true, tier: true } },
      },
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('[models/[id]/locations GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;
    const { id: modelId } = await params;
    const body = await request.json();
    const { districtIds, primaryDistrictId, transportHubId, walkingMinutes } = body as {
      districtIds: string[];
      primaryDistrictId: string;
      transportHubId?: string;
      walkingMinutes?: number;
    };

    await prisma.$transaction(async (tx) => {
      await tx.modelLocation.deleteMany({ where: { modelId } });

      if (districtIds.length > 0) {
        await tx.modelLocation.createMany({
          data: districtIds.map((districtId) => ({
            modelId,
            districtId,
            isPrimary: districtId === primaryDistrictId,
            transportHubId: districtId === primaryDistrictId ? (transportHubId ?? null) : null,
            walkingMinutes: districtId === primaryDistrictId ? (walkingMinutes ?? null) : null,
          })),
        });
      }
    });

    logAudit({
      action: 'UPDATE',
      entityType: 'ModelLocations',
      entityId: modelId,
      req: request,
    });

    try {
      const m = await prisma.model.findUnique({ where: { id: modelId }, select: { slug: true } })
      if (m?.slug) {
        revalidatePath(`/companions/${m.slug}`)
        revalidatePath('/companions')
        revalidatePath('/')
      }
    } catch {}

    return NextResponse.json({ success: true, message: 'Locations updated' });
  } catch (error) {
    console.error('[models/[id]/locations POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
