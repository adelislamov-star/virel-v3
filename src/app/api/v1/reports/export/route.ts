// REPORT EXPORT — POST generate CSV download
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, from, to, format } = body;

    if (!reportType) {
      return NextResponse.json({ error: { code: 'VALIDATION', message: 'reportType required' } }, { status: 400 });
    }

    const dateWhere: any = {};
    if (from) dateWhere.gte = new Date(from);
    if (to) dateWhere.lte = new Date(to);
    const hasDateFilter = from || to;

    let csvContent = '';

    switch (reportType) {
      case 'revenue': {
        const payments = await prisma.payment.findMany({
          where: {
            status: 'succeeded',
            ...(hasDateFilter && { createdAt: dateWhere })
          },
          include: {
            booking: { select: { shortId: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        csvContent = 'ID,Booking,Amount,Currency,Status,Created\n';
        for (const p of payments) {
          csvContent += `${p.id},${p.booking?.shortId || ''},${p.amount},${p.currency},${p.status},${p.createdAt.toISOString()}\n`;
        }
        break;
      }

      case 'bookings': {
        const bookings = await prisma.booking.findMany({
          where: hasDateFilter ? { createdAt: dateWhere } : {},
          include: {
            model: { select: { name: true } },
            client: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        csvContent = 'ShortID,Client,Model,Status,Total,Start,End,Created\n';
        for (const b of bookings) {
          csvContent += `${b.shortId || b.id},${(b.client?.fullName || '').replace(/,/g, '')},${(b.model?.name || '').replace(/,/g, '')},${b.status},${b.priceTotal},${b.startAt?.toISOString() || ''},${b.endAt?.toISOString() || ''},${b.createdAt.toISOString()}\n`;
        }
        break;
      }

      case 'models': {
        const models = await prisma.model.findMany({
          include: {
            _count: { select: { bookings: true, reviews: true } }
          },
          orderBy: { name: 'asc' }
        });

        csvContent = 'ID,Name,Status,Completeness,RiskIndex,Bookings,Reviews\n';
        for (const m of models) {
          csvContent += `${m.id},${m.name.replace(/,/g, '')},${m.status},${m.dataCompletenessScore || 0},${m.modelRiskIndex || 'unknown'},${m._count.bookings},${m._count.reviews}\n`;
        }
        break;
      }

      case 'lost_revenue': {
        const entries = await prisma.lostRevenueEntry.findMany({
          where: hasDateFilter ? { createdAt: dateWhere } : {},
          orderBy: { createdAt: 'desc' }
        });

        csvContent = 'ID,Type,Amount,RootCause,ResponsibleRole,Status,Created\n';
        for (const e of entries) {
          csvContent += `${e.id},${e.type},${e.amount},${(e.rootCause || '').replace(/,/g, '')},${e.responsibleRole || ''},${e.status},${e.createdAt.toISOString()}\n`;
        }
        break;
      }

      default:
        return NextResponse.json({ error: { code: 'INVALID_TYPE', message: 'Invalid report type' } }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'EXPORT_FAILED', message: error.message } }, { status: 500 });
  }
}
