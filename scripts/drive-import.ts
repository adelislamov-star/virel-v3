/**
 * drive-import.ts
 * - Имя модели: из названия папки Drive
 * - Анкета: Google Doc внутри папки (любое название) → парсится ЛОКАЛЬНО через Anthropic SDK
 * - Фото: все image/* файлы → R2 напрямую через S3 + sharp (watermark + WebP + thumbnail)
 * - Видео: все video/* файлы → R2 напрямую через S3
 * - Подпапки (Verification, пересечка и др.): игнорируются
 * - Модель создаётся через /api/admin/models
 * - Media records → Prisma напрямую в БД
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.drive' })
dotenv.config({ path: '.env.production' })
process.env.DATABASE_URL = process.env.DATABASE_DIRECT_URL || process.env.DIRECT_URL || process.env.DATABASE_URL!

import Anthropic from '@anthropic-ai/sdk'
import { google } from 'googleapis'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fetch from 'node-fetch'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

// ─── СПИСОК 58 МОДЕЛЕЙ ───────────────────────────────────────────────────────
const MODEL_NAMES: string[] = [
  "Vega","Zharra","Derry","Nahasia","Ponita","Vermonta","Firmini","Marsalina",
  "Gardenia","Moire","Nara","Roderica","Marzena","Gamma","Masyanna","Pauletta",
  "Tetty","Hanzelika","Narzana","Megrez","Rahma","Minilla","Inciona","Manori",
  "Copacabana","Belva","Milkyway","Byrona","Flokita","Zambia","Kameya","Fenty",
  "Stimula","Islay","Generosa","Triangle","Kizomba","Chasity","Laonta","Nitro",
  "Morava","Dysis","Rudolpha","Trufana","Erato","Adjika","Mikami","Ferana",
  "Fadera","Colenia","Carmel","Zion","Juciara","Kimberley","Katarina","Vaiga",
  "Culpa","Adriana",
]

// ─── ПРЯМЫЕ ID ПАПОК (для тех, кто не находится поиском по имени) ────────────
const FOLDER_ID_OVERRIDES: Record<string, string> = {
  'Derry':     '1iOEvD1Qsu7qa2AF0qVX9XCiHyMj8TFHb',
  'Nahasia':   '1TKSrCBRnRQR9rEnpBTbDORv8vkaefDGv',
  'Ponita':    '1G6DbMSNZ_D_EOlNDHy0v4E4-0LK9I_qj',
  'Firmini':   '1YpNyhvjtlbw_O3jBiwai9u3dTM17dUPS',
  'Marsalina': '1rFaLtAk_-WEr_5mQx6oy7OaOvrWAwBia',
  'Gardenia':  '15PswusgKrpkGXYFYnS7RtpWJTf3YzYJb',
  'Roderica':  '1rbsdLU4EQxxFYOl1GG9OeAr28fGba2BC',
  'Marzena':   '1sChAaT14Yf6YwnyNy_yLHibk_poVLEJH',
  'Tetty':     '1KvxvPPHwexxVj5DirkquCZ3WMvVblNhX',
  'Hanzelika': '1lquB5gdLdNS7n4nQmc3bKllihX6mTK_c',
  'Narzana':   '1P5KiP4jZyOde2Wbb8dc5LbCcSeW15scX',
  'Minilla':   '1cRJaoSh57_ydsEQOh4B7JU9GvLgp-oNz',
  'Milkyway':  '1vxSqlrXK4SZLj5ZVPA61jD0oidUop4vz',
  'Zambia':    '1fUtlXLdLFsn6YOw4gKLFLeTUeX5qdx1b',
  'Fenty':     '1uxCVU-vWFriVPBGSENlDhL6EmiUDzC31',
  'Kizomba':   '1n57XYrjpL3SwmuMD-ojFXieo7W5pP22i',
  'Nitro':     '1XgvKG-CKE5tf7YD1vCzEC3irUofqM8yb',
  'Dysis':     '1AZZq3TL5ZVJi3KmbcS7eYW6jJzpJ_KNf',
  'Rudolpha':  '12PydqdRaMriFwxnmko87i6AvVEkQiqqR',
  'Mikami':    '1knvObC6c3gabQuol2YjPbWBnFWXPVyIB',
  'Carmel':    '1qg3cp4FIt5t0ky0WLJBNNy03zihfnu-3',
  'Juciara':   '1YMOouDv35jojmlWD38PdxKA9gzJ5MIA2',
  'Katarina':  '1AEhvEoRKogTWX8cwWktSRs9guNDjcsbG',
  'Vaiga':     '1_YpDu_2HzWCrk3dfpFZyBazyRDea299a',
  'Culpa':     '1s1UlskbBdYcCcl9u99Jr3-ekq7qWTwh5',
  'Vermonta':  '1cmm41Wk32DQHg3e7PRUw5-ebqsumeWAJ',
  'Kameya':    '1AHsoTjCxrELvzkkqqz0cFtUF5aT5YS4G',
  'Manori':    '1wm7wV3qaGZiDS7IjVLnmyn9GqAiEPKWb',
  'Generosa':  '1KIvC3rmdf7rdck5vMqkctVmLy5Daz1zy',
  'Trufana':   '12zcvlcF7UerLGSYrtFT1eWjmbnhvMGTK',
  'Adriana':   '1EwzSSAYtGzzaZFBjnQHJnar9BKAypBLk',
}

// ─── ENV ─────────────────────────────────────────────────────────────────────
const SA_JSON        = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
const SITE_URL       = process.env.SITE_URL!
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const CDN_URL        = process.env.NEXT_PUBLIC_CDN_URL!
const R2_ACCOUNT_ID  = process.env.R2_ACCOUNT_ID!
const R2_BUCKET      = process.env.R2_BUCKET_NAME!
const R2_KEY         = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET      = process.env.R2_SECRET_ACCESS_KEY!
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY!
const DB_URL         = process.env.DATABASE_DIRECT_URL || process.env.DIRECT_URL!

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
})

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 3000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn() }
    catch (e: any) {
      if (i === retries - 1) throw e
      console.log(`    Retry ${i + 1}/${retries - 1}...`)
      await sleep(delayMs)
    }
  }
  throw new Error('unreachable')
}

// ─── PARSE ANKETA локально через Anthropic ───────────────────────────────────
async function parseAnketa(text: string): Promise<Record<string, any>> {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: `You are a data extraction assistant for an escort agency. Parse application forms and return ONLY valid JSON. No markdown, no explanation, just JSON.

Rules:
- height: integer cm string ("1,67"→"167", "5ft5"→"165", "167cm"→"167")
- age, weight: integer string
- smokingStatus: "yes" or "no"
- tattooStatus: "none","small","medium","large"
- orientation: "heterosexual" or "bisexual"
- breastSize: cup size e.g. "34C"
- breastType: "natural" or "silicone"
- rates: number string, no currency symbols
- languages: array of strings e.g. ["English","Russian"]
- workWithCouples, workWithWomen, blackClients, disabledClients: true or false
- airportHeathrow, airportGatwick, airportStansted: true or false
- services: array of {"code":"CODE"} or {"code":"CODE","extraPrice":NUMBER}
- Rate fields: rate30min, rate45min, rate1hIn, rate1hOut, rate90minIn, rate90minOut, rate2hIn, rate2hOut, rateExtraHour, rateOvernight

Valid service codes ONLY:
69,FK,DFK,GFE,OWO,OWC,COB,CIF,CIM,SWALLOW,SNOWBALLING,DT,FINGERING,A_LEVEL,DP,PSE,PARTY_GIRL,FACE_SITTING,DIRTY_TALK,LADY_SERVICES,WS_GIVING,WS_RECEIVING,RIMMING_GIVING,RIMMING_RECEIVING,SMOKING_FETISH,ROLEPLAY,FILMING_MASK,FILMING_NO_MASK,FOOT_FETISH,OPEN_MINDED,LIGHT_DOM,SPANKING_GIVING,SPANKING_SOFT_RECEIVING,DUO,BI_DUO,COUPLES,MMF,GROUP,MASSAGE,PROSTATE,PROFESSIONAL_MASSAGE,B2B,EROTIC_MASSAGE,LOMILOMI,NURU,SENSUAL,TANTRIC,STRIPTEASE,LAPDANCING,BELLY_DANCE,UNIFORMS,TOYS,STRAP_ON,POPPERS,HANDCUFFS,DOMINATION,FISTING_GIVING,TIE_AND_TEASE`,
    messages: [{ role: 'user', content: `Parse this anketa form and return JSON:\n\n${text}` }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = raw.replace(/```json\n?|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI returned invalid JSON: ' + clean.substring(0, 200))
    return JSON.parse(match[0])
  }
}

// ─── UPLOAD PHOTO → R2 ───────────────────────────────────────────────────────
async function uploadPhoto(
  buffer: Buffer,
  modelId: string,
  index: number,
  isPrimary: boolean,
  prisma: any,
  mimeType?: string
): Promise<boolean> {
  try {
    let inputBuffer = buffer
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      inputBuffer = Buffer.from(await heicConvert({
        buffer: buffer,
        format: 'JPEG',
        quality: 1
      }))
    }

    // Watermark
    const meta = await sharp(inputBuffer).metadata()
    const w = meta.width ?? 800
    const h = meta.height ?? 1200
    const fontSize = Math.max(Math.round(w * 0.07), 28)
    const ls = Math.round(fontSize * 0.3)
    const svg = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<style>.wm{font-family:Georgia,serif;font-size:${fontSize}px;font-weight:bold;fill:white;fill-opacity:0.5;letter-spacing:${ls}px;}</style>` +
      `<text class="wm" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">VAUREL</text>` +
      `</svg>`
    )
    const wm = await sharp(inputBuffer).composite([{ input: svg, top: 0, left: 0 }]).toBuffer()

    // Main photo — resize + WebP
    const processed = await sharp(wm)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const key = `models/${modelId}/photo-${index}-${Date.now()}.webp`
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, Body: processed,
      ContentType: 'image/webp', CacheControl: 'public, max-age=31536000',
    }))

    // Thumbnail
    const thumb = await sharp(wm)
      .resize({ width: 400, height: 500, fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer()

    const thumbKey = key.replace('.webp', '_thumb.webp')
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: thumbKey, Body: thumb,
      ContentType: 'image/webp', CacheControl: 'public, max-age=31536000',
    }))

    // DB record
    await prisma.modelMedia.create({
      data: {
        modelId, type: 'photo', storageKey: key,
        url: `${CDN_URL}/${key}`, isPrimary, isPublic: true, sortOrder: index,
      }
    })

    return true
  } catch (e: any) {
    console.log(`    ⚠ Photo ${index} upload error: ${e.message}`)
    return false
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(55))
  console.log('VAUREL DRIVE IMPORT')
  console.log('═'.repeat(55))

  // Auth
  console.log('\n[AUTH] Logging in to vaurel.co.uk...')
  const loginRes = await fetch(`${SITE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!loginRes.ok) {
    console.error('[AUTH] FAILED:', await loginRes.text())
    process.exit(1)
  }
  const cookieMatch = (loginRes.headers.get('set-cookie') || '').match(/vaurel-token=([^;]+)/)
  if (!cookieMatch) { console.error('[AUTH] No vaurel-token in response'); process.exit(1) }
  const authCookie = `vaurel-token=${cookieMatch[1]}`
  console.log('[AUTH] OK')

  // Google Drive
  const driveAuth = new google.auth.GoogleAuth({
    credentials: SA_JSON,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth: driveAuth })
  console.log('[DRIVE] Connected')

  // Prisma
  process.env.DATABASE_URL = DB_URL
  const { prisma } = require('../src/lib/db/client')
  console.log('[DB] Prisma connected')
  console.log()

  const results: {
    name: string
    status: 'ok' | 'not_found' | 'ambiguous' | 'error'
    slug?: string
    photos: number
    videos: number
    noAnketa?: boolean
    error?: string
    foldersFound?: number
  }[] = []

  for (const modelName of MODEL_NAMES) {
    console.log(`${'─'.repeat(55)}`)
    console.log(`[${modelName}]`)
    const result = { name: modelName, status: 'ok' as const, photos: 0, videos: 0 }

    // ── 1. Find folder ────────────────────────────────────────────────────
    let folderId: string

    if (FOLDER_ID_OVERRIDES[modelName]) {
      folderId = FOLDER_ID_OVERRIDES[modelName]
      console.log(`  ✓ Folder (override): ${folderId}`)
    } else {
      let search: any
      try {
        search = await withRetry(() => drive.files.list({
          q: `name = '${modelName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        }))
      } catch (e: any) {
        console.log(`  ❌ Drive search failed: ${e.message}`)
        results.push({ ...result, status: 'error', error: e.message }); continue
      }

      const folders = search.data.files || []
      if (folders.length === 0) {
        console.log(`  ❌ NOT FOUND in Drive`)
        results.push({ ...result, status: 'not_found' }); continue
      }
      if (folders.length > 1) {
        console.log(`  ❌ AMBIGUOUS — found ${folders.length} folders`)
        results.push({ ...result, status: 'ambiguous', foldersFound: folders.length }); continue
      }

      folderId = folders[0].id!
      console.log(`  ✓ Folder: ${folderId}`)
    }

    // ── 2. Scan folder — только файлы, все подпапки игнорируются ─────────
    let list: any
    try {
      list = await withRetry(() => drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
        fields: 'files(id, name, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 200,
      }))
    } catch (e: any) {
      console.log(`  ❌ Folder scan failed: ${e.message}`)
      results.push({ ...result, status: 'error', error: e.message }); continue
    }

    const files = list.data.files || []
    const photos = files.filter((f: any) => f.mimeType?.startsWith('image/'))
    const videos = files.filter((f: any) => f.mimeType?.startsWith('video/'))
    const anketa = files.find((f: any) => f.mimeType === 'application/vnd.google-apps.document')

    console.log(`  Photos: ${photos.length} | Videos: ${videos.length} | Anketa: ${anketa ? `"${anketa.name}"` : 'NO'}`)

    // ── 3. Parse anketa локально ──────────────────────────────────────────
    let fields: Record<string, any> = {}
    let noAnketa = false

    if (!anketa) {
      console.log(`  ⚠ No Google Doc found — model will be created without anketa data`)
      noAnketa = true
    } else {
      try {
        const exported = await withRetry(() =>
          drive.files.export(
            { fileId: anketa.id!, mimeType: 'text/plain' },
            { responseType: 'arraybuffer' }
          )
        )
        const text = Buffer.from(exported.data as ArrayBuffer).toString('utf-8').trim()
        console.log(`  Anketa text length: ${text.length} chars`)

        if (text.length < 50) {
          console.log(`  ⚠ Anketa too short (${text.length} chars) — skipping parse`)
          noAnketa = true
        } else {
          fields = await parseAnketa(text)
          const fieldCount = Object.keys(fields).length
          console.log(`  ✓ Anketa parsed — ${fieldCount} fields extracted`)
        }
      } catch (e: any) {
        console.log(`  ⚠ Anketa parse failed: ${e.message}`)
        noAnketa = true
      }
    }

    // ── 4. Create model via API ───────────────────────────────────────────
    let createData: any
    try {
      const createRes = await fetch(`${SITE_URL}/api/admin/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: authCookie },
        body: JSON.stringify({
          name: modelName,
          status: 'active',
          blackClients: true,
          ...fields,
        }),
      })
      createData = await createRes.json()
    } catch (e: any) {
      console.log(`  ❌ Create request failed: ${e.message}`)
      results.push({ ...result, status: 'error', error: e.message }); continue
    }

    if (!createData.success) {
      console.log(`  ❌ Create failed: ${createData.error}`)
      results.push({ ...result, status: 'error', error: createData.error }); continue
    }

    const { modelId, slug } = createData
    console.log(`  ✓ Model created: /companions/${slug} (${modelId})`)

    // ── 5. Upload photos напрямую в R2 ────────────────────────────────────
    if (photos.length > 0) {
      console.log(`  Uploading ${photos.length} photos to R2...`)
      let uploaded = 0
      for (let i = 0; i < photos.length; i++) {
        try {
          const dl = await withRetry(() =>
            drive.files.get(
              { fileId: photos[i].id!, alt: 'media' },
              { responseType: 'arraybuffer' }
            )
          )
          const buf = Buffer.from(dl.data as ArrayBuffer)
          const ok = await uploadPhoto(buf, modelId, i, i === 0, prisma, photos[i].mimeType)
          if (ok) {
            uploaded++
            result.photos++
            process.stdout.write('.')
          }
        } catch (e: any) {
          console.log(`\n  ⚠ Photo ${i} download failed: ${e.message}`)
        }
      }
      console.log(`\n  ✓ Photos: ${uploaded}/${photos.length} uploaded`)
    }

    // ── 6. Upload videos напрямую в R2 ────────────────────────────────────
    for (let i = 0; i < videos.length; i++) {
      try {
        console.log(`  Uploading video ${i + 1}/${videos.length}: ${videos[i].name}`)
        const dl = await withRetry(() =>
          drive.files.get(
            { fileId: videos[i].id!, alt: 'media' },
            { responseType: 'arraybuffer' }
          )
        )
        const buf = Buffer.from(dl.data as ArrayBuffer)
        const ext = (videos[i].name || 'video.mp4').split('.').pop() || 'mp4'
        const key = `models/${modelId}/video-${i}-${Date.now()}.${ext}`

        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET, Key: key, Body: buf,
          ContentType: videos[i].mimeType || 'video/mp4',
          CacheControl: 'public, max-age=31536000',
        }))

        await prisma.modelMedia.create({
          data: {
            modelId, type: 'video', storageKey: key,
            url: `${CDN_URL}/${key}`, isPrimary: false, isPublic: true,
            sortOrder: 1000 + i,
          }
        })

        result.videos++
        console.log(`  ✓ Video ${i + 1} uploaded`)
      } catch (e: any) {
        console.log(`  ⚠ Video ${i} failed: ${e.message}`)
      }
    }

    results.push({ ...result, slug, noAnketa })
    console.log(`  ✅ DONE: ${result.photos}📸 ${result.videos}🎬${noAnketa ? ' (no anketa)' : ''}`)
  }

  // ── REPORT ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55))
  console.log('IMPORT COMPLETE')
  console.log('═'.repeat(55))

  const ok = results.filter(r => r.status === 'ok')
  const notFound = results.filter(r => r.status === 'not_found')
  const errors = results.filter(r => r.status === 'error')
  const ambiguous = results.filter(r => r.status === 'ambiguous')

  console.log(`\n✅ Success: ${ok.length}`)
  for (const r of ok) {
    console.log(`   ${r.name.padEnd(20)} [${r.photos}📸 ${r.videos}🎬]${r.noAnketa ? ' ⚠ no anketa' : ''}  → /companions/${r.slug}`)
  }

  if (notFound.length > 0) {
    console.log(`\n❌ Not found in Drive (${notFound.length}):`)
    for (const r of notFound) console.log(`   ${r.name}`)
  }

  if (ambiguous.length > 0) {
    console.log(`\n❌ Ambiguous (${ambiguous.length}):`)
    for (const r of ambiguous) console.log(`   ${r.name} — ${r.foldersFound} folders`)
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`)
    for (const r of errors) console.log(`   ${r.name}: ${r.error}`)
  }

  console.log(`\nTotal: ${results.length} processed, ${ok.length} successful`)

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error('\nFATAL ERROR:', e)
  process.exit(1)
})
