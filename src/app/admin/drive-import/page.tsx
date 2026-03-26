'use client'
import { useState } from 'react'
import Link from 'next/link'

interface ModelResult {
  name: string
  status: 'success' | 'notFound' | 'ambiguous' | 'noPhotos' | 'error'
  message?: string
  modelId?: string
  modelUrl?: string
  photos?: number
  videos?: number
  hasQuestionnaire?: boolean
  ignoredFolders?: string[]
  warnings?: string[]
}

export default function DriveImportPage() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ModelResult[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<{ total: number; success: number; notFound: number; ambiguous: number; errors: number } | null>(null)

  const names = input.split('\n').map(n => n.trim()).filter(Boolean)

  const handleImport = async () => {
    if (!names.length) return
    setLoading(true)
    setResults([])
    setSummary(null)

    try {
      const res = await fetch('/api/admin/drive-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      })
      const data = await res.json()
      if (data.results) setResults(data.results)
      if (data.summary) setSummary(data.summary)
    } catch (e: any) {
      setResults([{ name: 'System', status: 'error', message: e.message }])
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status: ModelResult['status']) => {
    switch (status) {
      case 'success': return { bg: '#0f2b1a', border: '#166534', text: '#4ade80', label: '✅ Uploaded' }
      case 'notFound': return { bg: '#2b0f0f', border: '#991b1b', text: '#f87171', label: '❌ Not Found' }
      case 'ambiguous': return { bg: '#2b200f', border: '#92400e', text: '#fbbf24', label: '⚠️ Ambiguous' }
      case 'error': return { bg: '#2b0f0f', border: '#991b1b', text: '#f87171', label: '❌ Error' }
      default: return { bg: '#1a1a2e', border: '#374151', text: '#9ca3af', label: status }
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, fontFamily: 'system-ui, sans-serif', color: '#e2e8f0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/models" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Models</Link>
        <span style={{ color: '#555' }}>/</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>📁 Drive Import</h1>
      </div>

      {/* Instruction */}
      <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: '#94a3b8' }}>
        Enter model names exactly as their folders are named on Google Drive — one name per line.
        The system will find each folder, download photos and questionnaire, and create the profile automatically.
      </div>

      {/* Input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Model names — one per line
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'Anna Fox\nBella Rose\nMia Star'}
          rows={8}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0f172a', border: '1px solid #334155',
            borderRadius: 8, padding: '12px 14px',
            color: '#e2e8f0', fontSize: 14, fontFamily: 'monospace',
            resize: 'vertical', outline: 'none', lineHeight: 1.7,
          }}
        />
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
          {names.length} name{names.length !== 1 ? 's' : ''} entered
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handleImport}
        disabled={loading || names.length === 0}
        style={{
          background: loading || names.length === 0 ? '#1e293b' : '#6366f1',
          color: loading || names.length === 0 ? '#64748b' : '#fff',
          border: 'none', borderRadius: 8, padding: '12px 28px',
          fontSize: 14, fontWeight: 700, cursor: loading || names.length === 0 ? 'default' : 'pointer',
          marginBottom: 28,
        }}
      >
        {loading ? '⏳ Importing from Drive...' : `🚀 Import ${names.length > 0 ? names.length : ''} Model${names.length !== 1 ? 's' : ''}`}
      </button>

      {/* Summary bar */}
      {summary && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '12px 16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}>
          {[
            { label: 'Total', value: summary.total, color: '#e2e8f0' },
            { label: 'Uploaded', value: summary.success, color: '#4ade80' },
            { label: 'Not Found', value: summary.notFound, color: '#f87171' },
            { label: 'Ambiguous', value: summary.ambiguous, color: '#fbbf24' },
            { label: 'Errors', value: summary.errors, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results.map((r, i) => {
        const c = statusColor(r.status)
        return (
          <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.text, background: `${c.border}40`, padding: '3px 10px', borderRadius: 99 }}>
                {c.label}
              </span>
            </div>

            {/* Success details */}
            {r.status === 'success' && (
              <div style={{ fontSize: 12, color: '#86efac', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>📸 {r.photos} photos uploaded</span>
                {r.videos ? <span>🎥 {r.videos} videos (not uploaded)</span> : null}
                <span>{r.hasQuestionnaire ? '📄 Questionnaire parsed' : '⚠️ No questionnaire'}</span>
                {r.modelUrl && (
                  <Link href={r.modelUrl} style={{ color: '#818cf8', textDecoration: 'underline' }}>
                    View profile →
                  </Link>
                )}
              </div>
            )}

            {/* Error/not found message */}
            {r.message && r.status !== 'success' && (
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{r.message}</div>
            )}

            {/* Warnings */}
            {r.warnings && r.warnings.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {r.warnings.map((w, j) => (
                  <div key={j} style={{ fontSize: 11, color: '#fbbf24' }}>⚠️ {w}</div>
                ))}
              </div>
            )}

            {/* Ignored folders */}
            {r.ignoredFolders && r.ignoredFolders.length > 0 && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                Ignored folders: {r.ignoredFolders.join(', ')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
