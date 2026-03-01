'use client'
import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────
interface PhotoFile {
  file: File
  previewUrl: string   // local blob URL
  id: string
}

interface SortedPhoto extends PhotoFile {
  sortOrder: number
  isPrimary: boolean
  role: string         // 'cover' | 'full_body' | 'face' | 'detail' | 'other'
}

type Stage = 'drop' | 'preview' | 'uploading' | 'done' | 'error'

// ─── Helpers ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) }

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res((r.result as string).split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function parseAnketa(text: string): Record<string, any> {
  const lower = text.toLowerCase()
  const find = (keys: string[]) => {
    for (const key of keys) {
      const re = new RegExp(`${key}[:\\s]+([^\\n\\r,]+)`, 'i')
      const m = text.match(re)
      if (m) return m[1].trim()
    }
    return ''
  }

  return {
    name: find(['name', 'имя', 'working name', 'stage name']),
    age: find(['age', 'возраст', 'лет']),
    nationality: find(['nationality', 'национальность', 'country']),
    height: find(['height', 'рост', 'cm']),
    weight: find(['weight', 'вес', 'kg']),
    breastSize: find(['bust', 'breast', 'bra', 'грудь', 'размер груди']),
    dressSizeUK: find(['dress', 'size uk', 'uk size', 'одежда']),
    eyesColour: find(['eyes', 'глаза', 'eye colour', 'eye color']),
    hairColour: find(['hair', 'волосы', 'hair colour']),
    nationality: find(['nationality', 'country', 'страна', 'национальность']),
    languages: find(['languages', 'language', 'язык', 'speaks']),
    addressPostcode: find(['postcode', 'post code', 'zip', 'индекс']),
    tubeStation: find(['tube', 'station', 'метро', 'nearest']),
    rate1hIn: find(['1h incall', '1 hour incall', '1hr in', '60 min incall', '1 час incall']),
    rate1hOut: find(['1h outcall', '1 hour outcall', '1hr out', '60 min outcall', '1 час outcall']),
    notesInternal: text.slice(0, 500),
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function QuickUploadPage() {
  const [stage, setStage] = useState<Stage>('drop')
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [sortedPhotos, setSortedPhotos] = useState<SortedPhoto[]>([])
  const [anketaText, setAnketaText] = useState('')
  const [parsedForm, setParsedForm] = useState<Record<string, any>>({})
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [doneUrl, setDoneUrl] = useState('')
  const [aiSorting, setAiSorting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const log = (msg: string) => setProgress(p => [...p, msg])

  // ─── File ingestion ────────────────────────────────────────────────────────
  const ingestFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const imgFiles: PhotoFile[] = []
    let textContent = ''

    for (const f of files) {
      if (f.type.startsWith('image/')) {
        imgFiles.push({ file: f, previewUrl: URL.createObjectURL(f), id: uid() })
      } else if (f.type === 'text/plain' || f.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = e => {
          const t = e.target?.result as string
          setAnketaText(t)
          setParsedForm(parseAnketa(t))
        }
        reader.readAsText(f)
      }
    }

    if (imgFiles.length > 0) {
      setPhotos(imgFiles)
      setStage('preview')
      // Auto-sort with AI after a tick
      setTimeout(() => aiSort(imgFiles), 100)
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    ingestFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) ingestFiles(e.target.files)
    e.target.value = ''
  }

  // ─── AI Photo Sorting ─────────────────────────────────────────────────────
  const aiSort = async (photoFiles: PhotoFile[]) => {
    setAiSorting(true)
    try {
      // Use up to 12 photos for AI analysis (keep it fast)
      const sample = photoFiles.slice(0, 12)
      const imageBlocks = await Promise.all(
        sample.map(async (p, i) => {
          const b64 = await fileToBase64(p.file)
          const mime = p.file.type || 'image/jpeg'
          return [
            { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } },
            { type: 'text', text: `Photo index: ${i}` }
          ]
        })
      )

      const prompt = `You are sorting escort profile photos for a luxury agency website.
      
Analyze these ${sample.length} photos (indexed 0-${sample.length - 1}) and return optimal carousel order.

Rules for ordering:
1. COVER (position 0): Best full-body or 3/4 shot, good lighting, most flattering. This is the profile thumbnail.
2. FULL_BODY: Standing full body shots
3. FACE: Close-up face / portrait shots  
4. DETAIL: Lingerie, partial body, artistic shots
5. OTHER: Any remaining

Return ONLY a JSON array of objects, no explanation:
[{"index": 0, "role": "cover"}, {"index": 2, "role": "full_body"}, ...]

Order: cover first, then full_body, then face, then detail, then other.
Include ALL ${sample.length} photos in the result.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [...imageBlocks.flat(), { type: 'text', text: prompt }]
          }]
        })
      })

      const data = await res.json()
      const text = (data.content?.[0]?.text || '[]').replace(/```json|```/g, '').trim()
      const aiOrder: { index: number; role: string }[] = JSON.parse(text)

      // Build sorted list (AI-analyzed photos first, then any extras)
      const sortedSample: SortedPhoto[] = aiOrder.map((item, sortOrder) => ({
        ...photoFiles[item.index],
        sortOrder,
        isPrimary: sortOrder === 0,
        role: item.role,
      }))

      // Add remaining photos (if more than 12) at the end
      const extraPhotos = photoFiles.slice(12).map((p, i) => ({
        ...p,
        sortOrder: sortedSample.length + i,
        isPrimary: false,
        role: 'other',
      }))

      setSortedPhotos([...sortedSample, ...extraPhotos])
    } catch (e) {
      // Fallback: keep original order, first = primary
      setSortedPhotos(photoFiles.map((p, i) => ({
        ...p, sortOrder: i, isPrimary: i === 0, role: i === 0 ? 'cover' : 'other'
      })))
    } finally {
      setAiSorting(false)
    }
  }

  // ─── Upload & Create ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!parsedForm.name && !anketaText) {
      alert('Please add a text file with the model name at minimum')
      return
    }

    setStage('uploading')
    setProgress([])

    try {
      // 1. Create model profile
      log('📝 Creating profile...')
      const modelRes = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsedForm,
          name: parsedForm.name || 'New Model',
        })
      })
      const modelData = await modelRes.json()
      if (!modelData.success) throw new Error(modelData.error || 'Failed to create model')
      const modelId = modelData.modelId
      log(`✅ Profile created — ID: ${modelId}`)

      // 2. Get presigned URLs for all photos
      if (sortedPhotos.length > 0) {
        log(`🔗 Getting upload URLs for ${sortedPhotos.length} photos...`)
        const presignRes = await fetch('/api/admin/quick-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'presign',
            modelId,
            files: sortedPhotos.map(p => ({ name: p.file.name, mimeType: p.file.type || 'image/jpeg' }))
          })
        })
        const presignData = await presignRes.json()
        if (!presignData.success) throw new Error('Failed to get upload URLs')
        log(`✅ Got ${presignData.files.length} upload URLs`)

        // 3. Upload all photos in parallel
        log(`📤 Uploading ${sortedPhotos.length} photos in parallel...`)
        const uploadResults = await Promise.allSettled(
          sortedPhotos.map(async (photo, i) => {
            const { presignedUrl, key, finalUrl } = presignData.files[i]
            const buf = await photo.file.arrayBuffer()
            const uploadRes = await fetch(presignedUrl, {
              method: 'PUT',
              body: buf,
              headers: { 'Content-Type': photo.file.type || 'image/jpeg' }
            })
            if (!uploadRes.ok) throw new Error(`Upload failed: ${photo.file.name}`)
            return { key, finalUrl, sortOrder: photo.sortOrder, isPrimary: photo.isPrimary }
          })
        )

        const succeeded = uploadResults
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value)
        const failed = uploadResults.filter(r => r.status === 'rejected').length

        log(`✅ Uploaded ${succeeded.length} photos${failed > 0 ? ` (${failed} failed)` : ''}`)

        // 4. Save media records
        log('💾 Saving media records...')
        await fetch('/api/admin/quick-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_media', modelId, photos: succeeded })
        })
        log('✅ Media saved')
      }

      log('🎉 Done!')
      setDoneUrl(`/admin/models/${modelId}`)
      setStage('done')
    } catch (e: any) {
      log(`❌ Error: ${e.message}`)
      setStage('error')
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 960, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/models" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Models</Link>
        <span style={{ color: '#888' }}>/</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚡ Quick Upload</h1>
        <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
          2 clicks
        </span>
      </div>

      {/* ── STAGE: DROP ──────────────────────────────────────────────────── */}
      {(stage === 'drop' || stage === 'preview') && (
        <>
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`,
              borderRadius: 16,
              padding: '48px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#f5f3ff' : '#fafafa',
              transition: 'all .15s',
              marginBottom: 24,
            }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*,.txt,text/plain" onChange={handleFileInput} style={{ display: 'none' }} />
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {photos.length > 0 ? '🖼️' : '📁'}
            </div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 16 }}>
              {photos.length > 0
                ? `${photos.length} photo${photos.length > 1 ? 's' : ''} loaded${anketaText ? ' + anketa ✅' : ''}`
                : 'Drop photos + text file here'}
            </p>
            <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
              {photos.length > 0
                ? 'Drop more files or click to add'
                : 'Drag & drop all photos and .txt anketa at once · or click to browse'}
            </p>
          </div>

          {/* Preview + AI sort result */}
          {stage === 'preview' && sortedPhotos.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                  📸 Photo order
                </p>
                {aiSorting
                  ? <span style={{ fontSize: 12, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 99 }}>✨ AI sorting...</span>
                  : <span style={{ fontSize: 12, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 99 }}>✅ AI sorted</span>
                }
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {sortedPhotos.map((p, i) => (
                  <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '3/4', background: '#f1f5f9' }}>
                    <img src={p.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {/* Order badge */}
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      background: p.isPrimary ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 6,
                    }}>
                      {p.isPrimary ? '★' : i + 1}
                    </div>
                    {/* Role badge */}
                    {!aiSorting && (
                      <div style={{
                        position: 'absolute', bottom: 4, left: 4, right: 4,
                        background: 'rgba(0,0,0,0.55)', color: '#fff',
                        fontSize: 10, textAlign: 'center', borderRadius: 4, padding: '2px 0',
                      }}>
                        {p.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed anketa preview */}
          {Object.keys(parsedForm).some(k => parsedForm[k]) && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 13 }}>📋 Parsed from anketa</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
                {Object.entries(parsedForm)
                  .filter(([k, v]) => v && typeof v === 'string' && v.length > 0 && !['notesInternal'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12 }}>
                      <span style={{ color: '#888' }}>{k}:</span>{' '}
                      <span style={{ fontWeight: 500 }}>{String(v).slice(0, 40)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Manual name input if not parsed */}
          {!parsedForm.name && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Model name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                value={parsedForm.name || ''}
                onChange={e => setParsedForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Enter name..."
                style={{ width: 280, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
              />
            </div>
          )}

          {/* CREATE BUTTON */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleCreate}
              disabled={(!parsedForm.name) || aiSorting}
              style={{
                background: parsedForm.name && !aiSorting ? '#6366f1' : '#e2e8f0',
                color: parsedForm.name && !aiSorting ? '#fff' : '#999',
                border: 'none', borderRadius: 10, padding: '12px 28px',
                fontSize: 15, fontWeight: 700, cursor: parsedForm.name && !aiSorting ? 'pointer' : 'default',
                transition: 'background .15s',
              }}
            >
              {aiSorting ? '✨ AI sorting photos...' : `⚡ Create Profile${sortedPhotos.length > 0 ? ` + Upload ${sortedPhotos.length} Photos` : ''}`}
            </button>
            {photos.length === 0 && (
              <span style={{ fontSize: 12, color: '#888' }}>Add photos for best results</span>
            )}
          </div>
        </>
      )}

      {/* ── STAGE: UPLOADING ─────────────────────────────────────────────── */}
      {stage === 'uploading' && (
        <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>⚡</div>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 17, marginBottom: 24 }}>Creating profile...</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {progress.map((msg, i) => (
              <div key={i} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{msg}</span>
              </div>
            ))}
          </div>
          {/* Progress bar based on steps */}
          <div style={{ marginTop: 24, height: 4, background: '#e2e8f0', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2, background: '#6366f1',
              width: `${Math.min((progress.length / 6) * 100, 95)}%`,
              transition: 'width .3s',
            }} />
          </div>
        </div>
      )}

      {/* ── STAGE: DONE ──────────────────────────────────────────────────── */}
      {stage === 'done' && (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Profile Created!</h2>
          <p style={{ color: '#888', marginBottom: 32, fontSize: 15 }}>
            {sortedPhotos.length} photos uploaded and sorted automatically
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a
              href={doneUrl}
              style={{
                background: '#6366f1', color: '#fff', textDecoration: 'none',
                padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15,
              }}
            >
              View Profile →
            </a>
            <button
              onClick={() => { setStage('drop'); setPhotos([]); setSortedPhotos([]); setAnketaText(''); setParsedForm({}); setProgress([]) }}
              style={{ border: '1px solid #e2e8f0', background: '#fff', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}
            >
              Add Another
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: ERROR ─────────────────────────────────────────────────── */}
      {stage === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 24 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>❌ Something went wrong</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {progress.map((msg, i) => <p key={i} style={{ margin: 0, fontSize: 13 }}>{msg}</p>)}
          </div>
          <button
            onClick={() => setStage('preview')}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
