'use client'

import { useState, useRef, useCallback } from 'react'

interface QuickUploadModalProps {
  open: boolean
  onClose: () => void
}

interface UploadSummary {
  name: string
  age: number | null
  nationality: string | null
  services: number
  rates: number
  photos: number
  hasBio: boolean
  hasAddress: boolean
}

const DOC_EXTENSIONS = ['docx', 'doc', 'txt', 'pdf']
const ACCEPT_TYPES = 'image/*,.docx,.doc,.txt,.pdf'

function isDocFile(file: File): boolean {
  const ext = file.name.toLowerCase().split('.').pop() || ''
  return DOC_EXTENSIONS.includes(ext) || file.type.includes('word') || file.type.includes('text/plain') || file.type.includes('pdf')
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(file.name.toLowerCase().split('.').pop() || '')
}

export default function QuickUploadModal({ open, onClose }: QuickUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const imageFiles = files.filter(isImageFile)
  const docFiles = files.filter(isDocFile)

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => isImageFile(f) || isDocFile(f))
    const combined = [...files, ...valid]
    // Limit: 10 images, 2 docs
    const images = combined.filter(isImageFile).slice(0, 10)
    const docs = combined.filter(isDocFile).slice(0, 2)
    const final = [...images, ...docs]
    setFiles(final)
    setError(null)
    setSummary(null)

    // Generate previews for images only
    const imageOnly = final.filter(isImageFile)
    const newPreviews: string[] = []
    if (imageOnly.length === 0) {
      setPreviews([])
      return
    }
    imageOnly.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === imageOnly.length) {
          setPreviews([...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }, [files])

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    // Rebuild previews for remaining images
    const remainingImages = updated.filter(isImageFile)
    if (remainingImages.length === 0) {
      setPreviews([])
      return
    }
    const newPreviews: string[] = []
    remainingImages.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === remainingImages.length) {
          setPreviews([...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  async function handleProcess() {
    if (files.length === 0) return
    setProcessing(true)
    setError(null)
    setSummary(null)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))

      const res = await fetch('/api/v1/models/quick-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setSummary(data.summary)
        setModelId(data.modelId)
        setProcessing(false)
      } else {
        setError(data.error || 'Processing failed')
        setProcessing(false)
      }
    } catch (e: any) {
      setError(e.message || 'Network error')
      setProcessing(false)
    }
  }

  function handleGoToModel() {
    if (modelId) {
      window.location.href = `/admin/models/${modelId}`
    }
  }

  function handleReset() {
    setFiles([])
    setPreviews([])
    setError(null)
    setSummary(null)
    setModelId(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={processing ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-zinc-800/50 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-zinc-100">Quick Upload</h2>
          {!processing && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {summary ? (
            /* Success summary */
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold">Model Created</span>
              </div>

              <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Name</span>
                  <span className="text-zinc-100 font-medium">{summary.name}</span>
                </div>
                {summary.age && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Age</span>
                    <span className="text-zinc-100">{summary.age}</span>
                  </div>
                )}
                {summary.nationality && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Nationality</span>
                    <span className="text-zinc-100">{summary.nationality}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Services linked</span>
                  <span className="text-zinc-100">{summary.services}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Rates added</span>
                  <span className="text-zinc-100">{summary.rates}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Photos uploaded</span>
                  <span className="text-zinc-100">{summary.photos}</span>
                </div>
                {summary.hasBio && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">AI Bio</span>
                    <span className="text-emerald-400">Generated</span>
                  </div>
                )}
                {summary.hasAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Address</span>
                    <span className="text-emerald-400">Saved</span>
                  </div>
                )}
              </div>
            </div>
          ) : processing ? (
            /* Processing state */
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-300 font-medium">Processing files...</p>
              <p className="text-zinc-500 text-sm">Parsing document, uploading images</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/30'
                }`}
              >
                <div className="text-3xl mb-2">+</div>
                <p className="text-zinc-300 text-sm font-medium">
                  Drop files here or click to select
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  Photos (JPG/PNG/WebP) + Profile document (DOCX/TXT/PDF)
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={(e) => addFiles(Array.from(e.target.files || []))}
                />
              </div>

              {/* Document files */}
              {docFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {docFiles.map((doc, i) => {
                    const globalIdx = files.indexOf(doc)
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                        <span className="text-xl flex-shrink-0">&#128196;</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-zinc-500">{(doc.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => removeFile(globalIdx)}
                          className="text-zinc-500 hover:text-red-400 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Image preview grid */}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {previews.map((src, i) => {
                    const globalIdx = files.indexOf(imageFiles[i])
                    return (
                      <div key={i} className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(globalIdx) }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          x
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-amber-500/90 text-zinc-900 px-1 rounded font-medium">
                            Cover
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm whitespace-pre-wrap">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50">
          {summary ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={handleGoToModel}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors"
              >
                Edit Profile
              </button>
            </>
          ) : !processing ? (
            <>
              <span className="text-zinc-500 text-xs">
                {imageFiles.length} photo{imageFiles.length !== 1 ? 's' : ''}, {docFiles.length} doc{docFiles.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcess}
                  disabled={files.length === 0}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 text-sm font-medium transition-colors"
                >
                  Process
                </button>
              </div>
            </>
          ) : (
            <span className="text-zinc-500 text-xs">Please wait...</span>
          )}
        </div>
      </div>
    </div>
  )
}
