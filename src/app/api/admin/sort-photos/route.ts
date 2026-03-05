// POST /api/admin/sort-photos
// Accepts base64 images, asks Claude to sort and label them, returns order

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { photos } = await req.json()
    // photos: [{ index: number, data: string (base64), mediaType: string }]

    if (!photos || photos.length === 0) {
      return NextResponse.json({ success: false, error: 'No photos provided' }, { status: 400 })
    }

    const blocks: any[] = []
    for (let i = 0; i < photos.length; i++) {
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: photos[i].mediaType || 'image/jpeg', data: photos[i].data }
      })
      blocks.push({ type: 'text', text: `Photo ${i}` })
    }
    blocks.push({
      type: 'text',
      text: `Sort ${photos.length} escort profile photos. Return JSON array ONLY:\n[{"index":0,"role":"cover"},{"index":1,"role":"full_body"},...]\nRoles: cover (best shot, goes first), full_body, face, detail, other. Include all ${photos.length} photos.`
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: blocks }]
    })

    const rawText = (message.content[0] as any)?.text || ''
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[sort-photos] Could not extract JSON array from AI response:', cleaned.substring(0, 200))
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 })
    }

    const order: { index: number; role: string }[] = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, order })
  } catch (e: any) {
    console.error('sort-photos error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
