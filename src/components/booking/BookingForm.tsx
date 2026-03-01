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
  '30min': '30 min', '45min': '45 min', '1hour': '1 hour',
  '90min': '1.5 hours', '2hours': '2 hours', 'extra_hour': 'Extra hour', 'overnight': 'Overnight',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#ddd5c8', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .2s',
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
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.name, clientPhone: form.phone,
          clientEmail: form.email || undefined,
          modelId: model.id, serviceType, duration,
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
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ width: 48, height: 48, border: '1px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#c9a84c', fontSize: 20 }}>✓</div>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#f0e8dc', marginBottom: 8 }}>Request Received</p>
      <p style={{ fontSize: 12, color: '#6b6560', letterSpacing: '.06em' }}>We'll confirm within 30 minutes.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {error && (
        <div style={{ padding: '10px 16px', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: 12, marginBottom: 16 }}>{error}</div>
      )}

      {/* Incall / Outcall */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginBottom: 24, background: 'rgba(255,255,255,0.06)' }}>
        {(['incall', 'outcall'] as const).map(type => (
          <button key={type} type="button"
            onClick={() => { setServiceType(type); setDuration('') }}
            style={{
              padding: '12px', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
              fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all .2s',
              background: serviceType === type ? '#c9a84c' : '#111',
              color: serviceType === type ? '#080808' : '#6b6560',
              fontWeight: serviceType === type ? 500 : 400,
            }}
          >{type}</button>
        ))}
      </div>

      {/* Duration */}
      {currentRates.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, letterSpacing: '.2em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 12 }}>Duration</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
            {currentRates.map(rate => (
              <button key={rate.duration_type} type="button"
                onClick={() => setDuration(rate.duration_type)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 16px', cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                  background: duration === rate.duration_type ? 'rgba(201,168,76,0.08)' : 'transparent',
                  borderLeft: duration === rate.duration_type ? '2px solid #c9a84c' : '2px solid transparent',
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 13, color: duration === rate.duration_type ? '#ddd5c8' : '#6b6560' }}>
                  {DURATION_LABELS[rate.duration_type] || rate.duration_type}
                </span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: duration === rate.duration_type ? '#c9a84c' : '#4a4540' }}>
                  £{Number(rate.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 8 }}>Date</p>
          <input type="date" min={new Date().toISOString().split('T')[0]}
            value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 8 }}>Time</p>
          <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 8, marginTop: 16 }}>
        <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 8 }}>Name *</p>
        <input type="text" required placeholder="Your name"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Phone */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 8 }}>Phone *</p>
        <input type="tel" required placeholder="+44 7123 456789"
          value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 8 }}>Email <span style={{ color: '#3a3530' }}>(optional)</span></p>
        <input type="email" placeholder="your@email.com"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', textTransform: 'uppercase', marginBottom: 8 }}>Notes</p>
        <textarea rows={2} placeholder="Any preferences or special requests..."
          value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Total */}
      {selectedRate && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
          <span style={{ fontSize: 11, letterSpacing: '.12em', color: '#6b6560', textTransform: 'uppercase' }}>Total</span>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#c9a84c' }}>£{Number(selectedRate.price)}</span>
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading || !form.phone || !form.name}
        style={{
          width: '100%', padding: '16px', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
          fontFamily: 'inherit', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? '#4a3f20' : '#c9a84c', color: '#080808',
          border: 'none', transition: 'background .2s', opacity: (!form.phone || !form.name) ? 0.5 : 1,
        }}
      >
        {loading ? 'Submitting...' : `Book ${model.name}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#3a3530', letterSpacing: '.06em', marginTop: 12 }}>
        Confirmation within 30 min · Fully discreet
      </p>
    </form>
  )
}
