// POST /api/admin/quick-upload
// Handles: parse_anketa | sort_photos | upload_photos | save_media

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { uploadMedia, generateThumbnail, buildKey } from '@/lib/storage/r2'
import { randomUUID } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── PARSE ANKETA ────────────────────────────────────────────────────────────
async function parseAnketa(text: string): Promise<Record<string, any>> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Parse this escort agency anketa. Extract every field accurately.
Text may be English, Russian, or mixed. Any format.

Return ONLY valid JSON — no markdown, no backticks, no comments.

EXTRACTION RULES:
- age / height / weight: numbers only (e.g. "172" not "172 cm")
- rates: number only — strip £ and text (e.g. "£350+ Taxi" → 350, "£1800" → 1800)
- breastSize: bra size only e.g. "34C" (extract from "natural 34C" or "34C natural")
- breastType: "Natural" or "Silicone" (from "natural 34C" or "silicone 34D")
- smokingStatus: "No", "Socially", or "Yes"
- tattooStatus: "None", "Small", "Medium", or "Large"
- orientation: "Hetero", "Bi", or "Lesbian"
- languages: comma-separated string e.g. "Portuguese, English, Spanish"
- piercingTypes: describe piercings e.g. "Nipple, Nose" (from "Nipple and nose")
- addressFlat: flat/floor info separately from street
- blackClients: false if anketa says "no", true if "yes"
- disabledClients: false if anketa says "no", true if "yes"
- workWithCouples: true if "yes", false if "no"
- workWithWomen: true if "yes", false if "no"
- services: array of slugs — include ONLY services marked "yes" (with or without extra charge)

SERVICE SLUG MAPPING — use EXACTLY these slugs:
"69" → "69"
"FK" → "fk"
"DFK" → "dfk"
"GFE" → "gfe"
"OWO" → "owo"
"OWC" → "owc"
"COB" → "cob"
"CIF" → "cif"
"CIM" → "cim"
"Swallow" → "swallow"
"Snowballing" → "snowballing"
"DT" / "Deep throat" → "dt"
"Fingering" → "fingering"
"A-Level" / "Anal" → "a-level"
"DP" → "dp"
"PSE" → "pse"
"Party girl" → "party-girl"
"Face sitting" → "face-sitting"
"Dirty talk" → "dirty-talk"
"WS giving" → "ws-giving"
"WS receiving" → "ws-receiving"
"Rimming giving" → "rimming-giving"
"Rimming receiving" → "rimming-receiving"
"Smoking fetish" → "smoking-fetish"
"Roleplay" → "roleplay"
"Filming with mask" → "filming-mask"
"Filming without mask" → "filming-no-mask"
"Foot fetish" → "foot-fetish"
"Light domination" → "light-dom"
"Domination" → "domination"
"Spanking giving" → "spanking-giving"
"Soft spanking receiving" → "spanking-soft-receiving"
"Tie and Tease" → "tie-and-tease"
"DUO" → "duo"
"Bi DUO" → "bi-duo"
"Couples" → "couples"
"MMF" → "mmf"
"Group" → "group"
"Lady's services" → "lady-services"
"Massage" → "massage"
"Prostate massage" → "prostate"
"Professional massage" → "professional-massage"
"Body to body massage" → "b2b"
"Erotic massage" → "erotic-massage"
"Lomilomi massage" → "lomilomi"
"Nuru massage" → "nuru"
"Sensual massage" → "sensual"
"Tantric massage" → "tantric"
"Striptease" → "striptease"
"Lapdancing" → "lapdancing"
"Belly-dance" → "belly-dance"
"Uniforms" → "uniforms"
"Toys" → "toys"
"Strap-on" → "strap-on"
"Poppers" → "poppers"
"Handcuffs" → "handcuffs"
"Fisting giving" → "fisting-giving"
"Open minded" → "open-minded"
"Dinner date" → "dinner-date"

OUTPUT JSON:
{
  "name": string,
  "age": number,
  "height": number,
  "weight": number,
  "dressSizeUK": string,
  "feetSizeUK": string,
  "breastSize": string,
  "breastType": string,
  "eyesColour": string,
  "hairColour": string,
  "smokingStatus": string,
  "tattooStatus": string,
  "piercingTypes": string,
  "nationality": string,
  "languages": string,
  "orientation": string,
  "workWithCouples": boolean,
  "workWithWomen": boolean,
  "blackClients": boolean,
  "disabledClients": boolean,
  "rate30min": number,
  "rate45min": number,
  "rate1hIn": number,
  "rate1hOut": number,
  "rate90minIn": number,
  "rate90minOut": number,
  "rate2hIn": number,
  "rate2hOut": number,
  "rateExtraHour": number,
  "rateOvernight": number,
  "addressStreet": string,
  "addressFlat": string,
  "addressPostcode": string,
  "tubeStation": string,
  "services": string[]
}

