// SEO PAGE DETAIL API
// PATCH /api/v1/seo/pages/[id] — update SEO page metadata

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

export const runtime = 'nodejs';

const UpdateSEOPageSchema = z.object({
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  indexStatus: z.enum(['indexed', 'not_indexed', 'blocked']).optional(),
  canonicalUrl: z.string().url().optional().nullable(),
  schemaMarkup: z.any().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = UpdateSEOPageSchema.parse(body);

    const page = await prisma.sEOPage.findUnique({ where: { id } });
    if (!page) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'SEO page not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.sEOPage.update({
        where: { id },
        data
      });

      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'UPDATE',
          entityType: 'seo_page',
          entityId: id,
          before: { title: page.title, metaDescription: page.metaDescription, indexStatus: page.indexStatus },
          after: data
        }
      });

      return result;
    });

    return NextResponse.json({ data: { page: updated } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
