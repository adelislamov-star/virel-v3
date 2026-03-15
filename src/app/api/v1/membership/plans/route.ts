// MEMBERSHIP PLANS — GET list + POST create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { status: { not: 'archived' } },
      include: {
        _count: { select: { memberships: true } }
      },
      orderBy: { tier: 'asc' }
    });

    return NextResponse.json({ data: { plans } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tier, priceMonthly, bookingDiscountPercent, prioritySupportLevel, perks } = body;

    if (!name || tier === undefined || !priceMonthly) {
      return NextResponse.json({ error: { code: 'VALIDATION', message: 'name, tier, priceMonthly required' } }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        tier: parseInt(tier),
        priceMonthly: parseFloat(priceMonthly),
        bookingDiscountPercent: parseInt(bookingDiscountPercent || '0'),
        prioritySupportLevel: parseInt(prioritySupportLevel || '0'),
        perks: perks ? (typeof perks === 'string' ? JSON.parse(perks) : perks) : null
      }
    });

    return NextResponse.json({ data: { plan } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CREATE_FAILED', message: error.message } }, { status: 500 });
  }
}
