import { NextRequest, NextResponse } from 'next/server'
import { notifyReception } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, contact, date, duration, location, companion, message } = body

    if (!name || !contact || !date || !duration || !location) {
      return NextResponse.json(
        { success: false, error: 'Required fields missing' },
        { status: 400 }
      )
    }

    const lines = [
      `🔔 *New Enquiry — Vaurel*`,
      ``,
      `👤 *Name:* ${name}`,
      `📱 *Contact:* ${contact}`,
      `📅 *Date:* ${date}`,
      `⏱ *Duration:* ${duration}`,
      `📍 *Location:* ${location}`,
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
