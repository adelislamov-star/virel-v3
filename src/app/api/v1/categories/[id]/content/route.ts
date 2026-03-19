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
    const content = await prisma.categoryContent.findUnique({
      where: { categoryId: id },
    });
    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'CategoryContent not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('[categories/[id]/content GET]', error);
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

    // Verify the parent category exists
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();

    const before = await prisma.categoryContent.findUnique({
      where: { categoryId: id },
    });

    const content = await prisma.categoryContent.upsert({
      where: { categoryId: id },
      create: {
        categoryId: id,
        aboutParagraphs: body.aboutParagraphs ?? [],
        standardText: body.standardText ?? null,
        relatedCategories: body.relatedCategories ?? [],
        faq: body.faq ?? [],
      },
      update: {
        aboutParagraphs: body.aboutParagraphs ?? [],
        standardText: body.standardText ?? null,
        relatedCategories: body.relatedCategories ?? [],
        faq: body.faq ?? [],
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: before ? 'UPDATE' : 'CREATE',
      entityType: 'CategoryContent',
      entityId: content.id,
      before: before ?? undefined,
      after: content,
      req: request,
    });

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('[categories/[id]/content PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
