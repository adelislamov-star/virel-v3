import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const existing = await prisma.conciergePartner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Partner not found' } },
        { status: 404 },
      );
    }
    const body = await request.json();
    const partner = await prisma.conciergePartner.update({ where: { id }, data: body });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'ConciergePartner',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('[concierge/[id] PUT]', error);
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
    const existing = await prisma.conciergePartner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Partner not found' } },
        { status: 404 },
      );
    }
    await prisma.conciergePartner.delete({ where: { id } });

    logAudit({
      actorUserId: auth.userId,
      action: 'DELETE',
      entityType: 'ConciergePartner',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Partner deleted' });
  } catch (error) {
    console.error('[concierge/[id] DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
