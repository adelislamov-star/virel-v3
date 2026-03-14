// GET /api/v1/models/:id/similarities — list similar models
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const similarities = await prisma.modelSimilarity.findMany({
      where: {
        OR: [
          { modelAId: params.id },
          { modelBId: params.id },
        ],
      },
      orderBy: { similarityScore: 'desc' },
      include: {
        modelA: { select: { id: true, name: true } },
        modelB: { select: { id: true, name: true } },
      },
    });

    // Normalize: always show the "other" model
    const normalized = similarities.map(s => ({
      id: s.id,
      similarModel: s.modelAId === params.id ? s.modelB : s.modelA,
      similarityScore: s.similarityScore,
      similarityVersion: s.similarityVersion,
      factorsJson: s.factorsJson,
    }));

    return NextResponse.json({ success: true, data: { similarities: normalized } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
