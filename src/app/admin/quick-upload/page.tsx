'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

interface PhotoFile { file: File; previewUrl: string; id: string }
interface SortedPhoto extends PhotoFile { sortOrder: number; isPrimary: boolean; role: string }
type Stage = 'drop' | 'preview' | 'uploading' | 'done' | 'error'

function uid() { return Math.random().toString(36).slice(2) }

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res((r.result as string).split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function isAnketaFile(f: File) {
  return (
    f.type === 'text/plain' ||
    f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    f.type === 'application/vnd.ms-excel' ||
    f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    f.type === 'text/csv' ||
    f.name.endsWith('.txt') ||
    f.name.endsWith('.docx') ||
    f.name.endsWith('.xlsx') ||
    f.name.endsWith('.xls') ||
    f.name.endsWith('.csv')
  )
}

async function parseAnketaWithAI(file: File): Promise<Record<string, any>> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/admin/parse-anketa', { method: 'POST', body: formData })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Parse failed')
  return data.fields
}

export default function QuickUploadPage() {
  const [stage, setStage] = useState<Stage>('drop')
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [sortedPhotos, setSortedPhotos] = useState<SortedPhoto[]>([])
  const [anketaText, setAnketaText] = useState('')
  const [parsedForm, setParsedForm] = useState<Record<string, any>>({})
  const [manualName, setManualName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [doneUrl, setDoneUrl] = useState('')
  const [aiSorting, setAiSorting] = useState(false)
  const [aiParsing, setAiParsing] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const log = (msg: string) => setProgress(p => [...p, msg])

  // ── Ingest files (await text reading) ─────────────────────────────────────
  const ingestFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const imgFiles: PhotoFile[] = []

    // Read all files in parallel
    await Promise.all(files.map(async f => {
      if (f.type.startsWith('image/')) {
        imgFiles.push({ file: f, previewUrl: URL.createObjectURL(f), id: uid() })
      } else if (isAnketaFile(f)) {
        try {
          setAnketaText(f.name)
          setAiParsing(true)
          setStage('preview')
          const parsed = await parseAnketaWithAI(f)
          setParsedForm(parsed)
          if (parsed.name) setManualName(parsed.name)
          setAiParsing(false)
        } catch { setAiParsing(false) }
      }
    }))

    if (imgFiles.length > 0) {
      setPhotos(imgFiles)
      setStage('preview')
      doAiSort(imgFiles)
    } else if (anketaText || Object.keys(parsedForm).length > 0) {
      // Only text, no photos — still go to preview
      setStage('preview')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    ingestFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) ingestFiles(e.target.files)
    e.target.value = ''
  }

  // ── AI Sort ────────────────────────────────────────────────────────────────
  const doAiSort = async (photoFiles: PhotoFile[]) => {
    setAiSorting(true)
    try {
      const sample = photoFiles.slice(0, 12)
      const photos = await Promise.all(
        sample.map(async (p, i) => ({
          index: i,
          data: await fileToBase64(p.file),
          mediaType: p.file.type || 'image/jpeg'
        }))
      )
      const res = await fetch('/api/admin/sort-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      const aiOrder: { index: number; role: string }[] = data.order
      const sorted: SortedPhoto[] = aiOrder.map((item, i) => ({ ...photoFiles[item.index], sortOrder: i, isPrimary: i === 0, role: item.role }))
      const extras = photoFiles.slice(12).map((p, i) => ({ ...p, sortOrder: sorted.length + i, isPrimary: false, role: 'other' }))
      setSortedPhotos([...sorted, ...extras])
    } catch {
      setSortedPhotos(photoFiles.map((p, i) => ({ ...p, sortOrder: i, isPrimary: i === 0, role: i === 0 ? 'cover' : 'other' })))
    } finally {
      setAiSorting(false)
    }
  }

  // ── Create profile ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const finalName = manualName.trim()
    if (!finalName) { alert('Enter model name'); return }

    setStage('uploading')
    setProgress([])

    try {
      log('📝 Creating profile...')
      const modelRes = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsedForm, name: finalName })
      })
      const modelData = await modelRes.json()
      if (!modelData.success) throw new Error(modelData.error || 'Failed to create model')
      const modelId = modelData.modelId
      log(`✅ Profile created`)

      if (sortedPhotos.length > 0) {
        log(`🔗 Getting upload URLs...`)
        const presignRes = await fetch('/api/admin/quick-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'presign', modelId, files: sortedPhotos.map(p => ({ name: p.file.name, mimeType: p.file.type || 'image/jpeg' })) })
        })
        const presignData = await presignRes.json()
        if (!presignData.success) throw new Error('Failed to get upload URLs')

        log(`📤 Uploading ${sortedPhotos.length} photos in parallel...`)
        const results = await Promise.allSettled(
          sortedPhotos.map(async (photo, i) => {
            const { presignedUrl, key, finalUrl } = presignData.files[i]
            await fetch(presignedUrl, { method: 'PUT', body: await photo.file.arrayBuffer(), headers: { 'Content-Type': photo.file.type || 'image/jpeg' } })
            return { key, finalUrl, sortOrder: photo.sortOrder, isPrimary: photo.isPrimary }
          })
        )
        const succeeded = results.filter(r => r.status === 'fulfilled').map(r => (r as any).value)
        const failed = results.filter(r => r.status === 'rejected').length
        log(`✅ Uploaded ${succeeded.length} photos${failed > 0 ? ` (${failed} failed)` : ''}`)

        log('💾 Saving media...')
        await fetch('/api/admin/quick-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_media', modelId, photos: succeeded })
        })
      }

      log('🎉 Done!')
      setDoneUrl(`/admin/models/${modelId}`)
      setStage('done')
    } catch (e: any) {
      log(`❌ ${e.message}`)
      setStage('error')
    }
  }

  const canCreate = manualName.trim().length > 0 && !aiSorting

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 960, fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/models" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Models</Link>
        <span style={{ color: '#888' }}>/</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚡ Quick Upload</h1>
      </div>

      {/* ── DROP / PREVIEW ─────────────────────────────────────────────── */}
      {(stage === 'drop' || stage === 'preview') && (
        <>
          {/* Drop zone — NOT clickable when in preview to avoid blocking inputs */}
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            style={{
              border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`,
              borderRadius: 16, padding: '32px', textAlign: 'center',
              background: dragOver ? '#2a2a4a' : '#1a1a2e',
              transition: 'all .15s', marginBottom: 20,
              cursor: stage === 'drop' ? 'pointer' : 'default',
            }}
            onClick={() => stage === 'drop' && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*,.txt,.docx,.xlsx,.xls,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
            <div style={{ fontSize: 40, marginBottom: 8 }}>{photos.length > 0 ? '🖼️' : '📁'}</div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 15 }}>
              {photos.length > 0
                ? `${photos.length} photos${anketaText ? ' + anketa ✅' : ' (no anketa)'}`
                : 'Drop photos + anketa (.txt, .docx, .xlsx) here'}
            </p>
            <p style={{ margin: 0, color: '#888', fontSize: 12 }}>
              {stage === 'drop' ? 'Click or drag & drop' : ''}
              {stage === 'preview' && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                  style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#555' }}
                >
                  + Add more files
                </button>
              )}
            </p>
          </div>

          {/* Photo grid */}
          {sortedPhotos.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Photos</span>
                {aiSorting
                  ? <span style={{ fontSize: 11, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 99 }}>✨ AI sorting...</span>
                  : <span style={{ fontSize: 11, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 99 }}>✅ Sorted</span>
                }
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                {sortedPhotos.map((p, i) => (
                  <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '3/4', background: '#f1f5f9' }}>
                    <img src={p.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 4, left: 4, background: p.isPrimary ? '#f59e0b' : 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 5 }}>
                      {p.isPrimary ? '★' : i + 1}
                    </div>
                    {!aiSorting && (
                      <div style={{ position: 'absolute', bottom: 3, left: 3, right: 3, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, textAlign: 'center', borderRadius: 3, padding: '1px 0' }}>
                        {p.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anketa parsed preview */}
          {aiParsing && (
            <div style={{ background: '#1a1a2e', border: '1px solid #6366f1', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>✨ AI reading anketa...</p>
            </div>
          )}
          {!aiParsing && Object.values(parsedForm).some(v => v && typeof v === 'string' && v.length > 0) && (
            <div style={{ background: '#1a2e1a', border: '1px solid #166534', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 12, color: '#4ade80' }}>✅ Parsed from anketa</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4 }}>
                {Object.entries(parsedForm)
                  .filter(([k, v]) => v && typeof v === 'string' && v.length > 0 && k !== 'notesInternal')
                  .map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11 }}>
                      <span style={{ color: '#6b7280' }}>{k}: </span>
                      <span style={{ fontWeight: 500 }}>{String(v).slice(0, 35)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Name field — always visible, always interactive */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Model name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              placeholder="Enter name..."
              autoComplete="off"
              style={{
                width: 300, border: '2px solid #6366f1', borderRadius: 8,
                padding: '10px 14px', fontSize: 15, fontWeight: 500,
                outline: 'none', background: '#1e1e2e', display: 'block',
                color: '#fff',
              }}
            />
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              background: canCreate ? '#6366f1' : '#e5e7eb',
              color: canCreate ? '#fff' : '#9ca3af',
              border: 'none', borderRadius: 10, padding: '13px 32px',
              fontSize: 15, fontWeight: 700,
              cursor: canCreate ? 'pointer' : 'default',
              transition: 'background .15s',
            }}
          >
            {aiSorting
              ? '✨ AI sorting...'
              : `⚡ Create Profile${sortedPhotos.length > 0 ? ` + ${sortedPhotos.length} Photos` : ''}`}
          </button>
        </>
      )}

      {/* ── UPLOADING ─────────────────────────────────────────────────── */}
      {stage === 'uploading' && (
        <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 16, padding: 32 }}>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, marginBottom: 24, color: '#fff' }}>⚡ Creating...</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {progress.map((msg, i) => <div key={i} style={{ fontSize: 13, color: '#ccc' }}>{msg}</div>)}
          </div>
          <div style={{ marginTop: 20, height: 4, background: '#e2e8f0', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, background: '#6366f1', width: `${Math.min(progress.length / 5 * 100, 95)}%`, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {/* ── DONE ──────────────────────────────────────────────────────── */}
      {stage === 'done' && (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Done!</h2>
          <p style={{ color: '#888', marginBottom: 28 }}>{sortedPhotos.length} photos uploaded and sorted</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href={doneUrl} style={{ background: '#6366f1', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700 }}>
              View Profile →
            </a>
            <button
              onClick={() => { setStage('drop'); setPhotos([]); setSortedPhotos([]); setAnketaText(''); setParsedForm({}); setManualName(''); setProgress([]) }}
              style={{ border: '1px solid #444', background: '#1e1e2e', color: '#ccc', padding: '12px 20px', borderRadius: 10, cursor: 'pointer' }}
            >
              Add Another
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────────────────── */}
      {stage === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>❌ Error</p>
          {progress.map((msg, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: 13 }}>{msg}</p>)}
          <button onClick={() => setStage('preview')} style={{ marginTop: 16, background: '#6366f1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
