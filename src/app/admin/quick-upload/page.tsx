// v2 - anketa file fix
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface PhotoFile { file: File; previewUrl: string; id: string }
interface SortedPhoto extends PhotoFile { sortOrder: number; isPrimary: boolean; role: string }
type Stage = 'drop' | 'preview' | 'uploading' | 'duplicate' | 'done' | 'error'
type ParseError = { message: string } | null

function uid() { return Math.random().toString(36).slice(2) }

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.onerror = reject
    img.src = url
  })
}

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
    f.type === 'application/pdf' ||
    f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    f.type === 'application/msword' ||
    f.type === 'application/vnd.ms-excel' ||
    f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    f.type === 'text/csv' ||
    f.name.endsWith('.txt') ||
    f.name.endsWith('.pdf') ||
    f.name.endsWith('.docx') ||
    f.name.endsWith('.doc') ||
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
  const [anketaFileRef, setAnketaFileRef] = useState<File | null>(null)
  const [parsedForm, setParsedForm] = useState<Record<string, any>>({})
  const [manualName, setManualName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [doneUrl, setDoneUrl] = useState('')
  const [aiSorting, setAiSorting] = useState(false)
  const [aiParsing, setAiParsing] = useState(false)
  const [parseError, setParseError] = useState<ParseError>(null)
  const [acceptedOpen, setAcceptedOpen] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; name: string; publicCode: string } | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [submitWarning, setSubmitWarning] = useState(false)
  const [uploadWarning, setUploadWarning] = useState<string | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const DRAFT_KEY = 'vaurel_quick_upload_draft'

  // Restore draft on mount
  useEffect(() => {
    try {
      const wasSubmitting = localStorage.getItem('vaurel_quick_upload_submitting')
      if (wasSubmitting) {
        localStorage.removeItem('vaurel_quick_upload_submitting')
        setSubmitWarning(true)
      }
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.name) setManualName(d.name)
        if (d.parsedForm && Object.keys(d.parsedForm).length > 0) {
          setParsedForm(d.parsedForm)
          setStage('preview')
        }
        setDraftRestored(true)
      }
    } catch {}
  }, [])

  // Save draft on name/parsedForm changes
  useEffect(() => {
    if (manualName || Object.keys(parsedForm).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: manualName, parsedForm }))
    }
  }, [manualName, parsedForm])

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setDraftRestored(false)
    setStage('drop')
    setPhotos([])
    setSortedPhotos([])
    setAnketaText('')
    setAnketaFileRef(null)
    setParsedForm({})
    setManualName('')
    setProgress([])
    setParseError(null)
    setAcceptedOpen(false)
    setDuplicateInfo(null)
  }

  const log = (msg: string) => setProgress(p => [...p, msg])

  // ── Ingest files (parallel AI calls) ──────────────────────────────────────
  const ingestFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const imgFiles: PhotoFile[] = []
    let anketaFile: File | null = null

    // Classify files
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const { width, height } = await getImageDimensions(f)
        if (width > height) {
          log(`⚠️ Skipped ${f.name}: landscape orientation not supported`)
          continue
        }
        imgFiles.push({ file: f, previewUrl: URL.createObjectURL(f), id: uid() })
      } else if (isAnketaFile(f)) {
        anketaFile = f
      }
    }

    setStage('preview')

    // Launch both AI calls in parallel
    const promises: Promise<void>[] = []

    if (anketaFile) {
      const file = anketaFile
      setAnketaText(file.name)
      setAnketaFileRef(file)
      setAiParsing(true)
      setParseError(null)
      promises.push(
        parseAnketaWithAI(file)
          .then(parsed => {
            setParsedForm(parsed)
            if (parsed.name) setManualName(parsed.name)
            setAiParsing(false)
          })
          .catch((e: any) => {
            console.error('[quick-upload] Anketa parse failed:', e)
            setAiParsing(false)
            setParseError({ message: e.message || 'Failed to parse document' })
          })
      )
    }

    if (imgFiles.length > 0) {
      setPhotos(imgFiles)
      promises.push(doAiSort(imgFiles))
    }

    await Promise.all(promises)

    if (imgFiles.length === 0 && !anketaFile) {
      // Nothing useful dropped
      setStage('drop')
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

  // ── Build FormData (reused for create and force-create) ──
  const buildUploadFormData = () => {
    const finalName = manualName.trim()
    const formData = new FormData()
    const photosToUpload = sortedPhotos.slice(0, 10)
    photosToUpload.forEach((photo) => formData.append('files', photo.file))
    if (anketaFileRef) {
      formData.append('files', anketaFileRef)
    } else {
      const nameBlob = new Blob([`Name: ${finalName}`], { type: 'text/plain' })
      formData.append('files', new File([nameBlob], 'profile.txt', { type: 'text/plain' }))
    }
    if (Object.keys(parsedForm).length > 0) {
      formData.append('parsedFields', JSON.stringify({ ...parsedForm, name: finalName }))
    }
    return formData
  }

  // ── Create profile ─────────────────────────────────────────────────────────
  const handleCreate = async (force = false) => {
    const finalName = manualName.trim()
    if (!finalName) { alert('Enter model name'); return }

    setStage('uploading')
    localStorage.setItem('vaurel_quick_upload_submitting', 'true')
    setProgress([])
    setDuplicateInfo(null)

    try {
      log('📝 Creating profile...')
      const formData = buildUploadFormData()

      log(`📤 Uploading ${sortedPhotos.length} photos (server-side with watermark)...`)

      const url = force ? '/api/v1/models/quick-upload?force=true' : '/api/v1/models/quick-upload'
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()

      if (res.status === 409 && data.duplicate) {
        localStorage.removeItem('vaurel_quick_upload_submitting')
        setDuplicateInfo(data.existing)
        setStage('duplicate')
        return
      }

      if (!data.success) {
        throw new Error(data.error || `Upload failed (${res.status})`)
      }

      log(`✅ Uploaded ${data.summary?.photos || 0} photos`)
      log('🎉 Done!')
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem('vaurel_quick_upload_submitting')
      setDraftRestored(false)
      setDoneUrl(`/admin/models/${data.modelId}`)
      if (data.warning) {
        setUploadWarning(data.warning)
      }
      setStage('done')
    } catch (e: any) {
      localStorage.removeItem('vaurel_quick_upload_submitting')
      log(`❌ ${e.message}`)
      setStage('error')
    }
  }

  const canCreate =
    manualName.trim().length > 0 &&
    !aiSorting &&
    !aiParsing &&
    !(draftRestored && sortedPhotos.length === 0)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 960, fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/models" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Models</Link>
        <span style={{ color: '#888' }}>/</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚡ Quick Upload</h1>
      </div>

      {/* ── SUBMIT WARNING BANNER ──────────────────────────────────── */}
      {submitWarning && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start justify-between gap-3" style={{ marginBottom: 12 }}>
          <span>⚠️ A previous upload may still be in progress. Check the <a href="/admin/models" className="underline">Models list</a> before creating again to avoid duplicates.</span>
          <button onClick={() => setSubmitWarning(false)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── DRAFT RESTORED BANNER ──────────────────────────────────── */}
      {draftRestored && (stage === 'drop' || stage === 'preview') && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
          padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          <span style={{ color: '#94a3b8' }}>💾 Draft restored</span>
          <button
            onClick={clearDraft}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
          >
            Clear draft
          </button>
        </div>
      )}

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
            <input ref={fileInputRef} type="file" multiple accept="image/*,.txt,.pdf,.docx,.doc,.xlsx,.xls,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
            <div style={{ fontSize: 40, marginBottom: 8 }}>{photos.length > 0 ? '🖼️' : '📁'}</div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 15 }}>
              {photos.length > 0
                ? `${photos.length} photos${anketaText ? ' + anketa' : ' (no anketa)'}`
                : 'Drop photos + anketa (.txt, .docx, .pdf, .xlsx) here'}
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
              <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>AI reading anketa...</p>
            </div>
          )}
          {parseError && (
            <div style={{ background: '#2e1a1a', border: '1px solid #dc2626', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>Anketa parse failed: {parseError.message}</p>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888' }}>You can still create the profile manually — fill in the name and upload photos.</p>
            </div>
          )}
          {!aiParsing && Object.keys(parsedForm).length > 0 && (() => {
            // ── Warnings ──
            const warnings: { label: string; detail: string }[] = []
            const noContact = !parsedForm.phone && !parsedForm.telegram && !parsedForm.whatsapp && !parsedForm.email
            if (noContact) warnings.push({ label: 'Contact not found in anketa', detail: 'Phone / email will be empty — add manually after creation' })
            const noLocation = !parsedForm.primaryLocationId && !parsedForm.nearestStation && !parsedForm.tubeStation
            if (noLocation) warnings.push({ label: 'Location not matched', detail: 'Location will be empty — set it manually after creation' })
            const noRates = !parsedForm.rates || (Array.isArray(parsedForm.rates) && parsedForm.rates.length === 0)
            if (noRates) warnings.push({ label: 'No rates found in anketa', detail: 'Rates will be empty — add manually after creation' })
            const lowQualityCount = sortedPhotos.filter((p: any) => p.lowQuality).length
            if (lowQualityCount > 0) warnings.push({ label: `${lowQualityCount} photo${lowQualityCount > 1 ? 's' : ''} flagged as low quality`, detail: 'Consider replacing them after creation' })
            if (sortedPhotos.length > 10) warnings.push({ label: `${sortedPhotos.length} photos selected — only the first 10 will be uploaded`, detail: 'Remove extras or they will be cut off' })

            // ── Accepted fields ──
            const accepted = Object.entries(parsedForm)
              .filter(([k, v]) => {
                if (k === 'notesInternal' || k === 'bio') return false
                if (v == null || v === '') return false
                if (Array.isArray(v) && v.length === 0) return false
                return true
              })

            return (
              <>
                {/* Block 1 — Needs attention */}
                {warnings.length > 0 && (
                  <div style={{ background: '#2e2a1a', border: '1px solid #a16207', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 12, color: '#fbbf24' }}>⚠️ Needs attention</p>
                    {warnings.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < warnings.length - 1 ? 8 : 0 }}>
                        <span style={{ fontSize: 14, lineHeight: '18px', flexShrink: 0 }}>⚠️</span>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#fde68a' }}>{w.label}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#a8a29e' }}>{w.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Block 2 — Accepted by AI */}
                {accepted.length > 0 && (
                  <div style={{ background: '#1a2e1a', border: '1px solid #166534', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                    <button
                      type="button"
                      onClick={() => setAcceptedOpen(o => !o)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 12, color: '#4ade80' }}>
                        ✅ Accepted by AI {acceptedOpen ? '▴' : '▾'} ({accepted.length} fields)
                      </span>
                    </button>
                    {acceptedOpen && (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 4 }}>
                        {accepted.map(([k, v]) => (
                          <div key={k} style={{ fontSize: 11 }}>
                            <span style={{ color: '#6b7280' }}>{k}: </span>
                            <span style={{ fontWeight: 500, color: '#d1d5db' }}>
                              {Array.isArray(v) ? v.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(', ') : String(v).slice(0, 40)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          })()}

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

          {/* Draft photo warning */}
          {draftRestored && sortedPhotos.length === 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400" style={{ marginBottom: 12 }}>
              ⚠️ Photos were not restored from draft — please re-upload your photos before creating the profile.
            </div>
          )}

          {/* Create button */}
          <button
            onClick={() => handleCreate()}
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

      {/* ── DUPLICATE ──────────────────────────────────────────────── */}
      {stage === 'duplicate' && duplicateInfo && (
        <div style={{ background: '#2e2a1a', border: '1px solid #a16207', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>Possible duplicate</h2>
          <p style={{ color: '#d1d5db', marginBottom: 4 }}>
            A profile with a similar name or phone already exists:
          </p>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {duplicateInfo.name}
          </p>
          <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 28 }}>
            Code: {duplicateInfo.publicCode}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => handleCreate(true)}
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}
            >
              Create Anyway
            </button>
            <Link
              href={`/admin/models/${duplicateInfo.id}`}
              style={{ background: '#1e1e2e', color: '#ccc', border: '1px solid #444', borderRadius: 10, padding: '12px 28px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
            >
              Open Existing
            </Link>
          </div>
        </div>
      )}

      {/* ── DONE ──────────────────────────────────────────────────────── */}
      {stage === 'done' && (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Done!</h2>
          <p style={{ color: '#888', marginBottom: 28 }}>{sortedPhotos.length} photos uploaded and sorted</p>
          {uploadWarning && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#f59e0b', marginBottom: 16, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              ⚠️ {uploadWarning} — please add the missing photos manually in the profile editor.
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href={doneUrl} style={{ background: '#6366f1', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700 }}>
              View Profile →
            </a>
            <button
              onClick={() => { setStage('drop'); setPhotos([]); setSortedPhotos([]); setAnketaText(''); setAnketaFileRef(null); setParsedForm({}); setManualName(''); setProgress([]); setParseError(null); setAcceptedOpen(false); setDuplicateInfo(null); setUploadWarning(null) }}
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
