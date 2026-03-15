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
    const auth = await requireRole(request, ['OWNER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const existing = await prisma.callRateMaster.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Rate not found' } },
        { status: 404 },
      );
    }
    const body = await request.json();
    const rate = await prisma.callRateMaster.update({ where: { id }, data: body });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'CallRateMaster',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, data: rate });
  } catch (error) {
    console.error('[call-rates/[id] PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const usedBy = await prisma.modelRate.count({ where: { callRateMasterId: id } });
    if (usedBy > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Rate is in use by models' } },
        { status: 409 },
      );
    }

    await prisma.callRateMaster.delete({ where: { id } });

    logAudit({
      actorUserId: auth.userId,
      action: 'DELETE',
      entityType: 'CallRateMaster',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Rate deleted' });
  } catch (error) {
    console.error('[call-rates/[id] DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
