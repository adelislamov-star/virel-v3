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
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'CONTENT_MANAGER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: { content: true },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('[categories/[id] GET]', error);
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
    const before = await prisma.category.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const category = await prisma.category.update({ where: { id }, data: body });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'Category',
      entityId: id,
      before,
      after: category,
      req: request,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('[categories/[id] PUT]', error);
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
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 },
      );
    }

    const modelCount = await prisma.modelCategory.count({ where: { categoryId: id } });
    if (modelCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Cannot delete: ${modelCount} model(s) reference this category`,
          },
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({ where: { id } });

    logAudit({
      actorUserId: auth.userId,
      action: 'DELETE',
      entityType: 'Category',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('[categories/[id] DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
