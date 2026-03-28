// @ts-nocheck
'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import './book.css'

const DURATION_LABELS: Record<string, { label: string; durationMin: number; sort: number }> = {
  '30min': { label: '30 Minutes', durationMin: 30, sort: 1 },
  '45min': { label: '45 Minutes', durationMin: 45, sort: 2 },
  '1hour': { label: '1 Hour', durationMin: 60, sort: 3 },
  '90min': { label: '90 Minutes', durationMin: 90, sort: 4 },
  '2hours': { label: '2 Hours', durationMin: 120, sort: 5 },
  '3hours': { label: '3 Hours', durationMin: 180, sort: 6 },
  '4hours': { label: '4 Hours', durationMin: 240, sort: 7 },
  'overnight': { label: 'Overnight (9 hrs)', durationMin: 540, sort: 8 },
}

const DURATION_MIN_MAP: Record<number, string> = {
  30: '30min',
  45: '45min',
  60: '1hour',
  90: '90min',
  120: '2hours',
  180: '3hours',
  240: '4hours',
  540: 'overnight',
}

const OCCASIONS = ['Leisure', 'Birthday', 'Anniversary', 'Business', 'Other']
const CURRENCIES = ['GBP', 'EUR', 'USD', 'AED']
const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', EUR: '€', USD: '$', AED: 'AED ' }
const TIME_SLOTS: string[] = []
for (let h = 8; h < 24; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`)
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`)
}

