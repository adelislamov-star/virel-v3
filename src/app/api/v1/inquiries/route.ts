import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, modelId, message, requestedDate, requestedTime, duration, serviceType, notes } = body;

    if (!clientPhone || !modelId) {
      return NextResponse.json({ error: 'Phone and model are required' }, { status: 400 });
    }

    // Upsert client
    let client = await prisma.client.findFirst({ where: { phone: clientPhone } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          fullName: clientName || null,
          phone: clientPhone,
          email: clientEmail || null,
          preferredChannel: 'web',
        },
      });
    }

    // Build message
    const inquiryMessage = [
      message,
      requestedDate && `Date: ${requestedDate} ${requestedTime || ''}`,
      duration && `Duration: ${duration}`,
      serviceType && `Type: ${serviceType}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean).join('\n');

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        source: 'web',
        clientId: client.id,
        status: 'new',
        priority: 'normal',
        subject: `Booking request for model`,
        message: inquiryMessage,
        requestedServices: serviceType ? { type: serviceType } : undefined,
        requestedTimeFrom: requestedDate && requestedTime
          ? new Date(`${requestedDate}T${requestedTime}:00`)
          : undefined,
      },
      include: { client: true },
    });

    // Link model to inquiry
    await prisma.inquiryMatch.create({
      data: {
        inquiryId: inquiry.id,
        modelId,
        status: 'proposed',
      },
    });

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = 20;

    const where: any = {};
    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          client: true,
          matches: { include: { model: true } },
          assignedUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({ success: true, inquiries, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
