'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { sortRates } from '@/lib/sortRates'
import { durationLabel } from '@/lib/durationLabel'

interface Rate {
  duration_type: string
  call_type: string
  price: number
}

interface BookingFormProps {
  model: { id: string; name: string; rates?: Rate[] }
}

const baseInput: React.CSSProperties = {
  width: '100%',
  padding: '16px 20px',
  background: '#161616',
  border: '1px solid rgba(255,255,255,0.07)',
  color: '#e8e2d6',
  fontSize: 13,
  fontWeight: 300,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  letterSpacing: '0.03em',
  transition: 'border-color .2s',
  borderRadius: 0,
  appearance: 'none' as any,
  WebkitAppearance: 'none' as any,
}

const stepLabelStyle: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: '.3em',
  color: 'rgba(232,224,212,0.42)',
  textTransform: 'uppercase' as const,
  marginBottom: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

function StepLabel({ n, text }: { n: string; text: string }) {
  return (
    <div style={stepLabelStyle}>
      {n}&nbsp;&nbsp;{text}
      <span style={{ flex: '0 0 40px', height: 1, background: 'rgba(184,150,90,0.2)', display: 'inline-block' }} />
    </div>
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={minDate}
      style={{
        ...baseInput,
        colorScheme: 'dark',
      }}
      onFocus={e => (e.target.style.borderColor = 'rgba(184,150,90,0.6)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    />
  )
}

const TIME_OPTIONS = (() => {
  const options: string[] = []
  for (let h = 9; h <= 23; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`)
    options.push(`${String(h).padStart(2, '0')}:30`)
  }
  for (let h = 0; h <= 3; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 3) options.push(`${String(h).padStart(2, '0')}:30`)
  }
  return options
})()

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...baseInput,
        colorScheme: 'dark',
        cursor: 'pointer',
      }}
      onFocus={e => (e.target.style.borderColor = 'rgba(184,150,90,0.6)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      <option value="">Select time</option>
      {TIME_OPTIONS.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  )
}

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...baseInput, ...props.style }}
      onFocus={e => { (e.target.style.borderColor = 'rgba(184,150,90,0.6)'); props.onFocus?.(e) }}
      onBlur={e => { (e.target.style.borderColor = 'rgba(255,255,255,0.07)'); props.onBlur?.(e) }}
    />
  )
}

function FocusTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...baseInput, resize: 'none', ...props.style }}
      onFocus={e => (e.target.style.borderColor = 'rgba(184,150,90,0.6)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    />
  )
}

/* ─────────────────────────────────────────────
   Duration Selector — elegant single-field dropdown
   ───────────────────────────────────────────── */

function DurationSelector({
  value,
  onChange,
  rates,
  serviceType,
}: {
  value: string
  onChange: (v: string) => void
  rates: Rate[]
  serviceType: 'incall' | 'outcall'
}) {
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  // Derive presets dynamically from the model's rates
  const presets = useMemo(() => {
    const uniqueTypes = [...new Set(rates.map(r => r.duration_type))]
    const sorted = sortRates(uniqueTypes.map(d => ({ duration_type: d }))).map(d => d.duration_type)
    return sorted.map(d => ({ value: d, label: durationLabel(d) }))
  }, [rates])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const closeDropdown = useCallback(() => {
    if (customValue.trim()) {
      onChange(customValue.trim())
      setCustomValue('')
    }
    setOpen(false)
    setFocusedIndex(-1)
  }, [customValue, onChange])

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, closeDropdown])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDropdown() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, closeDropdown])

  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open, isMobile])

  function findPrice(presetValue: string): number | undefined {
    if (presetValue === 'overnight') {
      return rates.find(r => r.call_type === serviceType && r.duration_type.startsWith('overnight'))?.price
    }
    return rates.find(r => r.call_type === serviceType && r.duration_type === presetValue)?.price
  }

  const displayLabel = (() => {
    if (!value) return ''
    const preset = presets.find(p => p.value === value)
    return preset ? preset.label : value
  })()

  function selectPreset(val: string) {
    onChange(val)
    setOpen(false)
    setFocusedIndex(-1)
  }

  function handleFieldKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setFocusedIndex(0)
      }
      return
    }
    const total = presets.length + 1
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => (i + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(i => (i - 1 + total) % total)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < presets.length) {
        selectPreset(presets[focusedIndex].value)
      } else if (focusedIndex === presets.length) {
        customInputRef.current?.focus()
      }
    }
  }

  const panelContent = (
    <>
      {presets.map((opt, i) => {
        const price = findPrice(opt.value)
        const selected = value === opt.value
        const focused = focusedIndex === i
        return (
          <div
            key={opt.value}
            role="option"
            aria-selected={selected}
            onClick={() => selectPreset(opt.value)}
            style={{
              padding: '14px 20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: focused ? 'rgba(255,255,255,0.04)' : selected ? 'rgba(184,150,90,0.05)' : 'transparent',
              borderLeft: selected ? '2px solid #b8965a' : '2px solid transparent',
              transition: 'background .12s',
            }}
            onMouseEnter={(e) => {
              setFocusedIndex(i)
              if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            }}
            onMouseLeave={(e) => {
              if (!selected && !focused) e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{
              fontSize: 15,
              fontFamily: 'Cormorant Garamond, serif',
              color: selected ? '#e8e2d6' : 'rgba(232,226,214,0.65)',
              fontWeight: 300,
            }}>
              {opt.label}
            </span>
            {price !== undefined && (
              <span style={{
                fontSize: 12,
                color: 'rgba(184,150,90,0.45)',
                fontFamily: 'inherit',
                fontWeight: 300,
                letterSpacing: '.02em',
              }}>
                £{price.toLocaleString('en-GB')}
              </span>
            )}
          </div>
        )
      })}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 20px' }} />

      <div style={{ padding: '10px 20px 16px' }}>
        <p style={{
          fontSize: 8,
          letterSpacing: '.25em',
          textTransform: 'uppercase',
          color: 'rgba(232,226,214,0.35)',
          margin: '0 0 8px',
        }}>
          Custom duration
        </p>
        <input
          ref={customInputRef}
          type="text"
          placeholder="e.g. 5 hours, 90 min, Weekend"
          value={customValue}
          onChange={e => setCustomValue(e.target.value)}
          onFocus={() => setFocusedIndex(presets.length)}
          onKeyDown={e => {
            if (e.key === 'Enter' && customValue.trim()) {
              e.stopPropagation()
              onChange(customValue.trim())
              setOpen(false)
              setCustomValue('')
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setFocusedIndex(presets.length - 1)
              containerRef.current?.focus()
            }
          }}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: focusedIndex === presets.length
              ? '1px solid rgba(184,150,90,0.4)'
              : '1px solid rgba(255,255,255,0.08)',
            padding: '8px 0',
            color: '#e8e2d6',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            letterSpacing: '.03em',
            fontWeight: 300,
            boxSizing: 'border-box',
            transition: 'border-color .2s',
          }}
        />
      </div>
    </>
  )

  return (
    <div ref={containerRef} style={{ position: 'relative', maxWidth: 480 }}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={handleFieldKeyDown}
        style={{
          cursor: 'pointer',
          padding: '16px 0',
          borderBottom: open ? '1px solid rgba(184,150,90,0.6)' : '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          transition: 'border-color .2s',
          outline: 'none',
        }}
      >
        <span style={{
          fontSize: 8,
          letterSpacing: '.3em',
          textTransform: 'uppercase',
          color: 'rgba(232,224,212,0.42)',
        }}>
          Duration
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 15,
            fontWeight: 300,
            color: value ? '#e8e2d6' : 'rgba(232,226,214,0.3)',
            fontFamily: 'Cormorant Garamond, serif',
          }}>
            {displayLabel || 'Select'}
          </span>
          <span style={{
            fontSize: 7,
            color: 'rgba(232,226,214,0.2)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform .2s',
            display: 'inline-block',
          }}>
            ▼
          </span>
        </span>
      </div>

      {/* Desktop dropdown */}
      {open && !isMobile && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
            borderRadius: 2,
            overflow: 'hidden',
            animation: 'durationFadeIn 150ms ease',
          }}
        >
          {panelContent}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && isMobile && (
        <>
          <div
            onClick={() => closeDropdown()}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999,
              animation: 'durationFadeIn 150ms ease',
            }}
          />
          <div
            role="listbox"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: '#141414',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px 12px 0 0',
              maxHeight: '70vh',
              overflowY: 'auto',
              animation: 'durationSlideUp 200ms ease',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
            </div>
            <div style={{
              padding: '8px 20px 12px',
              fontSize: 8,
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              color: 'rgba(232,224,212,0.42)',
            }}>
              Duration
            </div>
            {panelContent}
          </div>
        </>
      )}

      <style>{`
        @keyframes durationFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes durationSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}


/* ─────────────────────────────────────────────
   Booking Form
   ───────────────────────────────────────────── */

export function BookingForm({ model }: BookingFormProps) {
  const [serviceType, setServiceType] = useState<'incall' | 'outcall'>('incall')
  const [duration, setDuration] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const rates = model.rates || []

  // Find price for summary display
  const selectedPrice = (() => {
    if (!duration) return undefined
    if (duration === 'overnight') {
      return rates.find(r => r.call_type === serviceType && r.duration_type.startsWith('overnight'))?.price
    }
    return rates.find(r => r.call_type === serviceType && r.duration_type === duration)?.price
  })()

  const selectedLabel = durationLabel(duration) || duration

  const canSubmit = !loading && form.name.trim() && form.phone.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.name,
          clientPhone: form.phone,
          modelId: model.id,
          serviceType,
          duration,
          requestedDate: form.date || undefined,
          requestedTime: form.time || undefined,
          notes: form.notes || undefined,
          message: `Booking request for ${model.name}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formStyles = `
    .booking-2col-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .booking-2col-grid-lg { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media (max-width:640px) {
      .booking-2col-grid, .booking-2col-grid-lg { grid-template-columns:1fr; }
    }
  `

  if (success) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{ fontSize: 28, color: '#b8965a', marginBottom: 28 }}>&#9670;</div>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 300, color: '#f5f0e8', marginBottom: 16 }}>
        Your request has been received
      </p>
      <p style={{ fontSize: 11, letterSpacing: '.1em', color: 'rgba(232,226,214,0.45)', lineHeight: 2, marginBottom: 40 }}>
        We will confirm your arrangement within 30 minutes.<br />
        For immediate assistance, reach out directly.
      </p>
      <a
        href="https://t.me/virel_bookings"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '18px 48px',
          background: '#b8965a',
          color: '#0a0a0a',
          fontFamily: 'inherit',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '.25em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          transition: 'background .3s',
        }}
      >
        Contact via Telegram
      </a>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{formStyles}</style>

      {error && (
        <div style={{ padding: '12px 20px', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 11, marginBottom: 24, letterSpacing: '.04em' }}>
          {error}
        </div>
      )}

      {/* ── 01 LOCATION ── */}
      <div style={{ marginBottom: 48 }}>
        <StepLabel n="01" text="Location preference" />
        <div className="booking-2col-grid" style={{ maxWidth: 480 }}>
          {([
            ['incall', 'Incall', 'Our private location, central London'],
            ['outcall', 'Outcall', 'Your hotel or residence + transport'],
          ] as const).map(([type, label, desc]) => {
            const active = serviceType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setServiceType(type); setDuration('') }}
                style={{
                  padding: '24px',
                  border: active ? '1px solid #b8965a' : '1px solid rgba(255,255,255,0.07)',
                  background: active ? 'rgba(184,150,90,0.06)' : '#161616',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all .3s',
                }}
              >
                <span style={{
                  display: 'block',
                  fontSize: 10,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: active ? '#b8965a' : 'rgba(232,226,214,0.45)',
                  marginBottom: 8,
                  transition: 'color .3s',
                }}>
                  {label}
                </span>
                <span style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 14,
                  color: active ? 'rgba(232,226,214,0.6)' : 'rgba(232,226,214,0.25)',
                  transition: 'color .3s',
                  display: 'block',
                }}>
                  {desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 02 DURATION ── */}
      <div style={{ marginBottom: 48 }}>
        <StepLabel n="02" text="Duration" />
        <DurationSelector
          value={duration}
          onChange={setDuration}
          rates={rates}
          serviceType={serviceType}
        />
      </div>

      {/* ── 03 DATE & TIME ── */}
      <div style={{ marginBottom: 48 }}>
        <StepLabel n="03" text="Date & Time" />
        <div className="booking-2col-grid-lg" style={{ maxWidth: 480 }}>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.45)', marginBottom: 10 }}>Date</p>
            <DateInput value={form.date} onChange={v => setForm({ ...form, date: v })} />
          </div>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.45)', marginBottom: 10 }}>Preferred time</p>
            <TimeSelect value={form.time} onChange={v => setForm({ ...form, time: v })} />
          </div>
        </div>
      </div>

      {/* ── 04 CONTACT ── */}
      <div style={{ marginBottom: 48 }}>
        <StepLabel n="04" text="Your contact" />
        <div className="booking-2col-grid-lg" style={{ maxWidth: 600, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.45)', marginBottom: 10 }}>Name *</p>
            <FocusInput
              type="text"
              required
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.45)', marginBottom: 10 }}>Phone *</p>
            <FocusInput
              type="tel"
              required
              placeholder="+44 7000 000000"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: (e.target as HTMLInputElement).value })}
            />
          </div>
        </div>
        <div style={{ maxWidth: 600 }}>
          <p style={{ fontSize: 8, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.45)', marginBottom: 10 }}>Notes (optional)</p>
          <FocusTextarea
            rows={3}
            placeholder="Any preferences or special requests..."
            value={form.notes}
            onChange={e => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })}
          />
        </div>
      </div>

      {/* ── SUMMARY ── */}
      <div style={{
        maxWidth: 600,
        marginBottom: 24,
        padding: '28px 36px',
        border: `1px solid ${duration ? '#b8965a' : 'rgba(255,255,255,0.07)'}`,
        background: duration ? 'rgba(184,150,90,0.04)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 80,
        transition: 'border-color .3s, background .3s',
      }}>
        {duration ? (
          <>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: '#f5f0e8' }}>
              {serviceType === 'incall' ? 'Incall' : 'Outcall'} &middot; {selectedLabel}
            </span>
            {selectedPrice !== undefined ? (
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#b8965a', whiteSpace: 'nowrap', marginLeft: 24 }}>
                £{Number(selectedPrice).toLocaleString('en-GB')}
                {serviceType === 'outcall' && <span style={{ fontSize: 13, opacity: .6, marginLeft: 6 }}>+ taxi</span>}
              </span>
            ) : (
              <span style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(184,150,90,0.5)', whiteSpace: 'nowrap', marginLeft: 24 }}>
                On request
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.3)' }}>
            Select a duration to see your summary
          </span>
        )}
      </div>

      {/* ── SUBMIT ── */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          maxWidth: 600,
          width: '100%',
          padding: '22px',
          fontSize: 10,
          letterSpacing: '.3em',
          textTransform: 'uppercase',
          fontFamily: 'inherit',
          fontWeight: 500,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          background: canSubmit ? '#b8965a' : 'rgba(184,150,90,0.15)',
          color: canSubmit ? '#0a0a0a' : 'rgba(184,150,90,0.4)',
          border: 'none',
          transition: 'all .3s',
        }}
        onMouseOver={e => { if (canSubmit) (e.target as HTMLButtonElement).style.background = '#d4af6e' }}
        onMouseOut={e => { if (canSubmit) (e.target as HTMLButtonElement).style.background = '#b8965a' }}
      >
        {loading ? 'Sending...' : 'Book Now'}
      </button>

      {/* Assurance row */}
      <div style={{ display: 'flex', gap: 36, marginTop: 20, maxWidth: 600, fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.35)', flexWrap: 'wrap' }}>
        {['Confirmed within 30 min', '100% discreet', 'Verified profile'].map(text => (
          <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#b8965a', fontSize: 8 }}>&#9670;</span>
            {text}
          </span>
        ))}
      </div>
    </form>
  )
}
