import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const now = new Date();
    let startDate: Date | undefined;
    let lastMonthStart: Date | undefined;
    let lastMonthEnd: Date | undefined;

    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    // This month / last month for growth
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const whereDate = startDate ? { createdAt: { gte: startDate } } : {};

    // Bookings
    const [bookings, modelsData, inquiries] = await Promise.all([
      prisma.booking.findMany({
        where: whereDate,
        include: { model: true },
      }),
      prisma.model.findMany({
        select: { id: true, name: true, status: true },
      }),
      prisma.inquiry.findMany({ where: whereDate }),
    ]);

    // Revenue calculations
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const thisMonthBookings = completedBookings.filter(b => b.createdAt >= thisMonthStart);
    const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const lastMonthBookings = completedBookings.filter(b => b.createdAt >= lastMonthStart! && b.createdAt <= lastMonthEnd!);
    const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const growth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // Top models
    const modelRevenue: Record<string, { name: string; bookings: number; revenue: number }> = {};
    completedBookings.forEach(b => {
      if (b.model) {
        if (!modelRevenue[b.modelId]) {
          modelRevenue[b.modelId] = { name: b.model.name, bookings: 0, revenue: 0 };
        }
        modelRevenue[b.modelId].bookings++;
        modelRevenue[b.modelId].revenue += b.totalAmount || 0;
      }
    });

    const topModels = Object.values(modelRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Inquiry conversion
    const convertedInquiries = inquiries.filter(i => i.status === 'converted');

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          growth,
        },
        bookings: {
          total: bookings.length,
          completed: completedBookings.length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          inProgress: bookings.filter(b => b.status === 'in_progress').length,
          conversionRate: bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0,
        },
        inquiries: {
          total: inquiries.length,
          converted: convertedInquiries.length,
          conversionRate: inquiries.length > 0 ? Math.round((convertedInquiries.length / inquiries.length) * 100) : 0,
        },
        models: {
          total: modelsData.length,
          active: modelsData.filter(m => m.status === 'active').length,
        },
        topModels,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
