// UNIT ECONOMICS — GET detailed unit economics
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let periodStart: Date;
    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Booking-level economics
    const bookingsWithPayments = await prisma.booking.findMany({
      where: {
        createdAt: { gte: periodStart },
        status: { in: ['completed', 'confirmed', 'in_progress'] }
      },
      include: {
        payments: { where: { status: 'succeeded' } },
        model: { select: { id: true, name: true } }
      }
    });

    const totalBookings = bookingsWithPayments.length;
    let totalRevenue = 0;
    let totalPayout = 0;

    for (const b of bookingsWithPayments) {
      const bookingRevenue = b.payments.reduce((s, p) => s + p.amount, 0);
      totalRevenue += bookingRevenue;
      totalPayout += bookingRevenue * 0.8; // 80% payout estimate
    }

    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const avgCommission = totalBookings > 0 ? (totalRevenue - totalPayout) / totalBookings : 0;
    const avgPayout = totalBookings > 0 ? totalPayout / totalBookings : 0;
    const profitPerBooking = avgBookingValue - avgPayout;

    // LTV / CAC
    const activeMemberships = await prisma.clientMembership.findMany({
      where: { status: 'active' },
      include: { plan: true }
    });
    const mrr = activeMemberships.reduce((s, m) => s + m.plan.priceMonthly, 0);
    const activeCount = activeMemberships.length;
    const arpu = activeCount > 0 ? mrr / activeCount : avgBookingValue;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cancelledThisMonth = await prisma.clientMembership.count({
      where: { status: 'cancelled', updatedAt: { gte: monthStart } }
    });
    const activeAtStart = activeCount + cancelledThisMonth;
    const churnRate = activeAtStart > 0 ? cancelledThisMonth / activeAtStart : 0;

    const ltvEstimate = churnRate > 0 ? arpu * (1 / churnRate) : arpu * 12;
    const cacEstimate = 0; // Placeholder
    const ltvCacRatio = cacEstimate > 0 ? ltvEstimate / cacEstimate : 0;
    const paybackPeriodMonths = arpu > 0 && cacEstimate > 0 ? cacEstimate / arpu : 0;

    // By lead source
    const inquiries = await prisma.inquiry.findMany({
      where: { createdAt: { gte: periodStart } },
      select: { source: true, status: true }
    });

    const sourceMap: Record<string, { leads: number; bookings: number; revenue: number }> = {};
    for (const inq of inquiries) {
      if (!sourceMap[inq.source]) sourceMap[inq.source] = { leads: 0, bookings: 0, revenue: 0 };
      sourceMap[inq.source].leads++;
      if (inq.status === 'converted') sourceMap[inq.source].bookings++;
    }

    const bySource = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      leads: data.leads,
      bookings: data.bookings,
      revenue: data.bookings * avgBookingValue,
      cost: 0,
      roi: 0
    }));

    // By model — top 10 by profit
    const modelMap: Record<string, { modelId: string; modelName: string; bookings: number; revenue: number; payout: number }> = {};
    for (const b of bookingsWithPayments) {
      if (!b.model) continue;
      if (!modelMap[b.model.id]) {
        modelMap[b.model.id] = { modelId: b.model.id, modelName: b.model.name, bookings: 0, revenue: 0, payout: 0 };
      }
      const rev = b.payments.reduce((s, p) => s + p.amount, 0);
      modelMap[b.model.id].bookings++;
      modelMap[b.model.id].revenue += rev;
      modelMap[b.model.id].payout += rev * 0.8;
    }

    const byModel = Object.values(modelMap)
      .map(m => ({ ...m, profit: m.revenue - m.payout }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        profitPerBooking: Math.round(profitPerBooking * 100) / 100,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        avgCommission: Math.round(avgCommission * 100) / 100,
        avgPayout: Math.round(avgPayout * 100) / 100,
        ltvEstimate: Math.round(ltvEstimate * 100) / 100,
        cacEstimate,
        ltvCacRatio: Math.round(ltvCacRatio * 100) / 100,
        paybackPeriodMonths: Math.round(paybackPeriodMonths * 10) / 10,
        bySource,
        byModel
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'ANALYTICS_FAILED', message: error.message } }, { status: 500 });
  }
}
