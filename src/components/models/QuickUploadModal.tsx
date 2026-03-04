'use client'

import { useState, useRef, useCallback } from 'react'

interface QuickUploadModalProps {
  open: boolean
  onClose: () => void
}

export default function QuickUploadModal({ open, onClose }: QuickUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'))
    const combined = [...files, ...imageFiles].slice(0, 5)
    setFiles(combined)
    setError(null)

    // Generate previews
    const newPreviews: string[] = []
    combined.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === combined.length) {
          setPreviews([...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
    if (combined.length === 0) setPreviews([])
  }, [files])

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    addFiles(dropped)
  }

  async function handleProcess() {
    if (files.length === 0) return
    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('photos', f))

      const res = await fetch('/api/v1/models/quick-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        window.location.href = `/admin/models/${data.modelId}`
      } else {
        setError(data.error || 'Processing failed')
        setProcessing(false)
      }
    } catch (e: any) {
      setError(e.message || 'Network error')
      setProcessing(false)
    }
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
          {processing ? (
            /* Processing state */
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-300 font-medium">AI is analyzing photos...</p>
              <p className="text-zinc-500 text-sm">Extracting profile data and uploading images</p>
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
                <div className="text-3xl mb-2">📸</div>
                <p className="text-zinc-300 text-sm font-medium">
                  Drop photos here or click to select
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  1-5 images (screenshots, profile cards, etc.)
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => addFiles(Array.from(e.target.files || []))}
                />
              </div>

              {/* Preview grid */}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i) }}
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
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!processing && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/50">
            <span className="text-zinc-500 text-xs">
              {files.length}/5 photos selected
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
          </div>
        )}
      </div>
    </div>
  )
}
