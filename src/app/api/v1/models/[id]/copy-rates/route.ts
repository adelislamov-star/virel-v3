import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: modelId } = await params;
    const { fromModelId } = await request.json();

    if (!fromModelId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'fromModelId is required' } },
        { status: 400 },
      );
    }

    const sourceRates = await prisma.modelRate.findMany({
      where: { modelId: fromModelId },
    });

    if (sourceRates.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Source model has no rates' } },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.modelRate.deleteMany({ where: { modelId } });
      await tx.modelRate.createMany({
        data: sourceRates.map((r) => ({
          modelId,
          callRateMasterId: r.callRateMasterId,
          incallPrice: r.incallPrice,
          outcallPrice: r.outcallPrice,
        })),
      });
    });

    logAudit({
      action: 'COPY_RATES',
      entityType: 'Model',
      entityId: modelId,
      before: { fromModelId },
      req: request,
    });

    // Revalidate frontend caches
    try {
      const m = await prisma.model.findUnique({ where: { id: modelId }, select: { slug: true } });
      if (m?.slug) revalidatePath(`/companions/${m.slug}`);
    } catch {}
    revalidatePath('/companions');

    return NextResponse.json({ success: true, message: 'Rates copied' });
  } catch (error) {
    console.error('[models/[id]/copy-rates]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
