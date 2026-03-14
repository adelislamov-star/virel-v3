import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({ where: { slug } });

    if (!post || !post.isPublished) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('[public/blog/[slug] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
