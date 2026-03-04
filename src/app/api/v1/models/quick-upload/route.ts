// POST /api/v1/models/quick-upload
// Accepts multipart form data: images + documents (DOCX/TXT/PDF)
// TASK A: Parse document with regex (no AI) for structured data
// TASK B: Claude Vision arranges photos + generates bio
// Creates model + stats + rates + services + address + work prefs + media

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { uploadMedia, generateThumbnail, buildKey } from '@/lib/storage/r2'
import { ensureExtensionTables } from '@/lib/db/ensure-tables'
import { ensureServices } from '@/lib/db/ensure-services'
import { parseProfileDocument, type ParsedProfile } from '@/lib/parsing/parse-profile-document'
import { randomUUID } from 'crypto'

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function extractTextFromFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'docx' || ext === 'doc' || mimeType.includes('word') || mimeType.includes('openxmlformats')) {
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (ext === 'txt' || mimeType.includes('text/plain')) {
    return buffer.toString('utf-8')
  }

  if (ext === 'pdf' || mimeType.includes('pdf')) {
    try {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text || ''
    } catch (e) {
      console.error('[quick-upload] PDF parse failed:', e)
      return ''
    }
  }

  return ''
}

interface PhotoOrder {
  index: number
  role: string
  sortOrder: number
}

async function arrangePhotosWithAI(
  imageBuffers: { buffer: Buffer; mediaType: string }[]
): Promise<PhotoOrder[] | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || imageBuffers.length <= 1) return null

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    const blocks: any[] = []
    for (let i = 0; i < imageBuffers.length; i++) {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageBuffers[i].mediaType,
          data: imageBuffers[i].buffer.toString('base64'),
        },
      })
      blocks.push({ type: 'text', text: `Photo ${i} (index ${i})` })
    }
    blocks.push({
      type: 'text',
      text: `You are a professional photo editor for a high-end London escort agency. Arrange these profile photos to maximize client appeal and conversion. Photo 1 (cover) must be the most striking, well-lit image showing face and figure — this is the thumbnail clients see first. Remaining photos should flow naturally: face closeups, full body, lifestyle/setting shots. Return ONLY a JSON array: [{"index": 0, "role": "cover", "sortOrder": 1}, {"index": 3, "role": "gallery", "sortOrder": 2}, ...] where index is the original upload position (0-based) and sortOrder is the display position (1-based). Return ONLY valid JSON, nothing else.`,
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: blocks }],
    })

    const responseText = (message.content[0] as any)?.text || ''
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const order: PhotoOrder[] = JSON.parse(jsonMatch[0])
    return order
  } catch (e) {
    console.error('[quick-upload] Photo arrangement AI failed (non-fatal):', e)
    return null
  }
}

