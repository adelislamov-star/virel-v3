import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('[services/[id] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const before = await prisma.service.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const service = await prisma.service.update({ where: { id }, data: body });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'Service',
      entityId: id,
      before,
      after: service,
      req: request,
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('[services/[id] PUT]', error);
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

    const usedBy = await prisma.modelService.count({ where: { serviceId: id } });
    if (usedBy > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Service is in use by models' } },
        { status: 409 },
      );
    }

    await prisma.service.delete({ where: { id } });

    logAudit({
      actorUserId: auth.userId,
      action: 'DELETE',
      entityType: 'Service',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('[services/[id] DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
