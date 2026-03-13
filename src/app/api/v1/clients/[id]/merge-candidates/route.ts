// GET /api/v1/clients/:id/merge-candidates — pending merge candidates
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 },
      );
    }

    const candidates = await prisma.clientMergeCandidate.findMany({
      where: {
        status: 'open',
        OR: [
          { primaryClientId: params.id },
          { duplicateClientId: params.id },
        ],
      },
      include: {
        primaryClient: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        duplicateClient: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
      orderBy: { score: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { candidates },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
