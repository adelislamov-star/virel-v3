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

    // Telegram notification
    try {
      const botToken = process.env.KESHA_ZEROGAP_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID_TOMMY
      if (botToken && chatId) {
        const modelInfo = await prisma.model.findUnique({ where: { id: modelId }, select: { name: true } })
        const durationLabel: Record<string, string> = {
          '30min':'30 min','45min':'45 min','1hour':'1 hour',
          '90min':'90 min','2hours':'2 hours','extra_hour':'Extra hour','overnight':'Overnight'
        }
        const lines = [
          '\uD83D\uDCF2 *New Booking Request*',
          '',
          `\uD83D\uDC64 *Client:* ${clientName || 'Unknown'}`,
          `\uD83D\uDCDE *Phone:* ${clientPhone}`,
          clientEmail ? `\uD83D\uDCE7 *Email:* ${clientEmail}` : null,
          '',
          `\uD83D\uDC8E *Companion:* ${modelInfo?.name || modelId}`,
          serviceType ? `\uD83C\uDFF7 *Type:* ${serviceType}` : null,
          duration ? `\u23F1 *Duration:* ${durationLabel[duration] || duration}` : null,
          requestedDate ? `\uD83D\uDCC5 *Date:* ${requestedDate}${requestedTime ? ' at ' + requestedTime : ''}` : null,
          notes ? `\uD83D\uDCDD *Notes:* ${notes}` : null,
          '',
          `\u26A1 Inquiry #${inquiry.id.slice(-6).toUpperCase()}`,
        ].filter(Boolean).join('\n')

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: lines,
            parse_mode: 'Markdown',
          }),
        })
      }
    } catch (tgErr) {
      console.error('Telegram notification failed:', tgErr)
    }

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
