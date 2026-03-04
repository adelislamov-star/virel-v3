// OWNER ANALYTICS — GET all 21 metrics
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
      default: // month
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Revenue metrics
    const payments = await prisma.payment.findMany({
      where: { status: 'succeeded', createdAt: { gte: periodStart } },
      select: { amount: true }
    });
    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

    const payouts = await prisma.payment.findMany({
      where: { status: 'succeeded', createdAt: { gte: periodStart } },
      select: { amount: true }
    });
    // Estimate commission at 20% and payout at 80%
    const totalCommission = totalRevenue * 0.20;
    const totalPayout = totalRevenue * 0.80;
    const netMargin = totalRevenue > 0 ? ((totalRevenue - totalPayout) / totalRevenue) * 100 : 0;

    // Lead conversion
    const allInquiries = await prisma.inquiry.count({ where: { createdAt: { gte: periodStart } } });
    const convertedInquiries = await prisma.inquiry.count({
      where: { createdAt: { gte: periodStart }, status: 'converted' }
    });
    const conversionRate = allInquiries > 0 ? (convertedInquiries / allInquiries) * 100 : 0;

    // Avg response time (placeholder — needs firstResponseAt field)
    const avgResponseTime = 0;

    // SLA breach rate
    const totalSLA = await prisma.sLARecord.count({ where: { startedAt: { gte: periodStart } } });
    const breachedSLA = await prisma.sLARecord.count({ where: { startedAt: { gte: periodStart }, breached: true } });
    const slaBreachRate = totalSLA > 0 ? (breachedSLA / totalSLA) * 100 : 0;

    // Cancellation rate
    const allBookings = await prisma.booking.count({ where: { createdAt: { gte: periodStart } } });
    const cancelledBookings = await prisma.booking.count({
      where: { createdAt: { gte: periodStart }, status: 'cancelled' }
    });
    const cancellationRate = allBookings > 0 ? (cancelledBookings / allBookings) * 100 : 0;

    // Chargeback rate
    const succeededPayments = await prisma.payment.count({
      where: { createdAt: { gte: periodStart }, status: 'succeeded' }
    });
    const disputedPayments = await prisma.payment.count({
      where: { createdAt: { gte: periodStart }, status: 'disputed' }
    });
    const chargebackRate = succeededPayments > 0 ? (disputedPayments / succeededPayments) * 100 : 0;

    // Fraud cases
    const fraudCases = await prisma.fraudSignal.count({ where: { createdAt: { gte: periodStart } } });

    // Avg model rating
    const ratingAgg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { status: 'approved' }
    });
    const avgModelRating = ratingAgg._avg.rating || 0;

    // Risk distribution
    const greenModels = await prisma.model.count({ where: { status: 'published', modelRiskIndex: 'green' } });
    const yellowModels = await prisma.model.count({ where: { status: 'published', modelRiskIndex: 'yellow' } });
    const redModels = await prisma.model.count({ where: { status: 'published', modelRiskIndex: 'red' } });

    // Lead source ROI (placeholder)
    const sourceROI: Record<string, number> = {};

    // Booking velocity (per day)
    const daysDiff = Math.max(1, (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const bookingVelocity = allBookings / daysDiff;

    // Avg onboarding time (placeholder)
    const avgOnboardingTime = 0;

    // API error rate (placeholder)
    const apiErrorRate = 0;

    // Membership metrics
    const activeMemberships = await prisma.clientMembership.findMany({
      where: { status: 'active' },
      include: { plan: true }
    });
    const mrr = activeMemberships.reduce((s, m) => s + m.plan.priceMonthly, 0);
    const activeSubCount = activeMemberships.length;
    const arpu = activeSubCount > 0 ? mrr / activeSubCount : 0;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cancelledThisMonth = await prisma.clientMembership.count({
      where: { status: 'cancelled', updatedAt: { gte: monthStart } }
    });
    const activeAtStart = activeSubCount + cancelledThisMonth;
    const churnRate = activeAtStart > 0 ? (cancelledThisMonth / activeAtStart) * 100 : 0;

    const ltvCacRatio = 0; // Placeholder — needs CAC input

    // Data quality — avg completeness
    const completenessAgg = await prisma.model.aggregate({
      _avg: { dataCompletenessScore: true },
      where: { status: 'published' }
    });
    const avgCompletenessScore = completenessAgg._avg.dataCompletenessScore || 0;

    return NextResponse.json({
      data: {
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          netMargin: Math.round(netMargin * 100) / 100,
          commission: Math.round(totalCommission * 100) / 100,
          payout: Math.round(totalPayout * 100) / 100
        },
        leads: {
          conversionRate: Math.round(conversionRate * 100) / 100,
          avgResponseTime,
          sourceROI
        },
        operations: {
          slaBreachRate: Math.round(slaBreachRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          bookingVelocity: Math.round(bookingVelocity * 100) / 100,
          avgOnboardingTime
        },
        risk: {
          chargebackRate: Math.round(chargebackRate * 100) / 100,
          fraudCases,
          avgModelRating: Math.round(avgModelRating * 10) / 10,
          riskDistribution: { green: greenModels, yellow: yellowModels, red: redModels }
        },
        system: {
          apiErrorRate
        },
        membership: {
          mrr: Math.round(mrr * 100) / 100,
          churnRate: Math.round(churnRate * 100) / 100,
          arpu: Math.round(arpu * 100) / 100,
          ltvCacRatio
        },
        dataQuality: {
          avgCompletenessScore: Math.round(avgCompletenessScore)
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'ANALYTICS_FAILED', message: error.message } }, { status: 500 });
  }
}
