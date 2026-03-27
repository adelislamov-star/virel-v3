/**
 * drive-import.ts
 * Фото и видео загружаются напрямую в R2 — никакого Vercel
 * Anketa парсится через /api/admin/parse-anketa на сайте
 * Модель создаётся через /api/admin/models
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
import sharp from 'sharp'

// ─── СПИСОК ───────────────────────────────────────────────────────────────────
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
const SA_JSON       = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
const SITE_URL      = process.env.SITE_URL!
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const CDN_URL       = process.env.NEXT_PUBLIC_CDN_URL!
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_BUCKET     = process.env.R2_BUCKET_NAME!
const R2_KEY        = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET     = process.env.R2_SECRET_ACCESS_KEY!
const DB_URL        = process.env.DATABASE_DIRECT_URL || process.env.DIRECT_URL!

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

// ─── R2 CLIENT ────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
})

// Загрузить фото в R2: watermark + WebP + thumbnail (копия логики r2.ts)
async function uploadPhoto(rawBuffer: Buffer, modelId: string, index: number, isPrimary: boolean, prisma: any) {
  try {
    // Watermark
    const meta = await sharp(rawBuffer).metadata()
    const w = meta.width ?? 800
    const h = meta.height ?? 1200
    const fontSize = Math.max(Math.round(w * 0.07), 28)
    const letterSpacing = Math.round(fontSize * 0.3)
    const svg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <style>.wm{font-family:Georgia,serif;font-size:${fontSize}px;font-weight:bold;fill:white;fill-opacity:0.35;letter-spacing:${letterSpacing}px;}</style>
      <text class="wm" x="50%" y="${h - Math.round(h * 0.06)}" text-anchor="middle" dominant-baseline="middle">VAUREL</text>
    </svg>`)

    const watermarked = await sharp(rawBuffer).composite([{ input: svg, top: 0, left: 0 }]).toBuffer()

    // Main photo — resize + WebP
    const processed = await sharp(watermarked)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const key = `models/${modelId}/photo-${index}-${Date.now()}.webp`
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, Body: processed,
      ContentType: 'image/webp', CacheControl: 'public, max-age=31536000',
    }))

    // Thumbnail
    const thumb = await sharp(watermarked)
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
        modelId,
        type: 'photo',
        storageKey: key,
        url: `${CDN_URL}/${key}`,
        isPrimary,
        isPublic: true,
        sortOrder: index,
      }
    })

    return true
  } catch (e: any) {
    console.error(`  Photo ${index} failed:`, e.message)
    return false
  }
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
  const cookie = (loginRes.headers.get('set-cookie') || '').match(/vaurel-token=([^;]+)/)?.[1]
  if (!cookie) { console.error('[AUTH] No token'); process.exit(1) }
  const authCookie = `vaurel-token=${cookie}`
  console.log('[AUTH] OK\n')

  // ── Drive ─────────────────────────────────────────────────────────────────
  const driveAuth = new google.auth.GoogleAuth({
    credentials: SA_JSON,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  const drive = google.drive({ version: 'v3', auth: driveAuth })

  // ── Prisma ────────────────────────────────────────────────────────────────
  process.env.DATABASE_URL = DB_URL
  const { prisma } = require('../src/lib/db/client')

  const results: Result[] = []

  for (const modelName of MODEL_NAMES) {
    console.log(`${'─'.repeat(50)}`)
    console.log(`[${modelName}]`)
    const result: Result = { name: modelName, status: 'ok', photos: 0, videos: 0 }

    // 1. Find folder
    const search = await drive.files.list({
      q: `name = '${modelName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    const folders = search.data.files || []

    if (folders.length === 0) {
      console.log(`  ❌ NOT FOUND in Drive`)
      result.status = 'not_found'; results.push(result); continue
    }
    if (folders.length > 1) {
      console.log(`  ❌ AMBIGUOUS — ${folders.length} folders`)
      result.status = 'ambiguous'; result.foldersFound = folders.length; results.push(result); continue
    }

    const folderId = folders[0].id!
    console.log(`  ✓ Folder found`)

    // 2. Scan folder (ignore subfolders — пересечка)
    const list = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 200,
    })
    const files = list.data.files || []
    const photos = files.filter(f => f.mimeType?.startsWith('image/'))
    const videos = files.filter(f => f.mimeType?.startsWith('video/'))
    const anketa = files.find(f => f.mimeType === 'application/vnd.google-apps.document')

    console.log(`  Photos: ${photos.length} | Videos: ${videos.length} | Anketa: ${anketa ? 'YES' : 'NO'}`)
    if (!anketa) { result.noAnketa = true; console.log(`  ⚠ No anketa`) }

    // 3. Parse anketa
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
        const res = await fetch(`${SITE_URL}/api/admin/parse-anketa`, {
          method: 'POST',
          headers: { Cookie: authCookie, ...fd.getHeaders() },
          body: fd as any,
        })
        const json = await res.json() as any
        if (json.success && json.fields) {
          fields = json.fields
          console.log(`  ✓ Anketa parsed`)
        } else {
          console.log(`  ⚠ Anketa parse error: ${json.error}`)
        }
      } catch (e: any) {
        console.log(`  ⚠ Anketa parse failed: ${e.message}`)
      }
    }

    // 4. Create model via API
    const createRes = await fetch(`${SITE_URL}/api/admin/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ name: modelName, status: 'active', blackClients: true, ...fields }),
    })
    const created = await createRes.json() as any
    if (!created.success) {
      console.log(`  ❌ Create failed: ${created.error}`)
      result.status = 'error'; result.error = created.error; results.push(result); continue
    }
    const { modelId, slug } = created
    result.slug = slug
    console.log(`  ✓ Model created: /companions/${slug}`)

    // 5. Upload photos → R2 directly
    console.log(`  Uploading ${photos.length} photos...`)
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      try {
        const dl = await drive.files.get(
          { fileId: photo.id!, alt: 'media' },
          { responseType: 'arraybuffer' }
        )
        const buf = Buffer.from(dl.data as ArrayBuffer)
        const ok = await uploadPhoto(buf, modelId, i, i === 0, prisma)
        if (ok) { result.photos++; process.stdout.write('.') }
      } catch (e: any) {
        console.log(`\n  ⚠ Photo ${i} download failed: ${e.message}`)
      }
    }
    if (photos.length > 0) console.log()

    // 6. Upload videos → R2 directly
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      try {
        const dl = await drive.files.get(
          { fileId: video.id!, alt: 'media' },
          { responseType: 'arraybuffer' }
        )
        const buf = Buffer.from(dl.data as ArrayBuffer)
        const ext = (video.name || 'video.mp4').split('.').pop() || 'mp4'
        const key = `models/${modelId}/video-${i}-${Date.now()}.${ext}`
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET, Key: key, Body: buf,
          ContentType: video.mimeType || 'video/mp4',
          CacheControl: 'public, max-age=31536000',
        }))
        await prisma.modelMedia.create({
          data: { modelId, type: 'video', storageKey: key, url: `${CDN_URL}/${key}`, isPrimary: false, isPublic: true, sortOrder: 1000 + i }
        })
        result.videos++
        console.log(`  ✓ Video ${i + 1} uploaded`)
      } catch (e: any) {
        console.log(`  ⚠ Video ${i} failed: ${e.message}`)
      }
    }

    results.push(result)
    console.log(`  ✅ Done: ${result.photos} photos, ${result.videos} videos`)
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55))
  console.log('IMPORT COMPLETE')
  console.log('═'.repeat(55))
  for (const r of results) {
    if (r.status === 'ok') {
      console.log(`✅ ${r.name.padEnd(20)} [${r.photos}📸 ${r.videos}🎬]${r.noAnketa ? ' ⚠ no anketa' : ''}`)
    } else if (r.status === 'not_found') {
      console.log(`❌ ${r.name.padEnd(20)} NOT FOUND`)
    } else if (r.status === 'ambiguous') {
      console.log(`❌ ${r.name.padEnd(20)} AMBIGUOUS (${r.foldersFound})`)
    } else {
      console.log(`❌ ${r.name.padEnd(20)} ERROR: ${r.error}`)
    }
  }

  await prisma.$disconnect()
}

main().catch(async e => { console.error('Fatal:', e); process.exit(1) })
