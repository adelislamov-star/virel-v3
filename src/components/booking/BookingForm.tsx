'use client'

import { useState } from 'react'

interface Rate {
  duration_type: string
  call_type: string
  price: number
}

interface BookingFormProps {
  model: { id: string; name: string; rates?: Rate[] }
}

const RATE_ORDER = ['30min', '45min', '1hour', '90min', '2hours', 'extra_hour', 'overnight']
const DURATION_LABELS: Record<string, string> = {
  '30min': '30 min',
  '45min': '45 min',
  '1hour': '1 hour',
  '90min': '1.5 hours',
  '2hours': '2 hours',
  'extra_hour': 'Extra hour',
  'overnight': 'Overnight',
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
  color: '#b8965a',
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
  // Get tomorrow's date as minimum
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
  // Add late night / early morning slots
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

export function BookingForm({ model }: BookingFormProps) {
  const [serviceType, setServiceType] = useState<'incall' | 'outcall'>('incall')
  const [duration, setDuration] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const currentRates = (model.rates || [])
    .filter(r => r.call_type === serviceType)
    .sort((a, b) => RATE_ORDER.indexOf(a.duration_type) - RATE_ORDER.indexOf(b.duration_type))

  const selectedRate = currentRates.find(r => r.duration_type === duration)
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
    .booking-duration-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:12px; }
    .booking-2col-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .booking-2col-grid-lg { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media (max-width:640px) {
      .booking-duration-grid { grid-template-columns:1fr 1fr; }
      .booking-2col-grid, .booking-2col-grid-lg { grid-template-columns:1fr; }
      .booking-duration-grid button { min-height:44px; }
    }
  `

  if (success) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div style={{ fontSize: 28, color: '#b8965a', marginBottom: 28 }}>◈</div>
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
      {currentRates.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <StepLabel n="02" text="Duration" />
          <div className="booking-duration-grid">
            {currentRates.map(rate => {
              const sel = duration === rate.duration_type
              return (
                <button
                  key={rate.duration_type}
                  type="button"
                  onClick={() => setDuration(rate.duration_type)}
                  style={{
                    position: 'relative',
                    padding: '28px 24px',
                    border: sel ? '1px solid #b8965a' : '1px solid rgba(255,255,255,0.07)',
                    background: sel ? 'rgba(184,150,90,0.06)' : '#161616',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all .25s',
                    overflow: 'hidden',
                  }}
                >
                  {/* gradient overlay when selected */}
                  {sel && (
                    <span style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, rgba(184,150,90,0.12), transparent)',
                      pointerEvents: 'none',
                    }} />
                  )}
                  {/* checkmark */}
                  {sel && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#b8965a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#0a0a0a', fontWeight: 700,
                    }}>✓</span>
                  )}
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 22,
                    fontWeight: 300,
                    color: '#f5f0e8',
                    margin: '0 0 8px',
                  }}>
                    {DURATION_LABELS[rate.duration_type] || rate.duration_type}
                  </p>
                  <p style={{
                    fontSize: 14,
                    color: sel ? '#b8965a' : 'rgba(184,150,90,0.55)',
                    margin: 0,
                    letterSpacing: '.05em',
                    transition: 'color .2s',
                  }}>
                    £{Number(rate.price).toLocaleString('en-GB')}
                    {rate.call_type === 'outcall' && (
                      <span style={{ fontSize: 10, opacity: .6, marginLeft: 4 }}>+ taxi</span>
                    )}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

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
            placeholder="Any preferences or special requests…"
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
        border: `1px solid ${selectedRate ? '#b8965a' : 'rgba(255,255,255,0.07)'}`,
        background: selectedRate ? 'rgba(184,150,90,0.04)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 80,
        transition: 'border-color .3s, background .3s',
      }}>
        {selectedRate ? (
          <>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: '#f5f0e8' }}>
              {serviceType === 'incall' ? 'Incall' : 'Outcall'} · {DURATION_LABELS[selectedRate.duration_type]}
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#b8965a', whiteSpace: 'nowrap', marginLeft: 24 }}>
              £{Number(selectedRate.price).toLocaleString('en-GB')}
              {selectedRate.call_type === 'outcall' && <span style={{ fontSize: 13, opacity: .6, marginLeft: 6 }}>+ taxi</span>}
            </span>
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
        {loading
          ? 'Submitting…'
          : selectedRate
            ? `Request Booking — £${Number(selectedRate.price).toLocaleString('en-GB')}`
            : 'Request Booking'
        }
      </button>

      {/* Assurance row */}
      <div style={{ display: 'flex', gap: 36, marginTop: 20, maxWidth: 600, fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(232,226,214,0.35)', flexWrap: 'wrap' }}>
        {['Confirmed within 30 min', '100% discreet', 'Verified profile'].map(text => (
          <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#b8965a', fontSize: 8 }}>◈</span>
            {text}
          </span>
        ))}
      </div>
    </form>
  )
}
