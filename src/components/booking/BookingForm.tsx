'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface BookingFormProps {
  model: {
    id: string
    name: string
    services: any
  }
}

export function BookingForm({ model }: BookingFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    date: '',
    time: '',
    duration: 2,
    serviceType: 'incall' as 'incall' | 'outcall',
    location: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const services = model.services as any
  const rate = formData.serviceType === 'incall' ? services.rates.incall : services.rates.outcall
  const totalAmount = rate * formData.duration

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const datetime = new Date(`${formData.date}T${formData.time}:00`)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail || undefined,
          modelId: model.id,
          date: datetime.toISOString(),
          duration: formData.duration,
          location: formData.location,
          serviceType: formData.serviceType,
          notes: formData.notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed')
      }

      setSuccess(true)
      setFormData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        date: '',
        time: '',
        duration: 2,
        serviceType: 'incall',
        location: '',
        notes: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Booking Submitted!</h3>
        <p className="text-muted-foreground mb-4">
          We'll confirm your booking within 30 minutes
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-accent hover:underline"
        >
          Make another booking
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Your Name *</label>
        <input
          type="text"
          required
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="John Smith"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Phone Number *</label>
        <input
          type="tel"
          required
          value={formData.clientPhone}
          onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="+44 7123 456789"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email (optional)</label>
        <input
          type="email"
          value={formData.clientEmail}
          onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="john@example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Date *</label>
          <input
            type="date"
            required
            min={format(new Date(), 'yyyy-MM-dd')}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Time *</label>
          <input
            type="time"
            required
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Duration (hours) *</label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value={1}>1 hour</option>
          <option value={2}>2 hours</option>
          <option value={3}>3 hours</option>
          <option value={4}>4 hours</option>
          <option value={6}>6 hours</option>
          <option value={12}>12 hours (overnight)</option>
          <option value={24}>24 hours</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Service Type *</label>
        <div className="grid grid-cols-2 gap-3">
          {services.incall && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, serviceType: 'incall' })}
              className={`px-4 py-3 border rounded-lg transition-all ${
                formData.serviceType === 'incall'
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border hover:border-accent'
              }`}
            >
              <div className="font-semibold">Incall</div>
              <div className="text-sm">£{services.rates.incall}/h</div>
            </button>
          )}
          {services.outcall && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, serviceType: 'outcall' })}
              className={`px-4 py-3 border rounded-lg transition-all ${
                formData.serviceType === 'outcall'
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border hover:border-accent'
              }`}
            >
              <div className="font-semibold">Outcall</div>
              <div className="text-sm">£{services.rates.outcall}/h</div>
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Location *</label>
        <input
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Mayfair, London"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Special Requests (optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          placeholder="Any special requests or preferences..."
        />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-accent">£{totalAmount}</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Confirm Booking'}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          You'll receive confirmation within 30 minutes
        </p>
      </div>
    </form>
  )
}
