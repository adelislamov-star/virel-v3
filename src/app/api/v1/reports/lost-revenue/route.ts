// LOST REVENUE REPORT — GET lost revenue analysis
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};
    if (from) where.createdAt = { ...where.createdAt, gte: new Date(from) };
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to) };

    const entries = await prisma.lostRevenueEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const totalLost = entries.reduce((s, e) => s + e.amount, 0);

    // Group by type
    const typeMap: Record<string, { count: number; amount: number }> = {};
    const roleMap: Record<string, { count: number; amount: number }> = {};

    for (const entry of entries) {
      // By type
      if (!typeMap[entry.type]) typeMap[entry.type] = { count: 0, amount: 0 };
      typeMap[entry.type].count++;
      typeMap[entry.type].amount += entry.amount;

      // By responsible role
      const role = entry.responsibleRole || 'unknown';
      if (!roleMap[role]) roleMap[role] = { count: 0, amount: 0 };
      roleMap[role].count++;
      roleMap[role].amount += entry.amount;
    }

    const byType = Object.entries(typeMap).map(([type, data]) => ({ type, ...data }));
    const byResponsible = Object.entries(roleMap).map(([role, data]) => ({ role, ...data }));

    return NextResponse.json({
      data: {
        totalLost: Math.round(totalLost * 100) / 100,
        byType,
        byResponsible,
        entries: entries.map(e => ({
          id: e.id,
          type: e.type,
          amount: e.amount,
          rootCause: e.rootCause,
          responsibleRole: e.responsibleRole,
          status: e.status,
          createdAt: e.createdAt
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}
