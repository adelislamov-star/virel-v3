// POST /api/v1/models/quick-upload
// Accepts multipart form data with images, uses Claude vision to extract profile data,
// creates model + stats + rates + services + media records

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/client'
import { uploadMedia, generateThumbnail, buildKey } from '@/lib/storage/r2'
import { ensureExtensionTables } from '@/lib/db/ensure-tables'
import { ensureServices } from '@/lib/db/ensure-services'
import { randomUUID } from 'crypto'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const EXTRACTION_PROMPT = `You are a data extraction assistant for a London escort agency. Analyze these profile images and extract ALL visible information. Return ONLY valid JSON:
{
  "name": "string",
  "age": number or null,
  "height_cm": number or null,
  "weight_kg": number or null,
  "nationality": "string or null",
  "languages": ["English"],
  "hair_colour": "string or null",
  "eye_colour": "string or null",
  "bust_size": "string or null",
  "dress_size": "string or null",
  "orientation": "string or null",
  "bio_text": "string or null",
  "services": ["GFE", "OWO"],
  "rates": {
    "30min": {"incall": null, "outcall": null},
    "45min": {"incall": null, "outcall": null},
    "1hour": {"incall": null, "outcall": null},
    "90min": {"incall": null, "outcall": null},
    "2hours": {"incall": null, "outcall": null},
    "overnight": {"incall": null, "outcall": null}
  },
  "location": "string or null",
  "phone": "string or null",
  "email": "string or null"
}
Rates in GBP as numbers only. Use null for anything not visible.`

export const runtime = 'nodejs'
// Allow up to 60s for AI processing + uploads
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    await ensureExtensionTables()
    await ensureServices()

    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No photos provided' }, { status: 400 })
    }
    if (files.length > 5) {
      return NextResponse.json({ success: false, error: 'Maximum 5 photos allowed' }, { status: 400 })
    }

    // 1. Read files and build vision blocks for Claude
    const imageBuffers: { buffer: Buffer; mediaType: string; name: string }[] = []
    const blocks: any[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const buffer = Buffer.from(await file.arrayBuffer())
      const mediaType = file.type || 'image/jpeg'
      imageBuffers.push({ buffer, mediaType, name: file.name })

      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buffer.toString('base64'),
        },
      })
      blocks.push({ type: 'text', text: `Photo ${i + 1}` })
    }

    blocks.push({ type: 'text', text: EXTRACTION_PROMPT })

    // 2. Call Claude vision
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: blocks }],
    })

    const rawText = (message.content[0] as any).text
      .replace(/```json|```/g, '')
      .trim()

    let extracted: any
    try {
      extracted = JSON.parse(rawText)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AI could not parse the images into structured data',
        raw: rawText,
      }, { status: 422 })
    }

    // 3. Create model in database
    const name = extracted.name || 'New Model'
    let slug = slugify(name)
    const existing = await prisma.model.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const publicCode = `${name.toUpperCase().replace(/\s+/g, '-').substring(0, 12)}-${randomUUID().substring(0, 8).toUpperCase()}`

    // Resolve location
    let primaryLocationId: string | null = null
    if (extracted.location) {
      const locSlug = slugify(extracted.location)
      let loc = await prisma.location.findFirst({ where: { slug: locSlug } })
      if (!loc) {
        loc = await prisma.location.create({
          data: { title: extracted.location, slug: locSlug, status: 'active' },
        })
      }
      primaryLocationId = loc.id
    }

    const model = await prisma.model.create({
      data: {
        name,
        slug,
        publicCode,
        status: 'active',
        visibility: 'public',
        notesInternal: extracted.bio_text || null,
        primaryLocationId,
        stats: {
          create: {
            age: extracted.age ? Number(extracted.age) : null,
            height: extracted.height_cm ? Number(extracted.height_cm) : null,
            weight: extracted.weight_kg ? Number(extracted.weight_kg) : null,
            bustSize: extracted.bust_size || null,
            dressSize: extracted.dress_size || null,
            eyeColour: extracted.eye_colour || null,
            hairColour: extracted.hair_colour || null,
            nationality: extracted.nationality || null,
            orientation: extracted.orientation || null,
            languages: Array.isArray(extracted.languages) ? extracted.languages : [],
          },
        },
      },
    })

    // 4. Match and link services
    if (extracted.services && extracted.services.length > 0) {
      const slugs = extracted.services.map((s: string) => s.toLowerCase().replace(/_/g, '-'))
      const dbServices = await prisma.$queryRaw<{ id: string; slug: string }[]>`
        SELECT id, slug FROM services WHERE slug = ANY(${slugs}::text[])
      `
      for (const svc of dbServices) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO model_services ("modelId", "serviceId", "isEnabled")
             VALUES ($1, $2, true)
             ON CONFLICT ("modelId", "serviceId") DO NOTHING`,
            model.id, svc.id,
          )
        } catch {}
      }
    }

    // 5. Insert rates
    if (extracted.rates) {
      const rateEntries: { duration_type: string; call_type: string; price: number }[] = []
      for (const [duration, types] of Object.entries(extracted.rates as Record<string, any>)) {
        if (types?.incall) rateEntries.push({ duration_type: duration, call_type: 'incall', price: Number(types.incall) })
        if (types?.outcall) rateEntries.push({ duration_type: duration, call_type: 'outcall', price: Number(types.outcall) })
      }
      for (const rate of rateEntries) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO model_rates (id, model_id, duration_type, call_type, price, currency, is_active)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, 'GBP', true)`,
            model.id, rate.duration_type, rate.call_type, rate.price,
          )
        } catch {}
      }
    }

    // 6. Upload images to R2 and create media records
    for (let i = 0; i < imageBuffers.length; i++) {
      const { buffer, mediaType, name: fileName } = imageBuffers[i]
      const key = buildKey(model.id, `${i}-${Date.now()}.${fileName.split('.').pop() || 'jpg'}`)

      try {
        const result = await uploadMedia(buffer, key, mediaType)
        const thumb = await generateThumbnail(buffer, result.key)

        await prisma.modelMedia.create({
          data: {
            modelId: model.id,
            type: 'photo',
            storageKey: result.key,
            url: result.url,
            thumbUrl: thumb.url,
            isPrimary: i === 0,
            isPublic: true,
            sortOrder: i,
          },
        })
      } catch (e) {
        console.error(`[quick-upload] Failed to upload photo ${i}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      modelId: model.id,
      slug: model.slug,
      extracted,
    })
  } catch (error: any) {
    console.error('[quick-upload] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Quick upload failed',
    }, { status: 500 })
  }
}