async function generateBioFromPhotos(
  imageBuffers: { buffer: Buffer; mediaType: string }[]
): Promise<string | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return null

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    const blocks: any[] = []
    for (let i = 0; i < Math.min(imageBuffers.length, 3); i++) {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageBuffers[i].mediaType,
          data: imageBuffers[i].buffer.toString('base64'),
        },
      })
    }
    blocks.push({
      type: 'text',
      text: `Write a brief, elegant 2-3 sentence description of this person's appearance for a companion profile. Mention hair colour, eye colour, body type, and overall impression. Be tasteful and professional. Return ONLY the description text, nothing else.`,
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: blocks }],
    })

    return (message.content[0] as any)?.text?.trim() || null
  } catch (e) {
    console.error('[quick-upload] Bio generation failed (non-fatal):', e)
    return null
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    await ensureExtensionTables()
    await ensureServices()

    const formData = await request.formData()
    const allFiles = formData.getAll('files') as File[]

    if (!allFiles || allFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 })
    }

    // Separate images from documents
    const imageFiles: File[] = []
    const docFiles: File[] = []

    for (const file of allFiles) {
      const ext = file.name.toLowerCase().split('.').pop() || ''
      if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        imageFiles.push(file)
      } else if (['docx', 'doc', 'txt', 'pdf'].includes(ext) || file.type.includes('word') || file.type.includes('text') || file.type.includes('pdf')) {
        docFiles.push(file)
      }
    }

    if (imageFiles.length > 10) {
      return NextResponse.json({ success: false, error: 'Maximum 10 photos allowed' }, { status: 400 })
    }

    // ── TASK A: Parse document ──
    let documentText = ''
    for (const doc of docFiles) {
      const buffer = Buffer.from(await doc.arrayBuffer())
      const text = await extractTextFromFile(buffer, doc.name, doc.type)
      documentText += text + '\n'
    }

    const parsed = parseProfileDocument(documentText)

    // ── Read image buffers ──
    const imageBuffers: { buffer: Buffer; mediaType: string; name: string }[] = []
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer())
      imageBuffers.push({ buffer, mediaType: file.type || 'image/jpeg', name: file.name })
    }

    // ── TASK B: AI photo arrangement + bio (parallel, non-blocking) ──
    const [photoOrder, bioText] = await Promise.all([
      imageBuffers.length > 1 ? arrangePhotosWithAI(imageBuffers) : null,
      imageBuffers.length > 0 ? generateBioFromPhotos(imageBuffers) : null,
    ])

    // Build photo sort order
    const sortMap = new Map<number, { sortOrder: number; role: string }>()
    if (photoOrder) {
      for (const p of photoOrder) {
        sortMap.set(p.index, { sortOrder: p.sortOrder, role: p.role })
      }
    }

    // ── Create model ──
    const name = parsed.name || 'New Model'
    let slug = slugify(name)
    if (!slug) slug = 'model'
    const existing = await prisma.model.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const publicCode = `${name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 12)}-${randomUUID().substring(0, 8).toUpperCase()}`

    const model = await prisma.model.create({
      data: {
        name,
        slug,
        publicCode,
        status: 'draft',
        visibility: 'public',
        notesInternal: bioText || null,
        stats: {
          create: {
            age: parsed.age,
            height: parsed.heightCm,
            weight: parsed.weightKg,
            bustSize: parsed.bustSize || null,
            dressSize: parsed.dressSize || null,
            eyeColour: parsed.eyeColour || null,
            hairColour: parsed.hairColour || null,
            nationality: parsed.nationality || null,
            orientation: parsed.orientation || null,
            languages: parsed.languages,
          },
        },
      },
    })

    // ── Link services ──
    let linkedServices = 0
    if (parsed.services.length > 0) {
      const slugs = parsed.services.filter(s => s.enabled).map(s => s.slug)
      const dbServices = await prisma.service.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
      })
      const slugToId = new Map(dbServices.map(s => [s.slug, s.id]))

      for (const svc of parsed.services.filter(s => s.enabled)) {
        const serviceId = slugToId.get(svc.slug)
        if (!serviceId) continue
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO model_services ("modelId", "serviceId", "isEnabled")
             VALUES ($1, $2, true)
             ON CONFLICT ("modelId", "serviceId") DO NOTHING`,
            model.id, serviceId,
          )
          linkedServices++
        } catch {}
      }
    }

    // ── Insert rates ──
    let insertedRates = 0
    for (const rate of parsed.rates) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_rates (id, model_id, duration_type, call_type, price, currency, is_active)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'GBP', true)`,
          model.id, rate.duration, rate.callType, rate.price,
        )
        insertedRates++
      } catch (e) {
        console.error('[quick-upload] Rate insert failed:', e)
      }
    }

    // ── Insert address ──
    if (parsed.address.street || parsed.address.postcode) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_addresses (id, model_id, street, flat_number, flat_floor, post_code, tube_station, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
           ON CONFLICT (model_id) DO UPDATE SET
             street = EXCLUDED.street, flat_number = EXCLUDED.flat_number,
             flat_floor = EXCLUDED.flat_floor, post_code = EXCLUDED.post_code,
             tube_station = EXCLUDED.tube_station`,
          `${model.id}-addr`, model.id,
          parsed.address.street, parsed.address.flat,
          parsed.address.floor ? parseInt(parsed.address.floor) : null,
          parsed.address.postcode, parsed.address.tubeStation,
        )
      } catch (e) {
        console.error('[quick-upload] Address insert failed:', e)
      }
    }

    // ── Insert work preferences ──
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO model_work_preferences (id, model_id, work_with_couples, work_with_women)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (model_id) DO UPDATE SET
           work_with_couples = EXCLUDED.work_with_couples,
           work_with_women = EXCLUDED.work_with_women`,
        `${model.id}-prefs`, model.id,
        parsed.worksWithCouples, parsed.servesWomen,
      )
    } catch (e) {
      console.error('[quick-upload] Work prefs insert failed:', e)
    }

    // ── Upload images to R2 ──
    let uploadedPhotos = 0
    for (let i = 0; i < imageBuffers.length; i++) {
      const { buffer, mediaType, name: fileName } = imageBuffers[i]
      const key = buildKey(model.id, `${i}-${Date.now()}.${fileName.split('.').pop() || 'jpg'}`)

      // Use AI sort order if available, otherwise original order
      const orderInfo = sortMap.get(i)
      const sortOrder = orderInfo ? orderInfo.sortOrder - 1 : i
      const isCover = orderInfo ? orderInfo.role === 'cover' : i === 0

      try {
        const result = await uploadMedia(buffer, key, mediaType)
        const thumb = await generateThumbnail(buffer, result.key)

        await prisma.modelMedia.create({
          data: {
            modelId: model.id,
            type: 'photo',
            storageKey: result.key,
            url: result.url,
            isPrimary: isCover,
            isPublic: true,
            sortOrder,
          },
        })
        uploadedPhotos++
      } catch (e) {
        console.error(`[quick-upload] Failed to upload photo ${i}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      modelId: model.id,
      slug: model.slug,
      summary: {
        name,
        age: parsed.age,
        nationality: parsed.nationality,
        services: linkedServices,
        rates: insertedRates,
        photos: uploadedPhotos,
        hasBio: !!bioText,
        hasAddress: !!(parsed.address.street || parsed.address.postcode),
        photosArrangedByAI: !!photoOrder,
      },
      parsed,
    })
  } catch (error: any) {
    console.error('[quick-upload] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Quick upload failed',
    }, { status: 500 })
  }
}
