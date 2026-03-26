// POST /api/admin/drive-import
// Imports models from Google Drive by folder name
// Finds folder → reads contents → passes through existing quick-upload pipeline

import { NextRequest, NextResponse } from 'next/server'
import { findModelFolder, downloadFile, exportDocAsText } from '@/lib/google-drive'
import { requireRole, isActor } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ['OWNER', 'OPS_MANAGER'])
    if (!isActor(auth)) return auth

    const body = await req.json()
    const names: string[] = body.names

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json({ error: 'names array is required' }, { status: 400 })
    }

    const results: Record<string, any> = {}

    for (const name of names) {
      console.log(`[drive-import] Processing: "${name}"`)

      // ── Step 1: Find folder on Drive ──
      const scan = await findModelFolder(name)

      if (scan.status === 'notFound') {
        console.log(`[drive-import] "${name}" — folder not found`)
        results[name] = { status: 'notFound', message: 'Folder not found on Google Drive' }
        continue
      }

      if (scan.status === 'ambiguous') {
        console.log(`[drive-import] "${name}" — ${scan.folders.length} ambiguous folders`)
        results[name] = {
          status: 'ambiguous',
          message: `Found ${scan.folders.length} folders with similar names — manual check required`,
          folders: scan.folders.map(f => f.name),
        }
        continue
      }

      if (scan.status === 'error') {
        console.log(`[drive-import] "${name}" — scan error: ${scan.message}`)
        results[name] = { status: 'error', message: scan.message }
        continue
      }

      // ── Step 2: We have the folder ──
      const { contents } = scan
      console.log(`[drive-import] "${name}" — found: ${contents.photos.length} photos, ${contents.videos.length} videos, questionnaire: ${!!contents.questionnaire}`)

      const warnings: string[] = []
      if (contents.photos.length === 0) warnings.push('No photos found in folder')
      if (!contents.questionnaire) warnings.push('No questionnaire (Google Doc) found in folder')
      if (contents.ignoredFolders.length > 0) warnings.push(`Ignored sub-folders: ${contents.ignoredFolders.join(', ')}`)

      // ── Step 3: Download photos (max 10) ──
      const photoBuffers: { buffer: Buffer; name: string; mimeType: string }[] = []
      const photosToDownload = contents.photos.slice(0, 10)

      for (const photo of photosToDownload) {
        try {
          console.log(`[drive-import] Downloading photo: ${photo.name}`)
          const buffer = await downloadFile(photo.id, photo.mimeType)
          photoBuffers.push({ buffer, name: photo.name, mimeType: photo.mimeType })
        } catch (e: any) {
          console.error(`[drive-import] Failed to download photo ${photo.name}:`, e.message)
          warnings.push(`Failed to download photo: ${photo.name}`)
        }
      }

      if (contents.photos.length > 10) {
        warnings.push(`Only first 10 of ${contents.photos.length} photos downloaded`)
      }

      // ── Step 4: Read questionnaire ──
      let questionnaireText = ''
      if (contents.questionnaire) {
        try {
          console.log(`[drive-import] Reading questionnaire: ${contents.questionnaire.name}`)
          questionnaireText = await exportDocAsText(contents.questionnaire.id)
          console.log(`[drive-import] Questionnaire text length: ${questionnaireText.length} chars`)
        } catch (e: any) {
          console.error(`[drive-import] Failed to read questionnaire:`, e.message)
          warnings.push(`Failed to read questionnaire: ${e.message}`)
        }
      }

      // ── Step 5: Build FormData and call quick-upload ──
      console.log(`[drive-import] Calling quick-upload for "${name}"...`)

      const formData = new FormData()

      // Add photos as File objects
      for (const photo of photoBuffers) {
        const blob = new Blob([photo.buffer], { type: photo.mimeType })
        const file = new File([blob], photo.name, { type: photo.mimeType })
        formData.append('files', file)
      }

      // Add questionnaire text as .txt file (quick-upload reads it as document)
      if (questionnaireText.trim()) {
        const textBlob = new Blob([questionnaireText], { type: 'text/plain' })
        const textFile = new File([textBlob], 'questionnaire.txt', { type: 'text/plain' })
        formData.append('files', textFile)
      } else {
        // No questionnaire — send just the name so quick-upload can create the model
        const nameBlob = new Blob([`Name: ${name}`], { type: 'text/plain' })
        const nameFile = new File([nameBlob], 'profile.txt', { type: 'text/plain' })
        formData.append('files', nameFile)
      }

      // Call quick-upload internally
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

      const uploadRes = await fetch(`${baseUrl}/api/v1/models/quick-upload`, {
        method: 'POST',
        headers: { cookie: req.headers.get('cookie') || '' },
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (uploadRes.status === 409 && uploadData.duplicate) {
        results[name] = {
          status: 'duplicate',
          message: `Model already exists: ${uploadData.existing?.name}`,
          existingId: uploadData.existing?.id,
          warnings,
        }
        continue
      }

      if (!uploadData.success) {
        results[name] = {
          status: 'error',
          message: uploadData.error || 'Quick upload failed',
          warnings,
        }
        continue
      }

      console.log(`[drive-import] "${name}" — done! modelId: ${uploadData.modelId}`)

      results[name] = {
        status: 'success',
        modelId: uploadData.modelId,
        slug: uploadData.slug,
        photos: uploadData.uploadedPhotos || 0,
        services: uploadData.summary?.services || 0,
        rates: uploadData.summary?.rates || 0,
        hasQuestionnaire: !!contents.questionnaire,
        driveFolder: contents.folderName,
        warnings,
        redirectTo: uploadData.redirectTo,
      }
    }

    // Summary
    const summary = {
      total: names.length,
      success: Object.values(results).filter((r: any) => r.status === 'success').length,
      notFound: Object.values(results).filter((r: any) => r.status === 'notFound').length,
      ambiguous: Object.values(results).filter((r: any) => r.status === 'ambiguous').length,
      duplicate: Object.values(results).filter((r: any) => r.status === 'duplicate').length,
      error: Object.values(results).filter((r: any) => r.status === 'error').length,
    }

    return NextResponse.json({ success: true, summary, results })
  } catch (e: any) {
    console.error('[drive-import] Fatal error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
