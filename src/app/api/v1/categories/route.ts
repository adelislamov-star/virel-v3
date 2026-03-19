import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { toSlug } from '@/lib/slug';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'CONTENT_MANAGER']);
    if (!isActor(auth)) return auth;

    const categories = await prisma.category.findMany({
      include: { content: true },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('[categories GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'title is required' } },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: {
        title: body.title,
        slug: body.slug || toSlug(body.title),
        h1: body.h1 ?? null,
        status: body.status ?? 'active',
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'Category',
      entityId: category.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('[categories POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
