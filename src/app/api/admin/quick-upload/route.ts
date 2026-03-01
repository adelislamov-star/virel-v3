// POST /api/admin/quick-upload
// Returns presigned R2 URLs for direct browser→R2 upload + saves media records after

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { getPresignedUploadUrl, buildKey, buildUrl } from '@/lib/storage/r2'
import { randomUUID } from 'crypto'

// GET presigned URLs for a batch of files
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // --- Phase 1: get presigned URLs ---
    if (body.action === 'presign') {
      const { modelId, files } = body
      // files: [{ name, mimeType, size }]
      const results = await Promise.all(
        files.map(async (f: { name: string; mimeType: string }) => {
          const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg'
          const fileId = randomUUID()
          const key = buildKey(modelId, `${fileId}.${ext}`)
          const url = await getPresignedUploadUrl(key, f.mimeType, 600)
          const finalUrl = buildUrl(key.replace(/\.[^.]+$/, '.webp'))
          return { key: key.replace(/\.[^.]+$/, '.webp'), presignedUrl: url, finalUrl, originalName: f.name }
        })
      )
      return NextResponse.json({ success: true, files: results })
    }

    // --- Phase 2: save media records after upload ---
    if (body.action === 'save_media') {
      const { modelId, photos } = body
      // photos: [{ key, finalUrl, sortOrder, isPrimary }]

      // Clear existing primary if needed
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
              url: p.finalUrl,
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
    console.error('quick-upload error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
