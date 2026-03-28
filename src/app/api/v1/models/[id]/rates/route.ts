import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';
import { requireRole, isActor } from '@/lib/auth';
import { getDurationSortOrder } from '@/lib/duration-constants';

export const runtime = 'nodejs';

const VALID_DURATION_TYPES = [
  '30min','45min','1hour','90min','2hours','3hours',
  '4hours','5hours','6hours','8hours','overnight','extra_hour',
];
const VALID_CALL_TYPES = ['incall', 'outcall'];

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
    });

    const data = rawRates
      .map(r => ({
        id: r.id,
        modelId: r.modelId,
        durationType: r.durationType,
        callType: r.callType,
        price: Number(r.price),
        taxiFee: r.taxiFee != null ? Number(r.taxiFee) : null,
        currency: r.currency,
      }))
      .sort((a, b) => getDurationSortOrder(a.durationType) - getDurationSortOrder(b.durationType));

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
      rates: { durationType: string; callType: string; price: number; taxiFee?: number | null }[];
    };

    if (!Array.isArray(rates)) {
      return NextResponse.json({ error: 'rates must be an array' }, { status: 400 });
    }

    for (const r of rates) {
      if (!VALID_DURATION_TYPES.includes(r.durationType)) {
        return NextResponse.json(
          { error: `Invalid durationType: ${r.durationType}` },
          { status: 400 },
        );
      }
      if (!VALID_CALL_TYPES.includes(r.callType)) {
        return NextResponse.json(
          { error: `Invalid callType: ${r.callType}` },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.modelRate.deleteMany({ where: { modelId } });

      const data = rates
        .filter(r => r.price != null && r.price > 0)
        .map(r => ({
          modelId,
          durationType: r.durationType,
          callType: r.callType,
          price: r.price,
          taxiFee: r.taxiFee ?? null,
          currency: 'GBP',
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
