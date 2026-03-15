import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { toSlug } from '@/lib/slug';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPublished = searchParams.get('isPublished');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isPublished !== null) where.isPublished = isPublished === 'true';
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error('[blog GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const body = await request.json();

    if (!body.title || !body.category) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'title and category are required' } },
        { status: 400 },
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug: body.slug || toSlug(body.title),
        category: body.category,
        excerpt: body.excerpt ?? null,
        content: body.content ?? '',
        coverImage: body.coverImage ?? null,
        tags: body.tags ?? [],
        relatedDistricts: body.relatedDistricts ?? [],
        relatedServices: body.relatedServices ?? [],
        isPublished: body.isPublished ?? false,
        publishedAt: body.isPublished ? new Date() : null,
        authorName: auth.name,
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'BlogPost',
      entityId: post.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('[blog POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
