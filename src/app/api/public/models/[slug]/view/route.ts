// POST /api/public/models/[slug]/view — increment view counters
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    await prisma.model.updateMany({
      where: { slug: params.slug, status: 'published', deletedAt: null },
      data: {
        viewsTotal: { increment: 1 },
        viewsToday: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
