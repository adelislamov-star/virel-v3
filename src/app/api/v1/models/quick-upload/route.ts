// POST /api/v1/models/quick-upload
// AI-powered Quick Upload with self-learning system
// Call 1: AI parses document text → structured profile JSON
// Call 2: AI arranges photos (cover, gallery order)
// Fallback: regex parser if AI fails
// Learning: stores successful parses as few-shot examples

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/client'
import { uploadMedia, generateThumbnail, buildKey } from '@/lib/storage/r2'
import { ensureExtensionTables } from '@/lib/db/ensure-tables'
import { ensureServices } from '@/lib/db/ensure-services'
import { parseProfileDocument } from '@/lib/parsing/parse-profile-document'
import { randomUUID, createHash } from 'crypto'
import { requireRole, isActor } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { normalizePhone, normalizeHeight, normalizeWeight, normalizeAge, normalizePrice } from '@/lib/normalize-anketa'

export const runtime = 'nodejs'
export const maxDuration = 120

// ─── Helpers ───

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/&/g, 'and')
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

// ─── AI Document Parse Types ───

interface AIParsedProfile {
  name: string | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  nationality: string | null
  ethnicity: string | null
  languages: string[]
  hair_colour: string | null
  hair_length: string | null
  eye_colour: string | null
  bust_size: string | null
  bust_type: string | null
  dress_size: string | null
  shoe_size: string | null
  measurements: string | null
  orientation: string | null
  smokes: boolean | null
  tattoo: string | null
  piercings: string | null
  works_with_couples: boolean | null
  serves_women: boolean | null
  dinner_dates: boolean | null
  travel_companion: boolean | null
  bio_text: string | null
  bio: string | null
  notesInternal: string | null
  tagline: string | null
  education: string | null
  travel: string | null
  availability: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  whatsapp: boolean | null
  telegram: boolean | null
  viber: boolean | null
  signal: boolean | null
  address: string | null
  postcode: string | null
  tube_station: string | null
  wardrobe: string[] | null
  rates: Record<string, { incall: number | null; outcall: number | null }> | null
  services: Array<{ name: string; enabled: boolean; extra_price: number | null }> | null
  payment_methods: string[] | null
}

// ─── Few-Shot Learning ───

async function fetchFewShotExamples(): Promise<Array<{ input: string; output: string }>> {
  try {
    const examples = await prisma.aIParseExample.findMany({
      where: { inputType: 'document' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        inputText: true,
        outputJson: true,
        wasEdited: true,
        editedJson: true,
      },
    })

    return examples
      .filter(e => e.inputText)
      .map(e => ({
        input: e.inputText!.substring(0, 2000), // Truncate for context window
        output: JSON.stringify(e.wasEdited && e.editedJson ? e.editedJson : e.outputJson),
      }))
  } catch (e) {
    console.error('[quick-upload] Failed to fetch few-shot examples:', e)
    return []
  }
}

// ─── Call 1: AI Document Parsing ───

