import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { notifyReception } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, contact, date, time, duration, callType, companion, message } = body

    if (!name || !contact) {
      return NextResponse.json(
        { success: false, error: 'Required fields missing' },
        { status: 400 }
      )
    }

    // Save to DB as Inquiry
    await prisma.inquiry.create({
      data: {
        source: 'web',
        status: 'new',
        priority: 'normal',
        subject: companion ? `Enquiry for ${companion}` : 'Website Enquiry',
        message: [
          `Name: ${name}`,
          `Contact: ${contact}`,
          companion ? `Companion: ${companion}` : null,
          date ? `Date: ${date}` : null,
          time ? `Time: ${time}` : null,
          duration ? `Duration: ${duration}` : null,
          callType ? `Type: ${callType}` : null,
          message || null,
        ].filter(Boolean).join(' | '),
      },
    })

    const lines = [
      `🔔 *New Enquiry — Vaurel*`,
      ``,
      `👤 *Name:* ${name}`,
      `📱 *Contact:* ${contact}`,
      date      ? `📅 *Date:* ${date}` : null,
      time      ? `🕐 *Time:* ${time}` : null,
      duration  ? `⏱ *Duration:* ${duration}` : null,
      callType  ? `📍 *Location type:* ${callType}` : null,
      companion ? `💃 *Companion:* ${companion}` : null,
      message   ? `📝 *Message:* ${message}`   : null,
      ``,
      `⏰ _Received via vaurel.co.uk_`,
    ]
      .filter(Boolean)
      .join('\n')

    await notifyReception(lines)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[enquiry POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
