import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const district = await prisma.district.findUnique({
      where: { id },
      include: {
        transportHubs: true,
        modelLocations: {
          include: { model: { select: { id: true, name: true, slug: true, status: true } } },
          where: { model: { status: 'active', deletedAt: null } },
        },
      },
    });
    if (!district) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'District not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: district });
  } catch (error) {
    console.error('[districts/[id] GET]', error);
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
    const before = await prisma.district.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'District not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const district = await prisma.district.update({ where: { id }, data: body });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'District',
      entityId: id,
      before,
      after: district,
      req: request,
    });

    return NextResponse.json({ success: true, data: district });
  } catch (error) {
    console.error('[districts/[id] PUT]', error);
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

    const usedBy = await prisma.modelLocation.count({ where: { districtId: id } });
    if (usedBy > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'District is in use by models' } },
        { status: 409 },
      );
    }

    await prisma.district.delete({ where: { id } });

    logAudit({
      actorUserId: auth.userId,
      action: 'DELETE',
      entityType: 'District',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'District deleted' });
  } catch (error) {
    console.error('[districts/[id] DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
