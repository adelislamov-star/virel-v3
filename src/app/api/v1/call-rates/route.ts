import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rates = await prisma.callRateMaster.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error('[call-rates GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER']);
    if (!isActor(auth)) return auth;

    const body = await request.json();
    const { label, durationMin, sortOrder, isActive } = body;

    if (!label || !durationMin) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'label and durationMin are required' } },
        { status: 400 },
      );
    }

    const rate = await prisma.callRateMaster.create({
      data: {
        label,
        durationMin,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'CallRateMaster',
      entityId: rate.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: rate });
  } catch (error) {
    console.error('[call-rates POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