const SYSTEM_PROMPT = `You are a data extraction AI for a London escort agency. You receive profile documents in various formats — structured forms, WhatsApp messages, copy-pasted text from websites, emails from agents. Extract ALL profile information and return ONLY valid JSON, no markdown, no explanation.

Return this exact JSON structure:
{
  "name": "string - working name or first name",
  "age": number|null,
  "height_cm": number|null,
  "weight_kg": number|null,
  "nationality": "string - e.g. Russian, British, Brazilian, etc."|null,
  "ethnicity": "White European|Latin|Asian|Chinese|Indian|Black|Arabic|Mixed|Other"|null,
  "languages": ["English (Fluent)", "Russian (Native)"],
  "hair_colour": "Blonde|Brunette|Light Brown|Redhead|Black|Other"|null,
  "hair_length": "Long|Medium|Short"|null,
  "eye_colour": "Blue|Green|Brown|Hazel|Grey|Dark Brown|Black"|null,
  "bust_size": "string - e.g. 34C, 32B"|null,
  "bust_type": "Natural|Enhanced"|null,
  "dress_size": "string - e.g. UK 10, EU 38"|null,
  "shoe_size": "string - e.g. UK 5, EU 38"|null,
  "measurements": "string - e.g. 32D-25-33"|null,
  "orientation": "Heterosexual|Bisexual"|null,
  "smokes": boolean|null,
  "tattoo": "None|Small|Medium|Large"|null,
  "piercings": "string - e.g. Belly, Nipples or None"|null,
  "works_with_couples": boolean|null,
  "serves_women": boolean|null,
  "dinner_dates": boolean|null,
  "travel_companion": boolean|null,
  "bio_text": "string - write a short attractive 2-3 sentence bio for the website based on all available info"|null,
  "tagline": "string - short 3-5 word catchy description, e.g. Slender Russian Blonde"|null,
  "education": "string - e.g. Graduate, Student, Professional"|null,
  "travel": "London only|UK & Europe|Worldwide"|null,
  "availability": "Available Now|Advanced Notice|Away|On Holiday"|null,
  "phone": "string - phone number with country code"|null,
  "phone2": "string - second phone number"|null,
  "email": "string - email address"|null,
  "whatsapp": boolean,
  "telegram": boolean,
  "viber": boolean,
  "signal": boolean,
  "payment_methods": ["cash", "revolut", "bank transfer", "terminal", "monzo", "starling", "bitcoin", "usdt"],
  "address": "string"|null,
  "postcode": "string - UK postcode"|null,
  "tube_station": "string - nearest tube/train station name"|null,
  "wardrobe": ["Schoolgirl", "Nurse", "Latex"],
  "rates": {
    "30min": {"incall": number|null, "outcall": number|null},
    "45min": {"incall": number|null, "outcall": number|null},
    "1hour": {"incall": number|null, "outcall": number|null},
    "90min": {"incall": number|null, "outcall": number|null},
    "2hours": {"incall": number|null, "outcall": number|null},
    "3hours": {"incall": number|null, "outcall": number|null},
    "extra_hour": {"incall": number|null, "outcall": number|null},
    "overnight": {"incall": number|null, "outcall": number|null}
  },
  "services": [{"name": "string - short code like GFE/OWO/DFK/Massage", "enabled": true, "extra_price": number|null}]
}

Height conversion: 1.70m=170, 1,70=170, 5ft7=170, 5'7"=170.
Rates in GBP numbers only, no symbols. If only one rate given for a duration without specifying incall/outcall, assume it is incall. Outcall is usually £50 more + taxi.
Use null for anything not found in the document. Use false for boolean fields if not mentioned.
For services, use standard names: GFE, OWO, OWC, DFK, FK, 69, CIM, CIF, COB, Swallow, Snowballing, DT, Fingering, A-Level, DP, PSE, Party Girl, Face Sitting, Dirty Talk, Lady Services, WS Giving, WS Receiving, Rimming Giving, Rimming Receiving, Smoking Fetish, Roleplay, Filming Mask, Filming No Mask, Foot Fetish, Open Minded, Light Dom, Spanking Giving, Spanking Receiving, Duo, Bi Duo, Couples, MMF, Group, Massage, Prostate Massage, Professional Massage, B2B, Erotic Massage, Lomi Lomi, Nuru, Sensual Massage, Tantric, Striptease, Lapdancing, Belly Dance, Uniforms, Toys, Strap On, Poppers, Handcuffs, Domination, Fisting, Tie & Tease, Dinner Date.
payment_methods: list payment methods accepted. Use lowercase values: cash, revolut, bank transfer, terminal, card, monzo, starling, monese, bitcoin, btc, usdt, ltc. Empty array if not mentioned.
Only include services mentioned in the document. "enabled" = true if answer is Yes, false if No.
For each service, check if there is an additional/extra price mentioned next to it (e.g. "A-level +£200", "GFE - extra £150", "Anal £200 extra"). Return extra_price as the numeric value in GBP, or null if no extra price is mentioned.
For wardrobe, only include items explicitly mentioned (e.g. Schoolgirl, Nurse, Latex, Lingerie, Stockings, etc.). Return empty array if none mentioned.
Return ONLY valid JSON.`

async function parseDocumentWithAI(documentText: string): Promise<AIParsedProfile | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || !documentText.trim()) {
      console.log('[quick-upload] AI parse skipped: no API key or empty text')
      return null
    }

    console.log('[quick-upload] Call 1: Starting AI document parse...')
    const client = new Anthropic({ apiKey })

    const fewShotExamples = await fetchFewShotExamples()
    console.log(`[quick-upload] Call 1: Using ${fewShotExamples.length} few-shot examples`)

    // Build messages with few-shot examples
    const messages: Anthropic.MessageParam[] = []
    for (const example of fewShotExamples) {
      messages.push({ role: 'user', content: `Parse this profile document:\n\n${example.input}` })
      messages.push({ role: 'assistant', content: example.output })
    }
    messages.push({ role: 'user', content: `Parse this profile document:\n\n${documentText}` })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages,
    })

    const raw = (response.content[0] as any)?.text || ''
    console.log('[quick-upload] Call 1: AI response length:', raw.length)

    // Extract JSON - try multiple strategies
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[quick-upload] Call 1: Could not extract JSON from AI response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIParsedProfile
    console.log('[quick-upload] Call 1: AI parsed successfully:', {
      name: parsed.name,
      age: parsed.age,
      services: parsed.services?.length || 0,
      rateKeys: parsed.rates ? Object.keys(parsed.rates).length : 0,
    })
    return parsed
  } catch (e) {
    console.error('[quick-upload] Call 1: AI document parse failed:', e)
    return null
  }
}

// ─── Call 2: AI Photo Arrangement ───

interface PhotoOrder {
  index: number
  role: string
  sortOrder: number
  quality_score?: number
}