/* ─── Section header component ─── */
function SectionHeader({ number, title, optional }: { number: string; title: string; optional?: boolean }) {
  return (
    <div className="section-header">
      <span className="section-number">{number}</span>
      <span className="section-title">{title}</span>
      <div className="section-line" />
      {optional && <span className="section-optional">optional</span>}
    </div>
  )
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
  const [customDuration, setCustomDuration] = useState('')

  // Step 2 fields
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [preferredContact, setPreferredContact] = useState('whatsapp')
  const [telegramUsername, setTelegramUsername] = useState('')

  // Step 3
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  // Dropdown states
  const [companionOpen, setCompanionOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [durationOpen, setDurationOpen] = useState(false)

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/public/models?limit=100').then(r => r.json()),
      fetch('/api/public/districts').then(r => r.json()),
    ]).then(([modelsRes, districtsRes]) => {
      setModels(modelsRes.data || [])
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

  const handleModelSelect = (model: any) => {
    setSelectedModel(model)
    setSelectedModel2(null)
    setSelectedRate(null)
    setSelectedExtras([])
    setCompanionOpen(false)
    loadModelDetail(model.slug)
  }

  // Build rates from modelDetail.modelRates (includes embedded callRateMaster)
  const buildMergedRates = () => {
    if (!modelDetail?.modelRates?.length) return []

    // First pass: build all rates and identify 2h + extra-hour for synthesising 3h
    let twoHourRate: any = null
    let extraHourRate: any = null

    const baseRates = modelDetail.modelRates
      .map((mr: any) => {
        const master = mr.callRateMaster
        if (!master || !master.isActive) return null
        const price = callType === 'incall' ? mr.incallPrice : mr.outcallPrice
        const durationKey = DURATION_MIN_MAP[master.durationMin] || master.label?.toLowerCase().replace(/\s+/g, '')

        // Track 2-hour and extra-hour rates for 3h synthesis
        if (durationKey === '2hours') twoHourRate = { price }
        if (durationKey === 'extrahour' || durationKey === 'extra_hour' || master.label?.toLowerCase().includes('extra hour')) {
          extraHourRate = { price }
          return null // exclude Extra Hour from the list
        }

        return {
          id: mr.id,
          callRateMasterId: mr.callRateMasterId,
          label: master.label,
          durationMin: master.durationMin,
          sortOrder: master.sortOrder,
          price: price,
          durationType: durationKey,
          available: price != null && price > 0,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)

    // Synthesise or fill a 3-hour price from 2h + extra-hour when possible
    if (twoHourRate?.price > 0 && extraHourRate?.price > 0) {
      const threeHourPrice = twoHourRate.price + extraHourRate.price
      const native3h = baseRates.find((r: any) => r.durationType === '3hours')
      if (native3h && !native3h.available) {
        // Native 3h exists but has no price — fill it with computed price
        native3h.price = threeHourPrice
        native3h.available = true
      } else if (!native3h) {
        // No native 3h at all — insert a synthetic one after 2h
        const insertIdx = baseRates.findIndex((r: any) => r.sortOrder > 5)
        const synth = {
          id: '__3hours_synth',
          callRateMasterId: null,
          label: '3 Hours',
          durationMin: 180,
          sortOrder: 5.5,
          price: threeHourPrice,
          durationType: '3hours',
          available: true,
        }
        if (insertIdx === -1) baseRates.push(synth)
        else baseRates.splice(insertIdx, 0, synth)
      }
    }

    return baseRates
  }

  const displayRates = buildMergedRates()

  // Computed prices
  const basePrice = selectedRate?.price || 0
  const extrasTotal = selectedExtras.reduce((sum: number, e: any) => sum + (e.extraPrice || 0), 0)
  const grandTotal = basePrice + extrasTotal
  const cs = CURRENCY_SYMBOLS[currency] || '£'

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
    if (!selectedRate && !customDuration) return 'Please select a duration'
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
          duration: selectedRate?.durationMin || (customDuration ? parseInt(customDuration) || 60 : 60),
          hotelName: hotelName || null,
          roomNumber: roomNumber || null,
          address: address || null,
          basePrice,
          extrasTotal,
          grandTotal,
          currency,
          selectedExtras: selectedExtras.map((e: any) => ({ id: e.id, name: e.name, price: e.extraPrice })),
          specialRequests: specialRequests || (customDuration ? `Custom duration: ${customDuration}` : null),
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

  const getDurationLabel = () => {
    if (customDuration) return `Custom: ${customDuration}`
    if (!selectedRate) return null
    return selectedRate.label || DURATION_LABELS[selectedRate.durationType]?.label || selectedRate.durationType
  }

  const hasSummary = selectedModel && selectedRate && date

  // Format date for display
  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (submitted) {
    return (
      <main className="book-page">
        <section className="book-success">
          <div className="book-success-icon">✓</div>
          <h1>Thank you, {clientName}!</h1>
          <p>
            Your booking request has been received.<br />
            Our team will contact you within 15 minutes via {preferredContact}.
          </p>
          {requestId && (
            <p className="book-success-ref">
              Reference: #VRL-{requestId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <Link href="/companions" className="book-success-link">Browse More Companions</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="book-page">
      <section className="book-container">
        <p className="book-eyebrow">Book a Companion</p>
        <h1 className="book-title">Your Experience Awaits</h1>

        {error && <div className="book-error">{error}</div>}

        {/* ═══ STEP 1 ═══ */}
        {step === 1 && (
          <>
            {/* 01 — COMPANION */}
            <div className="book-section">
              <SectionHeader number="01" title="Select Companion" />
              <div className="custom-dropdown">
                <button
                  className={`custom-dropdown-trigger ${companionOpen ? 'open' : ''}`}
                  onClick={() => setCompanionOpen(!companionOpen)}
                  type="button"
                >
                  {selectedModel ? (
                    <span className="companion-selected">
                      {selectedModel.coverPhotoUrl ? (
                        <img src={selectedModel.coverPhotoUrl} alt="" className="companion-avatar" />
                      ) : (
                        <span className="companion-avatar-placeholder">
                          {selectedModel.name?.charAt(0)}
                        </span>
                      )}
                      <span>{selectedModel.name}</span>
                    </span>
                  ) : (
                    <span className="placeholder">Select a companion...</span>
                  )}
                  <span className="chevron">▼</span>
                </button>

                {companionOpen && (
                  <>
                    <div className="dropdown-overlay" onClick={() => setCompanionOpen(false)} />
                    <div className="custom-dropdown-list">
                      {models.map((m: any) => (
                        <div
                          key={m.id}
                          className={`companion-option ${selectedModel?.id === m.id ? 'selected' : ''}`}
                          onClick={() => handleModelSelect(m)}
                        >
                          {m.coverPhotoUrl ? (
                            <img src={m.coverPhotoUrl} alt="" className="companion-avatar" />
                          ) : (
                            <span className="companion-avatar-placeholder">
                              {m.name?.charAt(0)}
                            </span>
                          )}
                          <span className="companion-option-name">{m.name}</span>
                          {m.startingPrice && (
                            <span className="companion-option-price">from £{m.startingPrice}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* DUO partner */}
              {duoPartners.length > 0 && (
                <div className="duo-section">
                  <span className="field-label">Duo Partner (optional)</span>
                  <div className="custom-dropdown">
                    <select
                      className="book-select"
                      value={selectedModel2?.id || ''}
                      onChange={e => {
                        const m = models.find((m: any) => m.id === e.target.value)
                        setSelectedModel2(m || null)
                      }}
                    >
                      <option value="">No duo partner</option>
                      {duoPartners.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 02 — LOCATION PREFERENCE */}
            <div className="book-section">
              <SectionHeader number="02" title="Location Preference" />
              <div className="location-cards">
                <button
                  className={`location-card ${callType === 'incall' ? 'active' : ''}`}
                  onClick={() => { setCallType('incall'); setSelectedRate(null) }}
                  type="button"
                >
                  <span className="location-card-title">Incall</span>
                  <span className="location-card-desc">Our private location, central London</span>
                </button>
                <button
                  className={`location-card ${callType === 'outcall' ? 'active' : ''}`}
                  onClick={() => { setCallType('outcall'); setSelectedRate(null) }}
                  type="button"
                >
                  <span className="location-card-title">Outcall</span>
                  <span className="location-card-desc">Your hotel or residence + transport</span>
                </button>
              </div>

              {/* Outcall location fields */}
              {callType === 'outcall' && (
                <div className="outcall-fields">
                  <span className="field-label">Location Details</span>
                  <select className="book-select" value={districtId} onChange={e => setDistrictId(e.target.value)}>
                    <option value="">Select district...</option>
                    {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input className="book-input" placeholder="Hotel name" value={hotelName} onChange={e => setHotelName(e.target.value)} />
                  <input className="book-input" placeholder="Room number" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} />
                  <input className="book-input" placeholder="Address (if not hotel)" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              )}
            </div>

            {/* 03 — DATE & TIME */}
            <div className="book-section">
              <SectionHeader number="03" title="Date & Time" />
              <div className="datetime-row">
                <div>
                  <span className="field-label">Date</span>
                  <input
                    type="date"
                    className="book-input"
                    min={today}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <span className="field-label">Time</span>
                  <div className="custom-dropdown">
                    <button
                      className={`custom-dropdown-trigger ${timeOpen ? 'open' : ''}`}
                      onClick={() => setTimeOpen(!timeOpen)}
                      type="button"
                    >
                      {time ? <span>{time}</span> : <span className="placeholder">Select time...</span>}
                      <span className="chevron">▼</span>
                    </button>
                    {timeOpen && (
                      <>
                        <div className="dropdown-overlay" onClick={() => setTimeOpen(false)} />
                        <div className="custom-dropdown-list">
                          {TIME_SLOTS.map(t => (
                            <div
                              key={t}
                              className={`duration-option ${time === t ? 'selected' : ''}`}
                              onClick={() => { setTime(t); setTimeOpen(false) }}
                            >
                              <span className="duration-option-label">{t}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 04 — DURATION */}
            <div className="book-section">
              <SectionHeader number="04" title="Duration" />
              <div className="custom-dropdown">
                <button
                  className={`custom-dropdown-trigger ${durationOpen ? 'open' : ''}`}
                  onClick={() => setDurationOpen(!durationOpen)}
                  type="button"
                >
                  {selectedRate ? (
                    <span>
                      {selectedRate.label || DURATION_LABELS[selectedRate.durationType]?.label || selectedRate.durationType}
                      {selectedRate.price != null && ` — ${cs}${selectedRate.price.toLocaleString()}`}
                    </span>
                  ) : customDuration ? (
                    <span>Custom: {customDuration}</span>
                  ) : (
                    <span className="placeholder">Select duration...</span>
                  )}
                  <span className="chevron">▼</span>
                </button>

                {durationOpen && (
                  <>
                    <div className="dropdown-overlay" onClick={() => setDurationOpen(false)} />
                    <div className="custom-dropdown-list">
                      {displayRates.length === 0 && (
                        <div className="duration-option unavailable">
                          <span className="duration-option-label" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {modelDetail ? 'No rates configured' : 'Select a companion first'}
                          </span>
                        </div>
                      )}
                      {displayRates.map((rate: any) => {
                        const isUnavailable = !rate.available || (rate.price != null && rate.price <= 0)
                        return (
                          <div
                            key={rate.id}
                            className={`duration-option ${selectedRate?.id === rate.id ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                            onClick={() => {
                              if (isUnavailable) return
                              setSelectedRate(rate)
                              setCustomDuration('')
                              setDurationOpen(false)
                            }}
                          >
                            <span className="duration-option-label">
                              {rate.label || DURATION_LABELS[rate.durationType]?.label || rate.durationType}
                            </span>
                            <span className="duration-option-price">
                              {isUnavailable ? 'not available' : rate.price != null ? `${cs}${rate.price.toLocaleString()}` : ''}
                            </span>
                          </div>
                        )
                      })}

                      <div className="duration-separator" />
                      <div
                        className="duration-custom"
                        onClick={() => {
                          setSelectedRate(null)
                          setDurationOpen(false)
                          // Focus the custom input after closing
                          setTimeout(() => {
                            document.getElementById('custom-duration-input')?.focus()
                          }, 100)
                        }}
                      >
                        <div className="duration-custom-title">Custom Duration</div>
                        <div className="duration-custom-hint">e.g. 5 hours, 90 min, Weekend</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Custom duration input (shown when no rate selected or custom chosen) */}
              {!selectedRate && (
                <div className="custom-duration-input">
                  <input
                    id="custom-duration-input"
                    className="book-input"
                    placeholder="Enter custom duration..."
                    value={customDuration}
                    onChange={e => setCustomDuration(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Extras (if available) */}
            {availableExtras.length > 0 && (
              <div className="book-section">
                <SectionHeader number="04b" title="Extras" optional />
                <div className="extras-list">
                  {availableExtras.map((extra: any) => (
                    <label
                      key={extra.id}
                      className={`extra-item ${selectedExtras.some((e: any) => e.id === extra.id) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExtras.some((e: any) => e.id === extra.id)}
                        onChange={() => toggleExtra(extra)}
                      />
                      <span className="extra-item-name">{extra.name}</span>
                      <span className="extra-item-price">+{cs}{extra.extraPrice}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 05 — OCCASION */}
            <div className="book-section">
              <SectionHeader number="05" title="Occasion" optional />
              <div className="occasion-tags">
                {OCCASIONS.map(o => (
                  <button
                    key={o}
                    className={`occasion-tag ${occasion === o ? 'active' : ''}`}
                    onClick={() => setOccasion(occasion === o ? '' : o)}
                    type="button"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* 06 — SPECIAL REQUESTS */}
            <div className="book-section">
              <SectionHeader number="06" title="Special Requests" optional />
              <div className="special-checkboxes">
                <label className="special-checkbox">
                  <input type="checkbox" checked={restaurantNeeded} onChange={e => setRestaurantNeeded(e.target.checked)} />
                  Restaurant arrangement needed
                </label>
                <label className="special-checkbox">
                  <input type="checkbox" checked={transportNeeded} onChange={e => setTransportNeeded(e.target.checked)} />
                  Transport / chauffeur needed
                </label>
              </div>
              <textarea
                className="book-textarea"
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                rows={3}
                placeholder="Any special requirements or preferences..."
              />
            </div>

            {/* ─── SUMMARY ─── */}
            <div className="summary-block">
              {!hasSummary ? (
                <div className="summary-empty">
                  Select a duration to see your summary
                </div>
              ) : (
                <div className="summary-filled">
                  <div className="summary-companion-name">{selectedModel.name}</div>
                  <div className="summary-details">
                    {callType === 'incall' ? 'Incall' : 'Outcall'}
                    <span className="dot">·</span>
                    {formatDate(date)}
                    {time && <><span className="dot">·</span>{time}</>}
                  </div>

                  <div className="summary-price-row">
                    <span className="summary-duration">{getDurationLabel()}</span>
                    <span className="summary-price">{cs}{basePrice.toLocaleString()}</span>
                  </div>

                  {extrasTotal > 0 && (
                    <div className="summary-extras">
                      <span>Extras</span>
                      <span>+{cs}{extrasTotal.toLocaleString()}</span>
                    </div>
                  )}

                  {extrasTotal > 0 && (
                    <div className="summary-total-row">
                      <span className="summary-total-label">Total</span>
                      <span className="summary-total-price">{cs}{grandTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="currency-selector">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        className={`currency-btn ${currency === c ? 'active' : ''}`}
                        onClick={() => setCurrency(c)}
                        type="button"
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <button className="book-confirm-btn" onClick={goNext} type="button">
                    Continue
                  </button>

                  <div className="summary-response">Response within 30 minutes</div>
                </div>
              )}
            </div>

            {/* Fallback continue if no summary visible */}
            {!hasSummary && (
              <button className="book-confirm-btn" onClick={goNext} type="button" style={{ marginTop: 32 }}>
                Continue
              </button>
            )}
          </>
        )}

        {/* ═══ STEP 2 — YOUR DETAILS ═══ */}
        {step === 2 && (
          <div className="step-form">
            <SectionHeader number="07" title="Your Details" />

            <div className="step-form-group">
              <span className="field-label">Full Name *</span>
              <input className="book-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="step-form-group">
              <span className="field-label">Email *</span>
              <input className="book-input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="step-form-group">
              <span className="field-label">Phone *</span>
              <input className="book-input" type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+44 7xxx xxx xxx" />
            </div>
            <div className="step-form-group">
              <span className="field-label">Preferred Contact</span>
              <div className="contact-methods">
                {['whatsapp', 'telegram', 'phone', 'email'].map(c => (
                  <button
                    key={c}
                    className={`contact-btn ${preferredContact === c ? 'active' : ''}`}
                    onClick={() => setPreferredContact(c)}
                    type="button"
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {preferredContact === 'telegram' && (
              <div className="step-form-group">
                <span className="field-label">Telegram Username</span>
                <input className="book-input" value={telegramUsername} onChange={e => setTelegramUsername(e.target.value)} placeholder="@username" />
              </div>
            )}
            <div className="step-buttons">
              <button className="btn-back" onClick={() => setStep(1)} type="button">Back</button>
              <button className="btn-continue" onClick={goNext} type="button">Continue</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — CONFIRM ═══ */}
        {step === 3 && (
          <div className="step-form">
            <SectionHeader number="08" title="Confirm Booking" />

            <div className="confirm-summary">
              <h3>Booking Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedModel && <ConfirmRow label="Companion" value={selectedModel.name} />}
                {selectedModel2 && <ConfirmRow label="Duo Partner" value={selectedModel2.name} />}
                {date && (
                  <ConfirmRow
                    label="Date"
                    value={`${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${time ? ` at ${time}` : ''}`}
                  />
                )}
                {(selectedRate || customDuration) && (
                  <ConfirmRow label="Duration" value={getDurationLabel() || ''} />
                )}
                <ConfirmRow label="Type" value={callType === 'incall' ? 'Incall' : 'Outcall'} />
                {callType === 'outcall' && hotelName && (
                  <ConfirmRow label="Location" value={`${hotelName}${roomNumber ? `, Room ${roomNumber}` : ''}`} />
                )}
                {occasion && <ConfirmRow label="Occasion" value={occasion} />}
              </div>

              <div className="confirm-divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ConfirmRow label="Base" value={`${cs}${basePrice.toLocaleString()}`} />
                {selectedExtras.map((e: any) => (
                  <ConfirmRow key={e.id} label={e.name} value={`+${cs}${e.extraPrice}`} />
                ))}
              </div>

              <div className="confirm-divider" />
              <div className="confirm-total">
                <span>Total</span>
                <span>{cs}{grandTotal.toLocaleString()} {currency}</span>
              </div>
              <div className="confirm-divider" />
              <div className="confirm-contact">
                Contact: {clientName} · {clientPhone} · via {preferredContact}
              </div>
            </div>

            <div className="confirm-legal">
              All services are for companionship only. Any activities between consenting adults are a matter of personal choice. By submitting this request you confirm you are 18 years of age or older.
            </div>

            <label className="confirm-age-label">
              <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} />
              <span>I confirm I am 18 years of age or older and agree to the terms of service.</span>
            </label>

            <div className="step-buttons">
              <button className="btn-back" onClick={() => setStep(2)} type="button">Back</button>
              <button
                className="btn-continue"
                onClick={handleSubmit}
                disabled={!ageConfirmed || isSubmitting}
                type="button"
                style={{ opacity: !ageConfirmed || isSubmitting ? 0.4 : 1 }}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="confirm-row">
      <span className="confirm-row-label">{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <main className="book-page">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading booking form...</p>
        </div>
      </main>
    }>
      <BookingContent />
    </Suspense>
  )
}
