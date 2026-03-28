// POST /api/admin/quick-upload
// Server-side photo upload with watermarking + WebP + thumbnails

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { uploadMedia, generateThumbnail, buildKey } from '@/lib/storage/r2'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    // --- Server-side upload via FormData ---
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const modelId = formData.get('modelId') as string
      if (!modelId) return NextResponse.json({ success: false, error: 'modelId required' }, { status: 400 })

      // Collect all photo files + metadata
      const files: File[] = []
      const sortOrders: number[] = []
      const isPrimaryFlags: boolean[] = []

      let i = 0
      while (formData.has(`photo_${i}`)) {
        const file = formData.get(`photo_${i}`) as File
        if (file) {
          files.push(file)
          sortOrders.push(Number(formData.get(`sortOrder_${i}`) || i))
          isPrimaryFlags.push(formData.get(`isPrimary_${i}`) === 'true')
        }
        i++
      }

      if (files.length === 0) {
        return NextResponse.json({ success: false, error: 'No photos provided' }, { status: 400 })
      }

      // Clear existing primary if any new photo is primary
      if (isPrimaryFlags.some(Boolean)) {
        await prisma.modelMedia.updateMany({
          where: { modelId },
          data: { isPrimary: false }
        })
      }

      let uploaded = 0
      const errors: string[] = []

      for (let j = 0; j < files.length; j++) {
        const file = files[j]
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const key = buildKey(modelId, `${j}-${Date.now()}.${ext}`)

        try {
          // Skip if a record with same modelId + sortOrder already exists
          const existing = await prisma.modelMedia.findFirst({
            where: { modelId, sortOrder: sortOrders[j] ?? j },
          })
          if (existing) {
            console.log(`[admin/quick-upload] Skipping photo ${j} — duplicate sortOrder ${sortOrders[j] ?? j} for model ${modelId}`)
            continue
          }

          const result = await uploadMedia(buffer, key, file.type || 'image/jpeg')
          await generateThumbnail(buffer, result.key)

          await prisma.modelMedia.create({
            data: {
              modelId,
              type: 'photo',
              storageKey: result.key,
              url: result.url,
              isPrimary: isPrimaryFlags[j] ?? false,
              isPublic: true,
              sortOrder: sortOrders[j] ?? j,
            }
          })
          uploaded++
        } catch (e: any) {
          console.error(`[admin/quick-upload] Photo ${j} upload failed:`, e.message)
          errors.push(`Photo ${j}: ${e.message}`)
        }
      }

      return NextResponse.json({
        success: uploaded > 0,
        count: uploaded,
        total: files.length,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // --- Legacy JSON actions (presign + save_media) ---
    const body = await req.json()

    if (body.action === 'save_media') {
      const { modelId, photos } = body
      if (photos.some((p: any) => p.isPrimary)) {
        await prisma.modelMedia.updateMany({
          where: { modelId },
          data: { isPrimary: false }
        })
      }
      let created = 0
      for (const p of photos) {
        const existing = await prisma.modelMedia.findFirst({
          where: { modelId, sortOrder: p.sortOrder },
        })
        if (existing) continue
        await prisma.modelMedia.create({
          data: {
            modelId,
            type: 'photo',
            storageKey: p.key,
            url: p.finalUrl,
            isPrimary: p.isPrimary ?? false,
            isPublic: true,
            sortOrder: p.sortOrder,
            checksum: null,
          }
        })
        created++
      }
      return NextResponse.json({ success: true, count: created })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('quick-upload error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