async function arrangePhotosWithAI(
  imageBuffers: { buffer: Buffer; mediaType: string }[]
): Promise<PhotoOrder[] | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || imageBuffers.length <= 1) return null

    console.log('[quick-upload] Call 2: Starting AI photo arrangement...')
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
      text: `You are a professional photo curator for a high-end London escort agency. Your job is to arrange profile photos to maximize client conversion. Rules:
* Photo 1 (cover): Most striking image — clear face, good lighting, attractive pose. This is the thumbnail clients see in search results.
* Photos 2-3: Best full body shots showing figure
* Photos 4+: Lifestyle, outfit variety, different angles
* Deprioritize: blurry, dark, duplicate poses, photos with other people
Return ONLY JSON array: [{"index": 0, "role": "cover", "sortOrder": 1, "quality_score": 9}, {"index": 3, "role": "gallery", "sortOrder": 2, "quality_score": 8}...]
index = original upload position (0-based). sortOrder = display position (1-based). quality_score = 1-10. Return ONLY valid JSON, nothing else.`,
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: blocks }],
    })

    const responseText = (message.content[0] as any)?.text || ''
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null

    const order: PhotoOrder[] = JSON.parse(jsonMatch[0])
    console.log('[quick-upload] Call 2: AI arranged', order.length, 'photos')
    return order
  } catch (e) {
    console.error('[quick-upload] Call 2: Photo arrangement AI failed (non-fatal):', e)
    return null
  }
}

// ─── Rate Conversion Helper ───

function mapRatesToRows(rates: Record<string, { incall: number | null; outcall: number | null }> | null) {
  if (!rates) return []
  const rows: Array<{ duration: string; callType: 'incall' | 'outcall'; price: number }> = []

  for (const [key, val] of Object.entries(rates)) {
    if (!val) continue
    if (val.incall != null && val.incall > 0) {
      rows.push({ duration: key, callType: 'incall', price: val.incall })
    }
    if (val.outcall != null && val.outcall > 0) {
      rows.push({ duration: key, callType: 'outcall', price: val.outcall })
    }
  }
  return rows
}

// ─── Build notesInternal from raw data ───

function buildNotesInternal(ai: AIParsedProfile | null, regex: any): string | null {
  // If client already sent a proper notesInternal (from parse-anketa), use it
  if (ai?.notesInternal && typeof ai.notesInternal === 'string' && ai.notesInternal.length > 10) {
    return ai.notesInternal
  }

  // Otherwise, build from raw parsed fields
  const lines: string[] = []
  const name = ai?.name || regex?.name
  if (name) lines.push(`Name: ${name}`)
  if (ai?.age || regex?.age) lines.push(`Age: ${ai?.age || regex?.age}`)
  if (ai?.nationality || regex?.nationality) lines.push(`Nationality: ${ai?.nationality || regex?.nationality}`)
  const phones = [ai?.phone, ai?.phone2].filter(Boolean)
  if (phones.length) lines.push(`Phone: ${phones.join(', ')}`)
  if (ai?.email) lines.push(`Email: ${ai.email}`)
  const loc = [ai?.postcode || regex?.address?.postcode, ai?.tube_station || regex?.address?.tubeStation].filter(Boolean)
  if (loc.length) lines.push(`Location: ${loc.join(', ')}`)
  if (ai?.languages?.length) lines.push(`Languages: ${ai.languages.join(', ')}`)
  if (ai?.height_cm) lines.push(`Height: ${ai.height_cm}cm`)
  if (ai?.weight_kg) lines.push(`Weight: ${ai.weight_kg}kg`)
  if (ai?.bust_size) lines.push(`Bust: ${ai.bust_size} ${ai.bust_type || ''}`.trim())
  if (ai?.orientation) lines.push(`Orientation: ${ai.orientation}`)
  if (ai?.smokes != null) lines.push(`Smoking: ${ai.smokes ? 'yes' : 'no'}`)
  if (ai?.tattoo && ai.tattoo !== 'None') lines.push(`Tattoo: ${ai.tattoo}`)
  if (ai?.rates) {
    const r = ai.rates as Record<string, { incall?: number | null; outcall?: number | null }>
    if (r['1hour']?.incall) lines.push(`1h incall: £${r['1hour'].incall}`)
    if (r['1hour']?.outcall) lines.push(`1h outcall: £${r['1hour'].outcall}`)
    if (r['overnight']?.incall) lines.push(`Overnight: £${r['overnight'].incall}`)
  }
  return lines.length > 0 ? lines.join(' | ') : null
}

