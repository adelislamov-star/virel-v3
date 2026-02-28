'use client'

import { useState } from 'react'

interface Rate {
  duration_type: string
  call_type: string
  price: number
}

interface BookingFormProps {
  model: {
    id: string
    name: string
    rates?: Rate[]
  }
}

const DURATION_LABELS: Record<string, string> = {
  '30min': '30 min',
  '45min': '45 min',
  '1hour': '1 hour',
  '90min': '1.5 hours',
  '2hours': '2 hours',
  'extra_hour': 'Extra hour',
  'overnight': 'Overnight',
}

export function BookingForm({ model }: BookingFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceType: 'incall' as 'incall' | 'outcall',
    requestedDate: '',
    requestedTime: '',
    duration: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const currentRates = (model.rates || []).filter(r => r.call_type === formData.serviceType)
  const selectedRate = currentRates.find(r => r.duration_type === formData.duration)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail || undefined,
          modelId: model.id,
          serviceType: formData.serviceType,
          requestedDate: formData.requestedDate || undefined,
          requestedTime: formData.requestedTime || undefined,
          duration: formData.duration,
          notes: formData.notes || undefined,
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

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">✓</div>
        <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
        <p className="text-muted-foreground text-sm">We'll confirm your booking within 30 minutes.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      {/* Incall / Outcall */}
      <div className="grid grid-cols-2 gap-2">
        {(['incall', 'outcall'] as const).map(type => (
          <button key={type} type="button"
            onClick={() => setFormData({ ...formData, serviceType: type, duration: '' })}
            className={`py-2.5 rounded-lg border font-medium capitalize text-sm transition-all ${
              formData.serviceType === type ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
            }`}
          >{type}</button>
        ))}
      </div>

      {/* Duration */}
      {currentRates.length > 0 && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Duration</label>
          {currentRates.map(rate => (
            <button key={rate.duration_type} type="button"
              onClick={() => setFormData({ ...formData, duration: rate.duration_type })}
              className={`w-full flex justify-between px-3 py-2.5 rounded-lg border text-sm transition-all ${
                formData.duration === rate.duration_type ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
              }`}
            >
              <span>{DURATION_LABELS[rate.duration_type] || rate.duration_type}</span>
              <span className="font-semibold">£{Number(rate.price)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" min={new Date().toISOString().split('T')[0]}
            value={formData.requestedDate}
            onChange={e => setFormData({ ...formData, requestedDate: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input type="time" value={formData.requestedTime}
            onChange={e => setFormData({ ...formData, requestedTime: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Contact */}
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input type="text" required placeholder="John Smith"
          value={formData.clientName}
          onChange={e => setFormData({ ...formData, clientName: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone *</label>
        <input type="tel" required placeholder="+44 7123 456789"
          value={formData.clientPhone}
          onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email (optional)</label>
        <input type="email" placeholder="john@example.com"
          value={formData.clientEmail}
          onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea rows={2} placeholder="Any preferences..."
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {selectedRate && (
        <div className="flex justify-between items-center py-2 border-t border-border">
          <span className="font-medium text-sm">Total</span>
          <span className="text-xl font-bold">£{Number(selectedRate.price)}</span>
        </div>
      )}

      <button type="submit" disabled={loading || !formData.clientPhone}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? 'Submitting...' : 'Request Booking'}
      </button>
      <p className="text-xs text-center text-muted-foreground">Confirmation within 30 min · 100% discreet</p>
    </form>
  )
}