Set missing fields to null. services defaults to [].

ANKETA:
${text.slice(0, 4000)}`
    }]
  })

  const raw = (msg.content[0] as any).text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(raw)

  // Clean: strip nulls/empty, keep booleans and arrays as-is, numbers as numbers
  const clean: Record<string, any> = { notesInternal: text.slice(0, 1000) }
  for (const [k, v] of Object.entries(parsed)) {
    if (v === null || v === undefined || v === '') continue
    if (Array.isArray(v)) { if (v.length > 0) clean[k] = v; continue }
    if (typeof v === 'boolean') { clean[k] = v; continue }
    if (typeof v === 'number') { clean[k] = v; continue }
    clean[k] = String(v)
  }
  return clean
}

// ─── SORT PHOTOS WITH AI ─────────────────────────────────────────────────────
async function sortPhotosWithAI(
  photos: { data: string; mimeType: string }[]
): Promise<{ index: number; role: string }[]> {
  const sample = photos.slice(0, 12)
  const blocks: any[] = []

  for (let i = 0; i < sample.length; i++) {
    blocks.push({ type: 'image', source: { type: 'base64', media_type: sample[i].mimeType, data: sample[i].data } })
    blocks.push({ type: 'text', text: `Photo ${i}` })
  }
  blocks.push({
    type: 'text',
    text: `Sort these ${sample.length} escort profile photos for a luxury agency website.
Return ONLY a JSON array, no markdown:
[{"index":0,"role":"cover"},{"index":1,"role":"full_body"},...]
Roles: cover (best glamour shot — goes first as hero image), full_body, face, detail, other.
Order by visual impact for a luxury escort profile. Include all ${sample.length} photos.`
  })

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: blocks }]
  })

  const raw = (msg.content[0] as any).text.replace(/```json|```/g, '').trim()
  return JSON.parse(raw)
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Parse anketa ───────────────────────────────────────────────────
    if (body.action === 'parse_anketa') {
      const { text } = body
      if (!text) return NextResponse.json({ success: false, error: 'No text' }, { status: 400 })
      const parsed = await parseAnketa(text)
      return NextResponse.json({ success: true, parsed })
    }

    // ── 2. Sort photos ────────────────────────────────────────────────────
    if (body.action === 'sort_photos') {
      const { photos } = body
      if (!photos?.length) return NextResponse.json({ success: false, error: 'No photos' }, { status: 400 })

      let order: { index: number; role: string }[]
      try {
        order = await sortPhotosWithAI(photos)
      } catch {
        order = photos.map((_: any, i: number) => ({ index: i, role: i === 0 ? 'cover' : 'other' }))
      }

      const extras = photos.slice(12).map((_: any, i: number) => ({ index: 12 + i, role: 'other' }))
      return NextResponse.json({ success: true, order: [...order, ...extras] })
    }

    // ── 3. Upload photos to R2 with sharp ─────────────────────────────────
    if (body.action === 'upload_photos') {
      const { modelId, photos } = body
      if (!modelId || !photos?.length) {
        return NextResponse.json({ success: false, error: 'Missing modelId or photos' }, { status: 400 })
      }

      const results = await Promise.all(
        photos.map(async (p: {
          data: string; mimeType: string; name: string
          sortOrder: number; isPrimary: boolean; role: string
        }) => {
          const buffer = Buffer.from(p.data, 'base64')
          const ext = p.name.split('.').pop()?.toLowerCase() || 'jpg'
          const fileId = randomUUID()
          const key = buildKey(modelId, `${fileId}.${ext}`)

          const uploaded = await uploadMedia(buffer, key, p.mimeType || 'image/jpeg')

          if (p.isPrimary) {
            try { await generateThumbnail(buffer, uploaded.key) } catch {}
          }

          return {
            key: uploaded.key,
            url: uploaded.url,
            sortOrder: p.sortOrder,
            isPrimary: p.isPrimary,
            role: p.role,
          }
        })
      )

      return NextResponse.json({ success: true, photos: results })
    }

    // ── 4. Save media to DB ───────────────────────────────────────────────
    if (body.action === 'save_media') {
      const { modelId, photos } = body

      if (photos.some((p: any) => p.isPrimary)) {
        await prisma.modelMedia.updateMany({
          where: { modelId },
          data: { isPrimary: false }
        })
      }

      const created = await Promise.all(
        photos.map((p: any) =>
          prisma.modelMedia.create({
            data: {
              modelId,
              type: 'photo',
              storageKey: p.key,
              url: p.url,
              isPrimary: p.isPrimary ?? false,
              isPublic: true,
              sortOrder: p.sortOrder,
              checksum: null,
            }
          })
        )
      )

      return NextResponse.json({ success: true, count: created.length })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })

  } catch (e: any) {
    console.error('[quick-upload]', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
