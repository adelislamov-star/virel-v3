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
  padding: '13px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#d8d0c4',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .2s',
  borderRadius: 0,
  appearance: 'none' as any,
  WebkitAppearance: 'none' as any,
}

const stepLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '.22em',
  color: '#5a5450',
  textTransform: 'uppercase' as const,
  marginBottom: 12,
  display: 'block',
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [display, setDisplay] = useState(() => {
    if (!value) return ''
    const [y, m, d] = value.split('-')
    return `${d} / ${m} / ${y}`
  })

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 8)
    let fmt = raw
    if (raw.length >= 3 && raw.length < 5) fmt = `${raw.slice(0,2)} / ${raw.slice(2)}`
    else if (raw.length >= 5) fmt = `${raw.slice(0,2)} / ${raw.slice(2,4)} / ${raw.slice(4)}`
    setDisplay(fmt)
    if (raw.length === 8) onChange(`${raw.slice(4)}-${raw.slice(2,4)}-${raw.slice(0,2)}`)
    else onChange('')
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD / MM / YYYY"
      value={display}
      onChange={handle}
      style={baseInput}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [display, setDisplay] = useState(value || '')

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
    const fmt = raw.length >= 3 ? `${raw.slice(0,2)} : ${raw.slice(2)}` : raw
    setDisplay(fmt)
    if (raw.length === 4) onChange(`${raw.slice(0,2)}:${raw.slice(2)}`)
    else onChange('')
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="HH : MM"
      value={display}
      onChange={handle}
      style={baseInput}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...baseInput, ...props.style }}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function FocusTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...baseInput, resize: 'none', ...props.style }}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
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

  if (success) return (
    <div style={{ textAlign: 'center', padding: '52px 0' }}>
      <div style={{
        width: 52, height: 52,
        border: '1px solid #c9a84c',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        color: '#c9a84c', fontSize: 20,
      }}>✓</div>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color: '#f0e8dc', marginBottom: 12 }}>
        Request Received
      </p>
      <p style={{ fontSize: 12, color: '#5a5450', letterSpacing: '.08em', lineHeight: 2 }}>
        We'll confirm your arrangement<br />within 30 minutes.
      </p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {error && (
        <div style={{ padding: '10px 14px', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 11, marginBottom: 16, letterSpacing: '.04em' }}>
          {error}
        </div>
      )}

      {/* ── 01 LOCATION ── */}
      <div style={{ marginBottom: 20 }}>
        <span style={stepLabel}>01 — Location</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.05)' }}>
          {(['incall', 'outcall'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => { setServiceType(type); setDuration('') }}
              style={{
                padding: '13px 10px',
                fontSize: 10,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: 'none',
                transition: 'all .2s',
                background: serviceType === type ? '#c9a84c' : '#111',
                color: serviceType === type ? '#080808' : '#5a5450',
                fontWeight: serviceType === type ? 500 : 400,
              }}
            >
              {type}
            </button>
          ))}
        </div>
        {serviceType === 'outcall' && (
          <p style={{ fontSize: 10, color: '#5a5450', letterSpacing: '.04em', marginTop: 7, paddingLeft: 2 }}>
            Transport fee applies
          </p>
        )}
      </div>

      {/* ── 02 DURATION — cards with checkmark ── */}
      {currentRates.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span style={stepLabel}>02 — Duration</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {currentRates.map(rate => {
              const sel = duration === rate.duration_type
              return (
                <button
                  key={rate.duration_type}
                  type="button"
                  onClick={() => setDuration(rate.duration_type)}
                  style={{
                    position: 'relative',
                    padding: '20px 16px',
                    cursor: 'pointer',
                    border: sel ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.07)',
                    background: sel ? 'rgba(201,168,76,0.07)' : '#161616',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all .2s',
                    overflow: 'hidden',
                  }}
                >
                  {/* checkmark */}
                  {sel && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#c9a84c',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#080808', fontWeight: 700,
                    }}>✓</span>
                  )}
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 20,
                    fontWeight: 300,
                    color: sel ? '#f0e8dc' : '#d8d0c4',
                    margin: '0 0 6px',
                  }}>
                    {DURATION_LABELS[rate.duration_type] || rate.duration_type}
                  </p>
                  <p style={{
                    fontSize: 15,
                    color: sel ? '#c9a84c' : '#5a5450',
                    margin: 0,
                    fontFamily: 'Cormorant Garamond, serif',
                    transition: 'color .2s',
                  }}>
                    £{Number(rate.price).toLocaleString()}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 03 DATE & TIME ── */}
      <div style={{ marginBottom: 20 }}>
        <span style={stepLabel}>03 — Date & Time</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <DateInput value={form.date} onChange={v => setForm({ ...form, date: v })} />
          <TimeInput value={form.time} onChange={v => setForm({ ...form, time: v })} />
        </div>
      </div>

      {/* ── 04 CONTACT ── */}
      <div style={{ marginBottom: 20 }}>
        <span style={stepLabel}>04 — Your details</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FocusInput
            type="text"
            required
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm({ ...form, name: (e.target as HTMLInputElement).value })}
          />
          <FocusInput
            type="tel"
            required
            placeholder="+44 7123 456789"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: (e.target as HTMLInputElement).value })}
          />
          <FocusTextarea
            rows={2}
            placeholder="Any preferences or special requests…"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: (e.target as HTMLTextAreaElement).value })}
          />
        </div>
      </div>

      {/* ── SUMMARY — visible only after duration selected ── */}
      {selectedRate && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 20px',
          border: '1px solid rgba(201,168,76,0.3)',
          background: 'rgba(201,168,76,0.04)',
          marginBottom: 16,
        }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '.2em', color: '#5a5450', marginBottom: 4, textTransform: 'uppercase' }}>
              {serviceType} · {DURATION_LABELS[selectedRate.duration_type]}
            </p>
            <p style={{ fontSize: 10, letterSpacing: '.06em', color: '#6b6058', margin: 0 }}>Total</p>
          </div>
          <span style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 34,
            fontWeight: 300,
            color: '#c9a84c',
          }}>
            £{Number(selectedRate.price).toLocaleString()}
          </span>
        </div>
      )}

      {/* ── SUBMIT ── */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '17px',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          fontFamily: 'inherit',
          fontWeight: 500,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          background: canSubmit ? '#c9a84c' : '#1e1c18',
          color: canSubmit ? '#080808' : '#3a3830',
          border: 'none',
          transition: 'background .25s, color .25s',
        }}
      >
        {loading ? 'Submitting…' : 'Arrange a Meeting'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#3a3530', letterSpacing: '.08em', marginTop: 10 }}>
        Response within 30 min · Fully discreet
      </p>
    </form>
  )
}
