import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const { id } = await params;

    const rawRates = await prisma.modelRate.findMany({
      where: { modelId: id },
      include: { callRateMaster: true },
    });

    const data = rawRates
      .map(r => ({
        modelId: id,
        callRateMasterId: r.callRateMasterId,
        incallPrice: r.incallPrice,
        outcallPrice: r.outcallPrice,
        callRateMaster: {
          label: r.callRateMaster.label,
          durationMin: r.callRateMaster.durationMin,
          sortOrder: r.callRateMaster.sortOrder,
        },
      }))
      .sort((a, b) => a.callRateMaster.sortOrder - b.callRateMaster.sortOrder);

    return NextResponse.json({ success: true, data });
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

      const data = rates
        .filter(r => r.incallPrice != null || r.outcallPrice != null)
        .map(r => ({
          modelId,
          callRateMasterId: r.callRateMasterId,
          incallPrice: r.incallPrice,
          outcallPrice: r.outcallPrice,
        }));

      if (data.length > 0) {
        await tx.modelRate.createMany({ data });
      }
    });

    logAudit({
      action: 'UPDATE',
      entityType: 'ModelRates',
      entityId: modelId,
      req: request,
    });

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
