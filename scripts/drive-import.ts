/**
 * drive-import.ts — Google Drive → Vaurel model importer
 * Run: npm run drive-import
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.drive' })
dotenv.config({ path: '.env.production' })

process.env.DATABASE_URL = process.env.DATABASE_DIRECT_URL || process.env.DIRECT_URL || process.env.DATABASE_URL!

import { google } from 'googleapis'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import FormData from 'form-data'
import fetch from 'node-fetch'

// ─── СПИСОК МОДЕЛЕЙ ──────────────────────────────────────────────────────────
const MODEL_NAMES: string[] = [
  "Vega", "Zharra", "Derry", "Nahasia", "Ponita", "Vermonta",
  "Firmini", "Marsalina", "Gardenia", "Moire", "Nara", "Roderica",
  "Marzena", "Gamma", "Masyanna", "Pauletta", "Tetty", "Hanzelika",
  "Narzana", "Megrez", "Rahma", "Minilla", "Inciona", "Manori",
  "Copacabana", "Belva", "Milkyway", "Byrona", "Flokita", "Zambia",
  "Kameya", "Fenty", "Stimula", "Islay", "Generosa", "Triangle",
  "Kizomba", "Chasity", "Laonta", "Nitro", "Morava", "Dysis",
  "Rudolpha", "Trufana", "Erato", "Adjika", "Mikami", "Ferana",
  "Fadera", "Colenia", "Carmel", "Zion", "Juciara", "Kimberley",
  "Katarina", "Vaiga", "Culpa", "Adriana",
]

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SA_JSON        = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
const SITE_URL       = process.env.SITE_URL!
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const CDN_URL        = process.env.NEXT_PUBLIC_CDN_URL!
const R2_ACCOUNT_ID  = process.env.R2_ACCOUNT_ID!
const R2_BUCKET      = process.env.R2_BUCKET_NAME!
const R2_KEY         = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET      = process.env.R2_SECRET_ACCESS_KEY!
const DB_URL         = process.env.DATABASE_DIRECT_URL!

interface Result {
  name: string
  status: 'ok' | 'not_found' | 'ambiguous' | 'error'
  slug?: string
  photos: number
  videos: number
  noAnketa?: boolean
  error?: string
  foldersFound?: number
}

async function main() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  console.log('[AUTH] Logging in...')
  const loginRes = await fetch(`${SITE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!loginRes.ok) { console.error('[AUTH] Failed:', await loginRes.text()); process.exit(1) }
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const match = setCookie.match(/vaurel-token=([^;]+)/)
  if (!match) { console.error('[AUTH] No vaurel-token'); process.exit(1) }
  const authCookie = `vaurel-token=${match[1]}`
  console.log('[AUTH] OK')

  // ── Google Drive ──────────────────────────────────────────────────────────
  const auth = new google.auth.GoogleAuth({
    credentials: SA_JSON,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth })

  // ── R2 ────────────────────────────────────────────────────────────────────
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
  })

  // ── Prisma ────────────────────────────────────────────────────────────────
  let prisma: any = null
  try {
    process.env.DATABASE_URL = DB_URL
    const mod = require('../src/lib/db/client')
    prisma = mod.prisma
    console.log('[DB] Prisma connected')
  } catch (e: any) {
    console.warn('[DB] Prisma unavailable — videos not saved to DB:', e.message)
  }

  const results: Result[] = []

  for (const modelName of MODEL_NAMES) {
    console.log(`\n${'─'.repeat(50)}`)
    console.log(`[${modelName}] Starting`)
    const result: Result = { name: modelName, status: 'ok', photos: 0, videos: 0 }

    // Step 1: Find folder (поиск по всему Drive без parent filter)
    const searchRes = await drive.files.list({
      q: `name = '${modelName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    const folders = searchRes.data.files || []

    if (folders.length === 0) {
      console.log(`[${modelName}] ❌ NOT FOUND`)
      result.status = 'not_found'; results.push(result); continue
    }
    if (folders.length > 1) {
      console.log(`[${modelName}] ❌ AMBIGUOUS — ${folders.length} folders`)
      result.status = 'ambiguous'; result.foldersFound = folders.length; results.push(result); continue
    }

    const folderId = folders[0].id!
    console.log(`[${modelName}] ✓ Folder: ${folderId}`)

    // Step 2: Scan folder
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 200,
    })
    const files = listRes.data.files || []

    const photos = files.filter(f => f.mimeType?.startsWith('image/'))
    const videos = files.filter(f => f.mimeType?.startsWith('video/'))
    const anketa = files.find(f => f.mimeType === 'application/vnd.google-apps.document')
    // Папки (пересечка) — игнорируем

    console.log(`[${modelName}] Photos: ${photos.length}, Videos: ${videos.length}, Anketa: ${anketa ? 'YES' : 'NO'}`)
    if (photos.length === 0) console.warn(`[${modelName}] ⚠ No photos`)
    if (!anketa) { console.warn(`[${modelName}] ⚠ No anketa`); result.noAnketa = true }

    // Step 3: Parse anketa
    let fields: Record<string, any> = {}
    if (anketa) {
      try {
        const exported = await drive.files.export(
          { fileId: anketa.id!, mimeType: 'text/plain' },
          { responseType: 'arraybuffer' }
        )
        const buf = Buffer.from(exported.data as ArrayBuffer)
        const fd = new FormData()
        fd.append('file', buf, { filename: 'anketa.txt', contentType: 'text/plain' })
        const parseRes = await fetch(`${SITE_URL}/api/admin/parse-anketa`, {
          method: 'POST',
          headers: { Cookie: authCookie, ...fd.getHeaders() },
          body: fd as any,
        })
        const parsed = await parseRes.json() as any
        if (parsed.success && parsed.fields) {
          fields = parsed.fields
          console.log(`[${modelName}] ✓ Anketa parsed`)
        } else {
          console.warn(`[${modelName}] ⚠ Anketa parse error:`, parsed.error)
        }
      } catch (e: any) {
        console.warn(`[${modelName}] ⚠ Anketa parse failed:`, e.message)
      }
    }

    // Step 4: Create model
    const createRes = await fetch(`${SITE_URL}/api/admin/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ name: modelName, status: 'active', blackClients: true, ...fields }),
    })
    const created = await createRes.json() as any
    if (!created.success) {
      console.error(`[${modelName}] ❌ Create failed:`, created.error)
      result.status = 'error'; result.error = created.error; results.push(result); continue
    }
    const { modelId, slug } = created
    result.slug = slug
    console.log(`[${modelName}] ✓ Created: ${slug} (${modelId})`)

    // Step 5: Upload photos (батчи по 5)
    const BATCH = 5
    for (let start = 0; start < photos.length; start += BATCH) {
      const batch = photos.slice(start, start + BATCH)
      console.log(`[${modelName}] Uploading photos ${start + 1}–${start + batch.length}/${photos.length}...`)
      const fd = new FormData()
      fd.append('modelId', modelId)
      for (let i = 0; i < batch.length; i++) {
        const photo = batch[i]
        const dlRes = await drive.files.get(
          { fileId: photo.id!, alt: 'media' },
          { responseType: 'arraybuffer' }
        )
        const buf = Buffer.from(dlRes.data as ArrayBuffer)
        const globalIdx = start + i
        fd.append(`photo_${i}`, buf, { filename: photo.name || `photo_${globalIdx}.jpg`, contentType: photo.mimeType || 'image/jpeg' })
        fd.append(`sortOrder_${i}`, String(globalIdx))
        fd.append(`isPrimary_${i}`, globalIdx === 0 ? 'true' : 'false')
      }
      const upRes = await fetch(`${SITE_URL}/api/admin/quick-upload`, {
        method: 'POST',
        headers: { Cookie: authCookie, ...fd.getHeaders() },
        body: fd as any,
      })
      const upData = await upRes.json() as any
      if (upData.success) {
        result.photos += upData.count || 0
        console.log(`[${modelName}] ✓ Batch OK: ${upData.count} photos`)
      } else {
        console.warn(`[${modelName}] ⚠ Batch failed:`, upData.error)
      }
    }

    // Step 6: Upload videos → R2
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      console.log(`[${modelName}] Uploading video ${i + 1}/${videos.length}`)
      try {
        const dlRes = await drive.files.get(
          { fileId: video.id!, alt: 'media' },
          { responseType: 'arraybuffer' }
        )
        const buf = Buffer.from(dlRes.data as ArrayBuffer)
        const ext = (video.name || 'video.mp4').split('.').pop() || 'mp4'
        const key = `models/${modelId}/video-${i}-${Date.now()}.${ext}`
        await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: video.mimeType || 'video/mp4' }))
        console.log(`[${modelName}] ✓ Video → R2: ${key}`)
        if (prisma) {
          await prisma.modelMedia.create({
            data: { modelId, type: 'video', storageKey: key, url: `${CDN_URL}/${key}`, isPrimary: false, isPublic: true, sortOrder: 1000 + i }
          })
        }
        result.videos++
      } catch (e: any) {
        console.warn(`[${modelName}] ⚠ Video ${i} failed:`, e.message)
      }
    }

    results.push(result)
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55))
  console.log('  IMPORT COMPLETE')
  console.log('═'.repeat(55))
  for (const r of results) {
    if (r.status === 'ok') {
      console.log(`✅ ${r.name.padEnd(22)} ${SITE_URL}/companions/${r.slug} [${r.photos}📸 ${r.videos}🎬]${r.noAnketa ? ' ⚠ no anketa' : ''}`)
    } else if (r.status === 'not_found') {
      console.log(`❌ ${r.name.padEnd(22)} NOT FOUND`)
    } else if (r.status === 'ambiguous') {
      console.log(`❌ ${r.name.padEnd(22)} AMBIGUOUS (${r.foldersFound} folders)`)
    } else {
      console.log(`❌ ${r.name.padEnd(22)} ERROR: ${r.error}`)
    }
  }

  if (prisma) await prisma.$disconnect()
}

main().catch(async e => { console.error('Fatal:', e); process.exit(1) })
