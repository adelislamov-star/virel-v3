import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';
import { requireRole, isActor } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const { id } = await params;
    const rates = await prisma.modelRate.findMany({
      where: { modelId: id },
      include: {
        callRateMaster: { select: { label: true, durationMin: true, sortOrder: true } },
      },
      orderBy: { callRateMaster: { sortOrder: 'asc' } },
    });
    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error('[models/[id]/rates GET]', error);
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
    const { rates } = body as {
      rates: { callRateMasterId: string; incallPrice: number | null; outcallPrice: number | null }[];
    };

    await prisma.$transaction(async (tx) => {
      await tx.modelRate.deleteMany({ where: { modelId } });

      const validRates = rates.filter(
        (r) => r.incallPrice !== null || r.outcallPrice !== null,
      );

      if (validRates.length > 0) {
        await tx.modelRate.createMany({
          data: validRates.map((r) => ({
            modelId,
            callRateMasterId: r.callRateMasterId,
            incallPrice: r.incallPrice,
            outcallPrice: r.outcallPrice,
          })),
        });
      }
    });

    logAudit({
      action: 'UPDATE',
      entityType: 'ModelRates',
      entityId: modelId,
      req: request,
    });

    // Revalidate frontend caches
    try {
      const m = await prisma.model.findUnique({ where: { id: modelId }, select: { slug: true } });
      if (m?.slug) revalidatePath(`/companions/${m.slug}`);
    } catch {}
    revalidatePath('/companions');

    return NextResponse.json({ success: true, message: 'Rates updated' });
  } catch (error) {
    console.error('[models/[id]/rates POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
