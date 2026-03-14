// @ts-nocheck
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const OCCASIONS = ['Leisure', 'Birthday', 'Anniversary', 'Business', 'Other']
const CURRENCIES = ['GBP', 'EUR', 'USD', 'AED']
const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', EUR: '€', USD: '$', AED: 'AED ' }
const TIME_SLOTS: string[] = []
for (let h = 8; h < 24; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`)
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`)
}

function BookingContent() {
  const searchParams = useSearchParams()
  const prefilledSlug = searchParams.get('modelSlug')

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [models, setModels] = useState<any[]>([])
  const [callRates, setCallRates] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])

  // Step 1 fields
  const [selectedModel, setSelectedModel] = useState<any>(null)
  const [modelDetail, setModelDetail] = useState<any>(null)
  const [selectedModel2, setSelectedModel2] = useState<any>(null)
  const [callType, setCallType] = useState<'incall' | 'outcall'>('incall')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selectedRate, setSelectedRate] = useState<any>(null)
  const [districtId, setDistrictId] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [address, setAddress] = useState('')
  const [selectedExtras, setSelectedExtras] = useState<any[]>([])
  const [occasion, setOccasion] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [restaurantNeeded, setRestaurantNeeded] = useState(false)
  const [transportNeeded, setTransportNeeded] = useState(false)
  const [currency, setCurrency] = useState('GBP')

  // Step 2 fields
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [preferredContact, setPreferredContact] = useState('whatsapp')
  const [telegramUsername, setTelegramUsername] = useState('')

  // Step 3
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/public/models?limit=100').then(r => r.json()),
      fetch('/api/v1/call-rates').then(r => r.json()),
      fetch('/api/public/districts').then(r => r.json()),
    ]).then(([modelsRes, ratesRes, districtsRes]) => {
      setModels(modelsRes.data || [])
      setCallRates((ratesRes.data || []).filter((r: any) => r.isActive))
      setDistricts(districtsRes.data || [])

      if (prefilledSlug) {
        const found = (modelsRes.data || []).find((m: any) => m.slug === prefilledSlug)
        if (found) {
          setSelectedModel(found)
          loadModelDetail(prefilledSlug)
        }
      }
    })
  }, [])

  const loadModelDetail = async (slug: string) => {
    const res = await fetch(`/api/public/models/${slug}`)
    const data = await res.json()
    if (data.success) setModelDetail(data.data)
  }

  const handleModelSelect = (modelId: string) => {
    const model = models.find((m: any) => m.id === modelId)
    if (model) {
      setSelectedModel(model)
      setSelectedModel2(null)
      setSelectedRate(null)
      setSelectedExtras([])
      loadModelDetail(model.slug)
    }
  }

  // Computed prices
  const basePrice = selectedRate
    ? (callType === 'incall' ? selectedRate.incallPrice : selectedRate.outcallPrice) || 0
    : 0
  const extrasTotal = selectedExtras.reduce((sum: number, e: any) => sum + (e.extraPrice || 0), 0)
  const grandTotal = basePrice + extrasTotal

  const cs = CURRENCY_SYMBOLS[currency] || '£'

  // Available rates for selected model
  const availableRates = modelDetail?.modelRates
    ?.filter((r: any) => callType === 'incall' ? r.incallPrice > 0 : r.outcallPrice > 0)
    ?.sort((a: any, b: any) => (a.callRateMaster?.sortOrder || 0) - (b.callRateMaster?.sortOrder || 0)) || []

  // Available extras
  const availableExtras = modelDetail?.services
    ?.filter((s: any) => s.isExtra && s.extraPrice > 0) || []

  // DUO partners
  const duoPartnerIds = modelDetail?.duoPartnerIds || selectedModel?.duoPartnerIds || []
  const duoPartners = duoPartnerIds.length > 0
    ? models.filter((m: any) => duoPartnerIds.includes(m.id))
    : []

  const toggleExtra = (extra: any) => {
    setSelectedExtras(prev =>
      prev.find((e: any) => e.id === extra.id)
        ? prev.filter((e: any) => e.id !== extra.id)
        : [...prev, extra]
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const validateStep1 = () => {
    if (!selectedRate) return 'Please select a duration'
    if (!date) return 'Please select a date'
    if (callType === 'outcall' && !districtId && !hotelName && !address) {
      return 'Please provide a location for outcall'
    }
    return null
  }

  const validateStep2 = () => {
    if (!clientName.trim()) return 'Please enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return 'Please enter a valid email'
    if (clientPhone.length < 10) return 'Please enter a valid phone number'
    return null
  }

  const goNext = () => {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      setError(null)
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      setError(null)
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!ageConfirmed) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/booking-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          clientTelegramId: telegramUsername || null,
          preferredContact,
          modelId: selectedModel?.id || null,
          model2Id: selectedModel2?.id || null,
          districtId: districtId || null,
          callType,
          date: date && time ? new Date(`${date}T${time}`).toISOString() : new Date(`${date}T12:00`).toISOString(),
          duration: selectedRate?.callRateMaster?.durationMin || 60,
          hotelName: hotelName || null,
          roomNumber: roomNumber || null,
          address: address || null,
          basePrice,
          extrasTotal,
          grandTotal,
          currency,
          selectedExtras: selectedExtras.map((e: any) => ({ id: e.id, name: e.name, price: e.extraPrice })),
          specialRequests: specialRequests || null,
          occasion: occasion || null,
          restaurantNeeded,
          transportNeeded,
          source: 'website',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setRequestId(data.requestId)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepLabel = (n: number, label: string) => {
    const isActive = step === n
    const isDone = step > n
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: isDone ? 'pointer' : 'default', opacity: isActive || isDone ? 1 : 0.35 }}
        onClick={() => isDone && setStep(n as 1 | 2 | 3)}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 500,
          background: isActive ? '#C5A572' : isDone ? 'rgba(197,165,114,0.15)' : 'rgba(255,255,255,0.05)',
          color: isActive ? '#0A0A0A' : isDone ? '#C5A572' : '#6b6560',
        }}>
          {isDone ? '✓' : n}
        </div>
        <span style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: isActive ? '#f0e8dc' : '#6b6560' }}>{label}</span>
      </div>
    )
  }

  if (submitted) {
    return (
      <main style={rootStyle}>
        <style>{fontImport}</style>
        <Header />
        <section style={{ maxWidth: 640, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>✓</div>
          <h1 style={{ fontFamily: serif, fontSize: 40, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Thank you, {clientName}!
          </h1>
          <p style={{ fontSize: 15, color: '#6b6560', lineHeight: 1.8, margin: '0 0 32px' }}>
            Your booking request has been received.<br />
            Our team will contact you within 15 minutes via {preferredContact}.
          </p>
          {requestId && (
            <p style={{ fontSize: 13, color: '#C5A572', letterSpacing: '.15em', margin: '0 0 48px' }}>
              Reference: #VRL-{requestId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <Link href="/companions" style={btnStyle}>Browse More Companions</Link>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main style={rootStyle}>
      <style>{fontImport}{formStyles}</style>
      <Header />
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 80px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24 }}>Book a Companion</p>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 48px' }}>
          Your Experience Awaits
        </h1>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 48 }}>
          {stepLabel(1, 'Select Experience')}
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          {stepLabel(2, 'Your Details')}
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          {stepLabel(3, 'Confirm')}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)', color: '#e55', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Companion Select */}
            <div>
              <label style={labelStyle}>Companion</label>
              <select style={selectStyle} value={selectedModel?.id || ''} onChange={e => handleModelSelect(e.target.value)}>
                <option value="">Select a companion...</option>
                {models.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* DUO */}
            {duoPartners.length > 0 && (
              <div>
                <label style={labelStyle}>Duo Partner (optional)</label>
                <select style={selectStyle} value={selectedModel2?.id || ''} onChange={e => {
                  const m = models.find((m: any) => m.id === e.target.value)
                  setSelectedModel2(m || null)
                }}>
                  <option value="">No duo partner</option>
                  {duoPartners.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Call Type */}
            <div>
              <label style={labelStyle}>Call Type</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['incall', 'outcall'] as const).map(ct => (
                  <button key={ct} onClick={() => { setCallType(ct); setSelectedRate(null) }}
                    style={{
                      ...chipStyle,
                      background: callType === ct ? '#C5A572' : 'rgba(255,255,255,0.04)',
                      color: callType === ct ? '#0A0A0A' : '#6b6560',
                      borderColor: callType === ct ? '#C5A572' : 'rgba(255,255,255,0.1)',
                    }}>
                    {ct === 'incall' ? 'Incall' : 'Outcall'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Time</label>
                <select style={selectStyle} value={time} onChange={e => setTime(e.target.value)}>
                  <option value="">Select time...</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={labelStyle}>Duration</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(modelDetail ? availableRates : callRates).map((rate: any) => {
                  const r = modelDetail ? rate : rate
                  const label = modelDetail ? rate.callRateMaster?.label : rate.label
                  const price = modelDetail ? (callType === 'incall' ? rate.incallPrice : rate.outcallPrice) : null
                  const id = modelDetail ? rate.id : rate.id
                  return (
                    <label key={id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      border: `1px solid ${selectedRate?.id === id ? 'rgba(197,165,114,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: selectedRate?.id === id ? 'rgba(197,165,114,0.06)' : 'transparent',
                      cursor: 'pointer',
                    }}>
                      <input type="radio" name="duration" checked={selectedRate?.id === id}
                        onChange={() => setSelectedRate(rate)}
                        style={{ accentColor: '#C5A572' }} />
                      <span style={{ flex: 1, fontSize: 14, color: '#ddd5c8' }}>{label}</span>
                      {price != null && <span style={{ fontSize: 14, color: '#C5A572' }}>{cs}{price}</span>}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Outcall location */}
            {callType === 'outcall' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <label style={labelStyle}>Location Details</label>
                <select style={selectStyle} value={districtId} onChange={e => setDistrictId(e.target.value)}>
                  <option value="">Select district...</option>
                  {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input placeholder="Hotel name" value={hotelName} onChange={e => setHotelName(e.target.value)} style={inputStyle} />
                <input placeholder="Room number" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} style={inputStyle} />
                <input placeholder="Address (if not hotel)" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
              </div>
            )}

            {/* Extras */}
            {availableExtras.length > 0 && (
              <div>
                <label style={labelStyle}>Extras</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {availableExtras.map((extra: any) => (
                    <label key={extra.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                      border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                    }}>
                      <input type="checkbox"
                        checked={selectedExtras.some((e: any) => e.id === extra.id)}
                        onChange={() => toggleExtra(extra)}
                        style={{ accentColor: '#C5A572' }} />
                      <span style={{ flex: 1, fontSize: 14, color: '#ddd5c8' }}>{extra.name}</span>
                      <span style={{ fontSize: 13, color: '#C5A572' }}>+{cs}{extra.extraPrice}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Occasion */}
            <div>
              <label style={labelStyle}>Occasion (optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {OCCASIONS.map(o => (
                  <button key={o} onClick={() => setOccasion(occasion === o ? '' : o)}
                    style={{
                      ...chipStyle,
                      background: occasion === o ? '#C5A572' : 'rgba(255,255,255,0.04)',
                      color: occasion === o ? '#0A0A0A' : '#6b6560',
                      borderColor: occasion === o ? '#C5A572' : 'rgba(255,255,255,0.1)',
                    }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label style={labelStyle}>Special Requests (optional)</label>
              <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                rows={3} placeholder="Any special requirements or preferences..."
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6b6560', cursor: 'pointer' }}>
                <input type="checkbox" checked={restaurantNeeded} onChange={e => setRestaurantNeeded(e.target.checked)} style={{ accentColor: '#C5A572' }} />
                Restaurant arrangement needed
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6b6560', cursor: 'pointer' }}>
                <input type="checkbox" checked={transportNeeded} onChange={e => setTransportNeeded(e.target.checked)} style={{ accentColor: '#C5A572' }} />
                Transport / chauffeur needed
              </label>
            </div>

            {/* Price Summary */}
            {selectedRate && (
              <div style={{ padding: 20, border: '1px solid rgba(197,165,114,0.2)', background: 'rgba(197,165,114,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ddd5c8', marginBottom: 8 }}>
                  <span>Base</span><span>{cs}{basePrice}</span>
                </div>
                {extrasTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ddd5c8', marginBottom: 8 }}>
                    <span>Extras</span><span>+{cs}{extrasTotal}</span>
                  </div>
                )}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 500, color: '#C5A572' }}>
                  <span>Total</span><span>{cs}{grandTotal}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    style={{ ...selectStyle, padding: '6px 10px', fontSize: 12, width: 'auto' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button onClick={goNext} style={primaryBtnStyle}>Continue</button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+44 7xxx xxx xxx" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Preferred Contact</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['whatsapp', 'telegram', 'phone', 'email'].map(c => (
                  <button key={c} onClick={() => setPreferredContact(c)}
                    style={{
                      ...chipStyle,
                      background: preferredContact === c ? '#C5A572' : 'rgba(255,255,255,0.04)',
                      color: preferredContact === c ? '#0A0A0A' : '#6b6560',
                      borderColor: preferredContact === c ? '#C5A572' : 'rgba(255,255,255,0.1)',
                    }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {preferredContact === 'telegram' && (
              <div>
                <label style={labelStyle}>Telegram Username</label>
                <input value={telegramUsername} onChange={e => setTelegramUsername(e.target.value)} placeholder="@username" style={inputStyle} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ ...btnStyle, flex: 1 }}>Back</button>
              <button onClick={goNext} style={{ ...primaryBtnStyle, flex: 2 }}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: '#f0e8dc', margin: '0 0 20px' }}>Booking Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                {selectedModel && <SummaryRow label="Companion" value={selectedModel.name} />}
                {selectedModel2 && <SummaryRow label="Duo Partner" value={selectedModel2.name} />}
                {date && <SummaryRow label="Date" value={`${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${time ? ` at ${time}` : ''}`} />}
                {selectedRate && <SummaryRow label="Duration" value={selectedRate.callRateMaster?.label || selectedRate.label} />}
                <SummaryRow label="Type" value={callType === 'incall' ? 'Incall' : 'Outcall'} />
                {callType === 'outcall' && hotelName && <SummaryRow label="Location" value={`${hotelName}${roomNumber ? `, Room ${roomNumber}` : ''}`} />}
                {occasion && <SummaryRow label="Occasion" value={occasion} />}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                <SummaryRow label="Base" value={`${cs}${basePrice}`} />
                {selectedExtras.map((e: any) => (
                  <SummaryRow key={e.id} label={e.name} value={`+${cs}${e.extraPrice}`} />
                ))}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 500, color: '#C5A572' }}>
                <span>Total</span><span>{cs}{grandTotal} {currency}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />
              <div style={{ fontSize: 13, color: '#6b6560' }}>
                Contact: {clientName} · {clientPhone} · via {preferredContact}
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#4a4540', lineHeight: 1.7, border: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
              All services are for companionship only. Any activities between consenting adults are a matter of personal choice. By submitting this request you confirm you are 18 years of age or older.
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#ddd5c8', cursor: 'pointer' }}>
              <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} style={{ accentColor: '#C5A572', marginTop: 3 }} />
              <span style={{ fontSize: 13, color: '#9a9189' }}>I confirm I am 18 years of age or older and agree to the terms of service.</span>
            </label>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ ...btnStyle, flex: 1 }}>Back</button>
              <button onClick={handleSubmit} disabled={!ageConfirmed || isSubmitting}
                style={{ ...primaryBtnStyle, flex: 2, opacity: !ageConfirmed || isSubmitting ? 0.4 : 1 }}>
                {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
              </button>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ddd5c8' }}>
      <span style={{ color: '#6b6560' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <main style={rootStyle}>
        <Header />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <p style={{ color: '#6b6560', fontSize: 14 }}>Loading booking form...</p>
        </div>
        <Footer />
      </main>
    }>
      <BookingContent />
    </Suspense>
  )
}

const serif = 'Cormorant Garamond, serif'
const rootStyle: React.CSSProperties = { background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }
const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');`
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6b6560', marginBottom: 8 }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f0e8dc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' as any }
const chipStyle: React.CSSProperties = {
  padding: '10px 20px', border: '1px solid', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
}
const btnStyle: React.CSSProperties = {
  padding: '14px 28px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
  color: '#ddd5c8', fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
  textDecoration: 'none', textAlign: 'center', display: 'inline-block',
}
const primaryBtnStyle: React.CSSProperties = {
  padding: '14px 28px', border: '1px solid #C5A572', background: '#C5A572',
  color: '#0A0A0A', fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
}
const formStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
  select option { background: #1a1a1a; color: #ddd5c8; }
`
