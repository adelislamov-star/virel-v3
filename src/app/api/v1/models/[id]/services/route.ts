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
    const services = await prisma.modelService.findMany({
      where: { modelId: id },
      include: {
        service: {
          select: { id: true, title: true, name: true, publicName: true, category: true, isPublic: true },
        },
      },
    });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('[models/[id]/services GET]', error);
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
    const { serviceIds = [], extras = [], doublePriceIds = [], poaIds = [] } = body as {
      serviceIds: string[];
      extras: { serviceId: string; extraPrice: number }[];
      doublePriceIds: string[];
      poaIds: string[];
    };

    await prisma.$transaction(async (tx) => {
      await tx.modelService.deleteMany({ where: { modelId } });

      const records = serviceIds.map((serviceId: string) => ({
        modelId,
        serviceId,
        isEnabled: true,
        isExtra: false,
        extraPrice: null as number | null,
        isDoublePrice: doublePriceIds.includes(serviceId),
        isPOA: poaIds.includes(serviceId),
      }));

      for (const extra of extras) {
        const existing = records.find((r) => r.serviceId === extra.serviceId);
        if (existing) {
          existing.isExtra = true;
          existing.extraPrice = extra.extraPrice;
        } else {
          records.push({
            modelId,
            serviceId: extra.serviceId,
            isEnabled: true,
            isExtra: true,
            extraPrice: extra.extraPrice,
            isDoublePrice: doublePriceIds.includes(extra.serviceId),
            isPOA: poaIds.includes(extra.serviceId),
          });
        }
      }

      if (records.length > 0) {
        await tx.modelService.createMany({ data: records });
      }
    });

    logAudit({
      action: 'UPDATE',
      entityType: 'ModelServices',
      entityId: modelId,
      req: request,
    });

    // Revalidate frontend caches
    try {
      const m = await prisma.model.findUnique({ where: { id: modelId }, select: { slug: true } });
      if (m?.slug) revalidatePath(`/companions/${m.slug}`);
    } catch {}
    revalidatePath('/companions');

    return NextResponse.json({ success: true, message: 'Services updated' });
  } catch (error) {
    console.error('[models/[id]/services POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
