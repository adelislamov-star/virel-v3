import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const existing = await prisma.transportHub.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transport hub not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    if (body.name !== undefined) allowed.name = body.name;
    if (body.districtId !== undefined) allowed.districtId = body.districtId;
    if (body.walkingMinutes !== undefined) allowed.walkingMinutes = Number(body.walkingMinutes);
    if (body.isActive !== undefined) allowed.isActive = body.isActive;
    if (body.sortOrder !== undefined) allowed.sortOrder = Number(body.sortOrder);
    const hub = await prisma.transportHub.update({ where: { id }, data: allowed });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'TransportHub',
      entityId: id,
      before: existing,
      after: hub,
      req: request,
    });

    return NextResponse.json({ success: true, data: hub });
  } catch (error) {
    console.error('[transport-hubs/[id] PUT]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const existing = await prisma.transportHub.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transport hub not found' } },
        { status: 404 },
      );
    }
    await prisma.transportHub.delete({ where: { id } });

    logAudit({
      actorUserId: auth.userId,
      action: 'DELETE',
      entityType: 'TransportHub',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Transport hub deleted' });
  } catch (error) {
    console.error('[transport-hubs/[id] DELETE]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 });
  }
}
