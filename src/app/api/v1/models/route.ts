import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    // Admin view (all=true) requires authentication
    if (all) {
      const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
      if (!isActor(auth)) return auth;
    }

    const where = all ? {} : { status: 'active' };

    const models = await prisma.model.findMany({
      where,
      include: {
        stats: true,
        primaryLocation: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Add booking stats for admin view
    let modelsWithStats = models;
    if (all) {
      const modelIds = models.map(m => m.id);
      const completedCounts = await prisma.booking.groupBy({
        by: ['modelId'],
        where: { modelId: { in: modelIds }, status: 'completed' },
        _count: { id: true },
      });
      const completedMap = new Map(completedCounts.map(c => [c.modelId, c._count.id]));

      modelsWithStats = models.map(m => ({
        ...m,
        bookingsTotal: m._count.bookings,
        bookingsCompleted: completedMap.get(m.id) ?? 0,
      }));
    }

    return NextResponse.json({ success: true, data: { models: modelsWithStats } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 },
    );
  }
}
