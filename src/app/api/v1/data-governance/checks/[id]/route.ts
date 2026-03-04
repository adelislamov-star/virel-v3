// DATA GOVERNANCE CHECK — PATCH resolve/ignore
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, resolvedBy } = body;

    if (!action || !['resolve', 'ignore'].includes(action)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'action must be "resolve" or "ignore"' } },
        { status: 400 }
      );
    }

    const check = await prisma.dataQualityCheck.update({
      where: { id },
      data: {
        status: action === 'resolve' ? 'resolved' : 'ignored',
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || 'admin'
      }
    });

    return NextResponse.json({ data: { check } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'UPDATE_FAILED', message: error.message } }, { status: 500 });
  }
}
