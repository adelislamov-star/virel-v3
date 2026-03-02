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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#d8d0c4',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .2s',
  borderRadius: 0,
  WebkitAppearance: 'none',
  appearance: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '.2em',
  color: '#5a5450',
  textTransform: 'uppercase' as const,
  marginBottom: 8,
  display: 'block',
}

// Custom date input — text-based, no native browser chrome
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // store as display string DD / MM / YYYY, convert on change
  const [display, setDisplay] = useState(() => {
    if (!value) return ''
    const [y, m, d] = value.split('-')
    return `${d} / ${m} / ${y}`
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d]/g, '')
    if (raw.length > 8) raw = raw.slice(0, 8)

    let formatted = raw
    if (raw.length >= 3 && raw.length < 5) formatted = `${raw.slice(0,2)} / ${raw.slice(2)}`
    else if (raw.length >= 5) formatted = `${raw.slice(0,2)} / ${raw.slice(2,4)} / ${raw.slice(4)}`

    setDisplay(formatted)

    // emit ISO if complete
    if (raw.length === 8) {
      const d = raw.slice(0, 2)
      const m = raw.slice(2, 4)
      const y = raw.slice(4, 8)
      onChange(`${y}-${m}-${d}`)
    } else {
      onChange('')
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD / MM / YYYY"
      value={display}
      onChange={handleChange}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.45)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
    />
  )
}

// Custom time input — text-based
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [display, setDisplay] = useState(value || '')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d]/g, '')
    if (raw.length > 4) raw = raw.slice(0, 4)

    let formatted = raw
    if (raw.length >= 3) formatted = `${raw.slice(0,2)}:${raw.slice(2)}`

    setDisplay(formatted)

    if (raw.length === 4) {
      onChange(`${raw.slice(0,2)}:${raw.slice(2)}`)
    } else {
      onChange('')
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="HH : MM"
      value={display}
      onChange={handleChange}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.45)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
    />
  )
}

export function BookingForm({ model }: BookingFormProps) {
  const [serviceType, setServiceType] = useState<'incall' | 'outcall'>('incall')
  const [duration, setDuration] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', time: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const currentRates = (model.rates || [])
    .filter(r => r.call_type === serviceType)
    .sort((a, b) => RATE_ORDER.indexOf(a.duration_type) - RATE_ORDER.indexOf(b.duration_type))

  const selectedRate = currentRates.find(r => r.duration_type === duration)

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
          clientEmail: form.email || undefined,
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
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{
        width: 48, height: 48,
        border: '1px solid #c9a84c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', color: '#c9a84c', fontSize: 18,
      }}>✓</div>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', marginBottom: 10 }}>
        Request Received
      </p>
      <p style={{ fontSize: 12, color: '#5a5450', letterSpacing: '.08em', lineHeight: 1.8 }}>
        We'll confirm your arrangement<br />within 30 minutes.
      </p>
    </div>
  )

  const canSubmit = !loading && form.name.trim() && form.phone.trim()

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }} id="booking">

      {error && (
        <div style={{ padding: '10px 16px', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, marginBottom: 16, letterSpacing: '.04em' }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Incall / Outcall ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={labelStyle}>01 — Location</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.05)' }}>
          {(['incall', 'outcall'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => { setServiceType(type); setDuration('') }}
              style={{
                padding: '14px 12px',
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
          <p style={{ fontSize: 10, color: '#5a5450', letterSpacing: '.04em', marginTop: 8, paddingLeft: 2 }}>
            Transport fee applies
          </p>
        )}
      </div>

      {/* ── Step 2: Duration ── */}
      {currentRates.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={labelStyle}>02 — Duration</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
            {currentRates.map(rate => {
              const isSelected = duration === rate.duration_type
              return (
                <button
                  key={rate.duration_type}
                  type="button"
                  onClick={() => setDuration(rate.duration_type)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    border: 'none',
                    borderLeft: isSelected ? '2px solid #c9a84c' : '2px solid transparent',
                    fontFamily: 'inherit',
                    background: isSelected ? 'rgba(201,168,76,0.07)' : 'transparent',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 13, color: isSelected ? '#d8d0c4' : '#6b6058', transition: 'color .15s' }}>
                    {DURATION_LABELS[rate.duration_type] || rate.duration_type}
                  </span>
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 21,
                    fontWeight: 400,
                    color: isSelected ? '#c9a84c' : '#3d3830',
                    transition: 'color .15s',
                  }}>
                    £{Number(rate.price).toLocaleString()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Date & Time ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={labelStyle}>03 — Date & Time</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <DateInput
              value={form.date}
              onChange={v => setForm({ ...form, date: v })}
            />
          </div>
          <div>
            <TimeInput
              value={form.time}
              onChange={v => setForm({ ...form, time: v })}
            />
          </div>
        </div>
      </div>

      {/* ── Step 4: Contact ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={labelStyle}>04 — Your details</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            required
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.45)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
          />
          <input
            type="tel"
            required
            placeholder="+44 7123 456789"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.45)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
          />
          <textarea
            rows={2}
            placeholder="Any preferences or special requests..."
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.45)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
          />
        </div>
      </div>

      {/* ── Summary ── */}
      {selectedRate && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '.18em', color: '#5a5450', marginBottom: 3 }}>
              {serviceType === 'incall' ? 'INCALL' : 'OUTCALL'} · {DURATION_LABELS[selectedRate.duration_type]}
            </p>
            <p style={{ fontSize: 10, letterSpacing: '.08em', color: '#5a5450', margin: 0 }}>Total</p>
          </div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#c9a84c' }}>
            £{Number(selectedRate.price).toLocaleString()}
          </span>
        </div>
      )}

      {/* ── Submit ── */}
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
          background: canSubmit ? '#c9a84c' : '#2a2520',
          color: canSubmit ? '#080808' : '#4a4540',
          border: 'none',
          transition: 'background .25s, color .25s',
        }}
      >
        {loading ? 'Submitting…' : `Arrange a Meeting`}
      </button>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#3a3530', letterSpacing: '.08em', marginTop: 12 }}>
        Response within 30 min · Fully discreet
      </p>
    </form>
  )
}