// ─── POST Handler ───

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER'])
    if (!isActor(auth)) return auth

    console.log('[quick-upload] === Starting Quick Upload ===')
    await ensureExtensionTables()
    await ensureServices()

    const formData = await request.formData()
    const allFiles = formData.getAll('files') as File[]

    if (!allFiles || allFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 })
    }

    // ── Separate images from documents ──
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

    // ── Read client-side pre-parsed fields (fallback) ──
    let clientParsed: AIParsedProfile | null = null
    const parsedFieldsRaw = formData.get('parsedFields')
    if (parsedFieldsRaw && typeof parsedFieldsRaw === 'string') {
      try {
        clientParsed = JSON.parse(parsedFieldsRaw) as AIParsedProfile
        console.log('[quick-upload] Client pre-parsed fields received:', {
          name: clientParsed.name,
          hasPhone: !!clientParsed.phone,
          hasRates: !!clientParsed.rates,
          services: clientParsed.services?.length || 0,
        })
      } catch (e) {
        console.error('[quick-upload] Failed to parse client parsedFields:', e)
      }
    }

    console.log(`[quick-upload] Files: ${imageFiles.length} images, ${docFiles.length} documents`)

    // ── Extract text from documents ──
    let documentText = ''
    for (const doc of docFiles) {
      const buffer = Buffer.from(await doc.arrayBuffer())
      const text = await extractTextFromFile(buffer, doc.name, doc.type)
      documentText += text + '\n'
    }
    console.log(`[quick-upload] Document text length: ${documentText.length} chars`)

    // ── Read image buffers ──
    const imageBuffers: { buffer: Buffer; mediaType: string; name: string }[] = []
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer())
      imageBuffers.push({ buffer, mediaType: file.type || 'image/jpeg', name: file.name })
    }

    // ── CALL 1: AI document parse (with regex fallback) ──
    let aiParsed: AIParsedProfile | null = null
    let usedFallback = false

    if (documentText.trim()) {
      aiParsed = await parseDocumentWithAI(documentText)
      if (!aiParsed && clientParsed) {
        console.log('[quick-upload] AI parse failed → using client pre-parsed fields')
        aiParsed = clientParsed
      } else if (!aiParsed) {
        console.log('[quick-upload] AI parse failed → falling back to regex parser')
        usedFallback = true
      }
    } else if (clientParsed) {
      // No document file but client sent pre-parsed fields
      console.log('[quick-upload] No document text, using client pre-parsed fields')
      aiParsed = clientParsed
    }

    // Regex fallback
    const regexParsed = usedFallback ? parseProfileDocument(documentText) : null
    if (regexParsed) {
      console.log('[quick-upload] Regex fallback parsed:', {
        name: regexParsed.name,
        services: regexParsed.services.length,
        rates: regexParsed.rates.length,
      })
    }

    // ── CALL 2: AI photo arrangement (parallel, non-blocking) ──
    const photoOrderPromise = imageBuffers.length > 1 ? arrangePhotosWithAI(imageBuffers) : null

    // Wait for photo order
    const photoOrder = await photoOrderPromise

    // Build photo sort map
    const sortMap = new Map<number, { sortOrder: number; role: string }>()
    if (photoOrder) {
      for (const p of photoOrder) {
        sortMap.set(p.index, { sortOrder: p.sortOrder, role: p.role })
      }
    }

    // ─── DUPLICATE CHECK ───
    const force = request.nextUrl.searchParams.get('force') === 'true'
    const parsedName = aiParsed?.name || regexParsed?.name || 'New Model'
    const parsedPhone = normalizePhone(aiParsed?.phone || (aiParsed as any)?.whatsapp_number)

    if (!force) {
      const nameMatch = await prisma.model.findFirst({
        where: { name: { contains: parsedName, mode: 'insensitive' }, deletedAt: null },
        select: { id: true, name: true, publicCode: true },
      })

      const phoneMatch = parsedPhone
        ? await prisma.model.findFirst({
            where: { phone: parsedPhone, deletedAt: null },
            select: { id: true, name: true, publicCode: true },
          })
        : null

      if (nameMatch || phoneMatch) {
        const existing = (nameMatch || phoneMatch)!
        return NextResponse.json({
          success: false,
          duplicate: true,
          existing: { id: existing.id, name: existing.name, publicCode: existing.publicCode },
        }, { status: 409 })
      }
    }

    // ─── DATABASE SAVE CHAIN ───

    // Step 1: Create model
    console.log('[quick-upload] Step 1: Creating model...')
    const name = parsedName
    let slug = slugify(name)
    if (!slug) slug = 'model'
    const existing = await prisma.model.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const publicCode = `${name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 12)}-${randomUUID().substring(0, 8).toUpperCase()}`

    const smokingVal = aiParsed?.smokes != null
      ? (aiParsed.smokes ? 'yes' : 'no')
      : (regexParsed?.smokes ? 'yes' : regexParsed?.smokes === false ? 'no' : null)

    const model = await prisma.model.create({
      data: {
        name,
        slug,
        publicCode,
        status: 'draft',

        // Bio & Marketing
        notesInternal: buildNotesInternal(aiParsed, regexParsed),
        bio: aiParsed?.bio || aiParsed?.bio_text || null,
        tagline: aiParsed?.tagline || null,
        availability: aiParsed?.availability || 'Advanced Notice',
        education: aiParsed?.education || null,
        travel: aiParsed?.travel || null,
        ageForWeb: normalizeAge(aiParsed?.age) || normalizeAge(regexParsed?.age) || null,
        ethnicity: aiParsed?.ethnicity || null,
        hairLength: aiParsed?.hair_length || null,
        measurements: aiParsed?.measurements || null,
        wardrobe: aiParsed?.wardrobe || [],

        // Contact
        phone: normalizePhone(aiParsed?.phone || (aiParsed as any)?.whatsapp_number),
        phone2: normalizePhone(aiParsed?.phone2),
        email: aiParsed?.email || null,
        telegramTag: typeof aiParsed?.telegram === 'string' ? aiParsed.telegram : null,
        telegramPhone: typeof aiParsed?.whatsapp === 'string' ? aiParsed.whatsapp : null,
        whatsapp: aiParsed?.whatsapp ? true : false,
        telegram: aiParsed?.telegram ? true : false,
        viber: aiParsed?.viber ? true : false,
        signal: aiParsed?.signal ? true : false,

        // Payment methods
        paymentCash: aiParsed?.payment_methods?.some(m => m === 'cash') ?? false,
        paymentRevolut: aiParsed?.payment_methods?.some(m => m === 'revolut') ?? false,
        paymentBankTransfer: aiParsed?.payment_methods?.some(m => ['bank transfer', 'bank'].includes(m)) ?? false,
        paymentTerminal: aiParsed?.payment_methods?.some(m => ['terminal', 'card'].includes(m)) ?? false,
        paymentMonzo: aiParsed?.payment_methods?.some(m => m === 'monzo') ?? false,
        paymentStarling: aiParsed?.payment_methods?.some(m => m === 'starling') ?? false,
        paymentMonese: aiParsed?.payment_methods?.some(m => m === 'monese') ?? false,
        paymentBTC: aiParsed?.payment_methods?.some(m => ['bitcoin', 'btc'].includes(m)) ?? false,
        paymentUSDT: aiParsed?.payment_methods?.some(m => m === 'usdt') ?? false,
        paymentLTC: aiParsed?.payment_methods?.some(m => m === 'ltc') ?? false,

        // Location (also stored in model_addresses below)
        postcode: aiParsed?.postcode || regexParsed?.address?.postcode || null,
        nearestStation: aiParsed?.tube_station || regexParsed?.address?.tubeStation || null,

        // Work preferences
        worksWithCouples: aiParsed?.works_with_couples ?? regexParsed?.worksWithCouples ?? false,
        worksWithWomen: aiParsed?.serves_women ?? regexParsed?.servesWomen ?? false,
        dinnerDates: aiParsed?.dinner_dates ?? false,
        travelCompanion: aiParsed?.travel_companion ?? false,

        // Stats
        stats: {
          create: {
            age: normalizeAge(aiParsed?.age) || normalizeAge(regexParsed?.age) || null,
            height: normalizeHeight(aiParsed?.height_cm) || normalizeHeight(regexParsed?.heightCm) || null,
            weight: normalizeWeight(aiParsed?.weight_kg) || normalizeWeight(regexParsed?.weightKg) || null,
            bustSize: aiParsed?.bust_size || regexParsed?.bustSize || null,
            bustType: aiParsed?.bust_type || null,
            dressSize: aiParsed?.dress_size || regexParsed?.dressSize || null,
            feetSize: aiParsed?.shoe_size || regexParsed?.shoeSize || null,
            eyeColour: aiParsed?.eye_colour || regexParsed?.eyeColour || null,
            hairColour: aiParsed?.hair_colour || regexParsed?.hairColour || null,
            nationality: aiParsed?.nationality || regexParsed?.nationality || null,
            orientation: aiParsed?.orientation || regexParsed?.orientation || null,
            languages: aiParsed?.languages || regexParsed?.languages || [],
            smokingStatus: smokingVal,
            tattooStatus: aiParsed?.tattoo || null,
            piercingStatus: aiParsed?.piercings || regexParsed?.piercings || null,
          },
        },
      },
    })
    console.log('[quick-upload] Step 1: Model created:', model.id, model.name)

    // Step 2: Link services
    console.log('[quick-upload] Step 2: Linking services...')
    let linkedServices = 0

    // Load all DB services for matching
    const dbServices = await prisma.service.findMany({
      select: { id: true, slug: true, title: true },
    })
    const slugToId = new Map<string, string>()
    for (const s of dbServices) {
      slugToId.set(s.slug, s.id)
      slugToId.set(s.title.toLowerCase(), s.id)
    }

    if (aiParsed?.services && aiParsed.services.length > 0) {
      // AI services path
      const enabledServices = aiParsed.services.filter(s => s.enabled)
      for (const svc of enabledServices) {
        const normalizedSlug = slugifyServiceName(svc.name)
        const serviceId = slugToId.get(normalizedSlug) || slugToId.get(svc.name.toLowerCase())
        if (!serviceId) {
          console.log(`[quick-upload] Service not matched: "${svc.name}" (slug: "${normalizedSlug}")`)
          continue
        }
        try {
          await prisma.modelService.create({
            data: {
              modelId: model.id,
              serviceId,
              isEnabled: true,
              extraPrice: svc.extra_price ?? null,
            },
          })
          linkedServices++
        } catch (e: any) {
          // Skip duplicates
          if (!e.code || e.code !== 'P2002') {
            console.error(`[quick-upload] Service link failed: ${svc.name}:`, e)
          }
        }
      }
    } else if (regexParsed && regexParsed.services.length > 0) {
      // Regex fallback services path
      const enabledSlugs = regexParsed.services.filter(s => s.enabled).map(s => s.slug)
      for (const svcSlug of enabledSlugs) {
        const serviceId = slugToId.get(svcSlug)
        if (!serviceId) continue
        try {
          await prisma.modelService.create({
            data: { modelId: model.id, serviceId, isEnabled: true },
          })
          linkedServices++
        } catch {}
      }
    }
    console.log(`[quick-upload] Step 2: Linked ${linkedServices} services`)

    // Step 3: Insert rates directly into model_rates (duration_type + call_type + price)
    console.log('[quick-upload] Step 3: Inserting rates...')
    let insertedRates = 0

    // Build lookup map from AI keys to duration_type values
    const aiKeyToDuration: Record<string, string> = {
      '30min': '30min', '30 min': '30min', '30 minutes': '30min',
      '45min': '45min', '45 min': '45min', '45 minutes': '45min',
      '1hour': '1hour', '1 hour': '1hour', '60min': '1hour', '60 min': '1hour',
      '90min': '90min', '90 min': '90min', '90 minutes': '90min', '1.5hours': '90min',
      '2hours': '2hours', '2 hours': '2hours', '120min': '2hours',
      '3hours': '3hours', '3 hours': '3hours', '180min': '3hours',
      '4hours': '4hours', '4 hours': '4hours', '240min': '4hours',
      'overnight': 'overnight', 'overnight (9 hrs)': 'overnight', 'overnight (9hrs)': 'overnight',
      'extra_hour': 'extra_hour', 'extra hour': 'extra_hour', 'extra': 'extra_hour',
    }

    const upsertRate = async (modelId: string, dt: string, ct: string, price: number) => {
      await prisma.$executeRawUnsafe(
        `DELETE FROM model_rates WHERE model_id = $1 AND duration_type = $2 AND call_type = $3 AND location_id IS NULL`,
        modelId, dt, ct
      )
      await prisma.$executeRawUnsafe(
        `INSERT INTO model_rates (id, model_id, duration_type, call_type, price, currency, is_active)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'GBP', true)`,
        modelId, dt, ct, price
      )
    }

    const aiRates = aiParsed?.rates
    if (aiRates) {
      for (const [duration, val] of Object.entries(aiRates)) {
        if (!val) continue
        const dt = aiKeyToDuration[duration.toLowerCase()]
        if (!dt) { console.log('[quick-upload] No duration type for ' + duration); continue }
        const v = val as { incall?: number | string; outcall?: number | string }
        try {
          const incallPrice = normalizePrice(v.incall)
          const outcallPrice = normalizePrice(v.outcall)
          if (incallPrice != null) { await upsertRate(model.id, dt, 'incall', incallPrice); insertedRates++ }
          if (outcallPrice != null) { await upsertRate(model.id, dt, 'outcall', outcallPrice); insertedRates++ }
        } catch (e) { console.error('[quick-upload] Rate upsert failed ' + duration, e) }
      }
    } else if (regexParsed?.rates?.length) {
      for (const rate of regexParsed.rates) {
        const dt = aiKeyToDuration[rate.duration.toLowerCase()]
        if (!dt) continue
        try {
          const ratePrice = normalizePrice(rate.price) ?? rate.price
          await upsertRate(model.id, dt, rate.callType || 'incall', ratePrice)
          insertedRates++
        } catch (e) { console.error('[quick-upload] Regex rate upsert failed ' + rate.duration, e) }
      }
    }
    console.log('[quick-upload] Step 3: Inserted ' + insertedRates + ' rates')
    // Step 4: Insert address
    console.log('[quick-upload] Step 4: Inserting address...')
    const street = aiParsed?.address || regexParsed?.address?.street || null
    const flatNumber = regexParsed?.address?.flat || null
    const flatFloor = regexParsed?.address?.floor ? parseInt(regexParsed.address.floor) : null
    const postcode = aiParsed?.postcode || regexParsed?.address?.postcode || null
    const tubeStation = aiParsed?.tube_station || regexParsed?.address?.tubeStation || null

    if (street || postcode) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_addresses (id, model_id, street, flat_number, flat_floor, post_code, tube_station, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
           ON CONFLICT (model_id) DO UPDATE SET
             street = EXCLUDED.street, flat_number = EXCLUDED.flat_number,
             flat_floor = EXCLUDED.flat_floor, post_code = EXCLUDED.post_code,
             tube_station = EXCLUDED.tube_station`,
          `${model.id}-addr`, model.id,
          street, flatNumber, flatFloor, postcode, tubeStation,
        )
        console.log('[quick-upload] Step 4: Address saved')
      } catch (e) {
        console.error('[quick-upload] Step 4: Address insert failed:', e)
      }
    } else {
      console.log('[quick-upload] Step 4: No address data to save')
    }

    // Step 5: Insert work preferences
    console.log('[quick-upload] Step 5: Inserting work preferences...')
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO model_work_preferences (id, model_id, work_with_couples, work_with_women)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (model_id) DO UPDATE SET
           work_with_couples = EXCLUDED.work_with_couples,
           work_with_women = EXCLUDED.work_with_women`,
        `${model.id}-prefs`, model.id,
        aiParsed?.works_with_couples ?? regexParsed?.worksWithCouples ?? false,
        aiParsed?.serves_women ?? regexParsed?.servesWomen ?? false,
      )
      console.log('[quick-upload] Step 5: Work preferences saved')
    } catch (e) {
      console.error('[quick-upload] Step 5: Work prefs insert failed:', e)
    }

    // Step 5.5: Match location (district + transport hub + primaryLocationId)
    console.log('[quick-upload] Step 5.5: Matching location...')
    try {
      const stationName = tubeStation || aiParsed?.tube_station || null
      const modelPostcode = postcode || aiParsed?.postcode || null

      if (stationName) {
        // Try to find matching transport hub by station name
        const stationLower = stationName.toLowerCase().trim()
        const hub = await prisma.transportHub.findFirst({
          where: {
            isActive: true,
            OR: [
              { name: { equals: stationName, mode: 'insensitive' } },
              { slug: stationLower.replace(/\s+/g, '-') },
            ],
          },
          include: { district: true },
        })

        if (hub) {
          console.log(`[quick-upload] Step 5.5: Matched hub "${hub.name}" → district "${hub.district.name}"`)

          // Find or match a Location for primaryLocationId
          // Try district name first, then "London" fallback
          let location = await prisma.location.findFirst({
            where: {
              status: 'active',
              OR: [
                { title: { equals: hub.district.name, mode: 'insensitive' } },
                { slug: hub.district.slug },
              ],
            },
          })
          if (!location) {
            location = await prisma.location.findFirst({
              where: { status: 'active', title: { contains: 'London', mode: 'insensitive' } },
            })
          }

          // Update model with primaryLocationId
          if (location) {
            await prisma.model.update({
              where: { id: model.id },
              data: { primaryLocationId: location.id },
            })
            console.log(`[quick-upload] Step 5.5: Set primaryLocationId → "${location.title}"`)
          }

          // Create ModelLocation record linking model to district
          const defaultWalkingMinutes = hub.walkingMinutes || 5
          try {
            await prisma.modelLocation.create({
              data: {
                modelId: model.id,
                districtId: hub.district.id,
                isPrimary: true,
                transportHubId: hub.id,
                walkingMinutes: defaultWalkingMinutes,
              },
            })
            console.log(`[quick-upload] Step 5.5: ModelLocation created (district: ${hub.district.name}, hub: ${hub.name}, walk: ${defaultWalkingMinutes}min)`)
          } catch (e: any) {
            if (e.code !== 'P2002') {
              console.error('[quick-upload] Step 5.5: ModelLocation create failed:', e)
            }
          }

          // Add note if walking minutes is a default estimate
          if (!modelPostcode) {
            await prisma.model.update({
              where: { id: model.id },
              data: {
                notesInternal: [model.notesInternal, 'Walking minutes: estimated (default), needs verification'].filter(Boolean).join('\n'),
              },
            })
          }
        } else {
          // No hub match — try matching district directly by station name
          const district = await prisma.district.findFirst({
            where: {
              isActive: true,
              OR: [
                { name: { equals: stationName, mode: 'insensitive' } },
                { slug: stationLower.replace(/\s+/g, '-') },
              ],
            },
          })

          if (district) {
            console.log(`[quick-upload] Step 5.5: Matched district directly "${district.name}" (no hub)`)

            let location = await prisma.location.findFirst({
              where: {
                status: 'active',
                OR: [
                  { title: { equals: district.name, mode: 'insensitive' } },
                  { slug: district.slug },
                ],
              },
            })
            if (!location) {
              location = await prisma.location.findFirst({
                where: { status: 'active', title: { contains: 'London', mode: 'insensitive' } },
              })
            }

            if (location) {
              await prisma.model.update({
                where: { id: model.id },
                data: { primaryLocationId: location.id },
              })
              console.log(`[quick-upload] Step 5.5: Set primaryLocationId → "${location.title}"`)
            }

            try {
              await prisma.modelLocation.create({
                data: {
                  modelId: model.id,
                  districtId: district.id,
                  isPrimary: true,
                  walkingMinutes: 5,
                },
              })
              console.log(`[quick-upload] Step 5.5: ModelLocation created (district: ${district.name}, walk: 5min default)`)
            } catch (e: any) {
              if (e.code !== 'P2002') {
                console.error('[quick-upload] Step 5.5: ModelLocation create failed:', e)
              }
            }

            await prisma.model.update({
              where: { id: model.id },
              data: {
                notesInternal: [model.notesInternal, 'Walking minutes: estimated (default 5min), needs verification'].filter(Boolean).join('\n'),
              },
            })
          } else {
            console.log(`[quick-upload] Step 5.5: No district/hub match for "${stationName}"`)
          }
        }
      } else {
        console.log('[quick-upload] Step 5.5: No station name to match')
      }
    } catch (e) {
      console.error('[quick-upload] Step 5.5: Location matching failed (non-fatal):', e)
    }

    // Step 6: Upload photos to R2
    console.log('[quick-upload] Step 6: Uploading photos...')
    let uploadedPhotos = 0
    for (let i = 0; i < imageBuffers.length; i++) {
      const { buffer, mediaType, name: fileName } = imageBuffers[i]
      const key = buildKey(model.id, `${i}-${Date.now()}.${fileName.split('.').pop() || 'jpg'}`)

      const orderInfo = sortMap.get(i)
      const sortOrder = orderInfo ? orderInfo.sortOrder - 1 : i
      const isCover = orderInfo ? orderInfo.role === 'cover' : i === 0

      try {
        const result = await uploadMedia(buffer, key, mediaType)
        await generateThumbnail(buffer, result.key)

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
        console.log(`[quick-upload] Step 6: Uploaded photo ${i + 1}/${imageBuffers.length}`)
      } catch (e: any) {
        console.error(`[quick-upload] Step 6 FULL ERROR:`, JSON.stringify({
          photo: i,
          name: fileName,
          message: e?.message,
          code: e?.code || e?.$metadata?.httpStatusCode,
          stack: e?.stack?.split('\n').slice(0, 3).join(' | '),
        }))
      }
    }
    console.log(`[quick-upload] Step 6: Uploaded ${uploadedPhotos}/${imageBuffers.length} photos`)

    if (imageBuffers.length > 0 && uploadedPhotos === 0) {
      // All photo uploads failed — delete the model and report error
      await prisma.model.delete({ where: { id: model.id } }).catch(() => {})
      return NextResponse.json({
        success: false,
        error: `All ${imageBuffers.length} photo uploads to R2 failed. Check R2 credentials and bucket configuration.`,
      }, { status: 502 })
    }

    // Step 7: Save learning example
    if (aiParsed && documentText.trim()) {
      console.log('[quick-upload] Step 7: Saving AI parse example for learning...')
      try {
        const inputHash = createHash('sha256').update(documentText).digest('hex')

        const existingExample = await prisma.aIParseExample.findFirst({
          where: { inputHash },
        })

        if (!existingExample) {
          const example = await prisma.aIParseExample.create({
            data: {
              inputType: 'document',
              inputHash,
              inputText: documentText,
              outputJson: aiParsed as any,
            },
          })

          await prisma.model.update({
            where: { id: model.id },
            data: { aiParseExampleId: example.id },
          })
          console.log('[quick-upload] Step 7: Learning example saved:', example.id)
        } else {
          await prisma.model.update({
            where: { id: model.id },
            data: { aiParseExampleId: existingExample.id },
          })
          console.log('[quick-upload] Step 7: Duplicate input, linked existing example')
        }
      } catch (e) {
        console.error('[quick-upload] Step 7: Failed to save learning example (non-fatal):', e)
      }
    }

    // Revalidate frontend pages so new model appears immediately
    revalidatePath('/companions')
    revalidatePath('/')
    if (model.slug) {
      revalidatePath(`/companions/${model.slug}`)
    }

    // Step 8: Audit log
    try {
      await prisma.quickUploadLog.create({
        data: {
          modelId: model.id,
          aiParsedFields: aiParsed as any,
          operatorEdits: clientParsed as any,
          finalFields: {
            name: model.name,
            slug: model.slug,
            phone: model.phone,
            bio: model.bio,
            notesInternal: model.notesInternal,
            primaryLocationId: model.primaryLocationId,
            status: model.status,
            services: linkedServices,
            rates: insertedRates,
            photos: uploadedPhotos,
          },
          createdBy: auth.email || null,
        },
      })
      console.log('[quick-upload] Step 8: Audit log saved')
    } catch (e) {
      console.error('[quick-upload] Step 8: Audit log failed (non-fatal):', e)
    }

    console.log('[quick-upload] === Quick Upload Complete ===')

    // Build extracted field summary
    const extractedFields: Record<string, unknown> = aiParsed ? { ...aiParsed } : {}
    const fieldsFound = Object.entries(extractedFields)
      .filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k]) => k)
    const fieldsEmpty = Object.entries(extractedFields)
      .filter(([, v]) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0))
      .map(([k]) => k)

    return NextResponse.json({
      success: true,
      modelId: model.id,
      slug: model.slug,
      summary: {
        name,
        age: aiParsed?.age || regexParsed?.age || null,
        nationality: aiParsed?.nationality || regexParsed?.nationality || null,
        services: linkedServices,
        rates: insertedRates,
        photos: uploadedPhotos,
        hasBio: !!aiParsed?.bio_text,
        hasTagline: !!aiParsed?.tagline,
        hasContact: !!(aiParsed?.phone || aiParsed?.email),
        hasAddress: !!(street || postcode),
        photosArrangedByAI: !!photoOrder,
        parsedByAI: !usedFallback && !!aiParsed,
        parsedByRegex: usedFallback,
      },
      extracted: {
        fieldsFound,
        fieldsEmpty,
        servicesLinked: linkedServices,
        ratesCreated: insertedRates,
        photosUploaded: uploadedPhotos,
      },
      redirectTo: `/admin/models/${model.id}`,
    })
  } catch (error: any) {
    console.error('[quick-upload] Fatal error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Quick upload failed',
    }, { status: 500 })
  }
}
