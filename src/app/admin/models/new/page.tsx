'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PillToggle from '@/components/ui/PillToggle'
import StickyFormFooter from '@/components/ui/StickyFormFooter'
import {
  NATIONALITIES, ETHNICITIES, LANGUAGES, LANGUAGE_LEVELS,
  LONDON_STATIONS, HEIGHTS, WEIGHTS, DRESS_SIZES, FOOT_SIZES,
  BUST_SIZES, BUST_TYPES, EYE_COLORS, HAIR_COLORS, HAIR_LENGTHS,
  SMOKING, TATTOOS, PIERCINGS, ORIENTATIONS, TRAVEL_OPTIONS,
  AVAILABILITY_DAYS, WARDROBE_OPTIONS, PAYMENT_METHODS,
  PREFERENCE_FIELDS, MODEL_STATUSES,
} from '@/constants/model-form'

/* ─── Types ─── */
interface LanguageEntry { language: string; level: string }

interface FormData {
  // Step 1 — Identity & Profile
  name: string; workingName: string; dateOfBirth: string; ageForWeb: string;
  nationality: string; ethnicity: string;
  internalRating: number; status: string;
  tagline: string; bio: string; internalNotes: string;
  // Step 2 — Physical Stats
  height: string; weight: string; dressSize: string; footSize: string;
  bustSize: string; bustType: string; eyeColor: string; hairColor: string;
  hairLength: string; measurements: string; orientation: string;
  smoking: string; tattoo: string; piercings: string[];
  languages: LanguageEntry[];
  preferences: Record<string, boolean>;
  // Step 3 — Rates & Services
  offersIncall: boolean; offersOutcall: boolean;
  rates: Record<string, { incall: string; outcall: string }>;
  selectedServices: Record<string, { enabled: boolean; extraPrice: string }>;
  // Step 4 — Location & Contact
  phone: string; phone2: string; email: string;
  telegramPhone: string; telegramTag: string;
  whatsapp: boolean; telegram: boolean; viber: boolean; signal: boolean;
  postcode: string; street: string; houseNumber: string; floor: string; flatNumber: string;
  nearestStation: string;
  availableAllDay: boolean; availableDays: string[];
  hasFlatmates: boolean;
  wardrobe: string[];
  payments: Record<string, boolean>;
  // Step 5 — Photos & Publish
  photos: File[];
}

interface CallRate { id: string; label: string; durationMin: number; sortOrder: number; isActive: boolean }
interface Service { id: string; title: string; category: string; isPublic: boolean; isExtra?: boolean }

const STEPS = [
  'Identity & Profile',
  'Physical Stats',
  'Rates & Services',
  'Location & Contact',
  'Photos & Publish',
]

const defaultFormData: FormData = {
  name: '', workingName: '', dateOfBirth: '', ageForWeb: '',
  nationality: '', ethnicity: '',
  internalRating: 0, status: 'draft',
  tagline: '', bio: '', internalNotes: '',
  height: '', weight: '', dressSize: '', footSize: '',
  bustSize: '', bustType: '', eyeColor: '', hairColor: '',
  hairLength: '', measurements: '', orientation: '',
  smoking: '', tattoo: '', piercings: [],
  languages: [{ language: '', level: '' }],
  preferences: {},
  offersIncall: true, offersOutcall: true,
  rates: {},
  selectedServices: {},
  phone: '', phone2: '', email: '',
  telegramPhone: '', telegramTag: '',
  whatsapp: false, telegram: false, viber: false, signal: false,
  postcode: '', street: '', houseNumber: '', floor: '', flatNumber: '',
  nearestStation: '',
  availableAllDay: true, availableDays: [],
  hasFlatmates: false,
  wardrobe: [],
  payments: {},
  photos: [],
}

const LS_KEY = 'virel_new_model_draft'

/* ─── Small helpers ─── */

function SearchableSelect({
  value, onChange, options, placeholder = 'Search...',
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? query : value}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); setQuery('') }}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800 shadow-lg">
          {filtered.slice(0, 30).map(opt => (
            <button
              key={opt} type="button"
              onMouseDown={() => { onChange(opt); setOpen(false); setQuery('') }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700 ${opt === value ? 'bg-zinc-700 text-amber-400' : 'text-zinc-200'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2 pt-6 mb-4">
      {children}
    </h3>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-300 mb-1">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text', disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
    />
  )
}

function SelectInput({
  value, onChange, options, placeholder = 'Select...',
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}) {
  const normalized = (options as any[]).map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
    >
      <option value="">{placeholder}</option>
      {normalized.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
      <input
        type="checkbox" checked={checked} onChange={onChange}
        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-amber-500 cursor-pointer"
      />
      {label}
    </label>
  )
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null
  return <p className="text-red-400 text-xs mt-1">{text}</p>
}

/* ─── Main Component ─── */

export default function NewModelPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]))
  const [form, setForm] = useState<FormData>({ ...defaultFormData })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [generatingBio, setGeneratingBio] = useState(false)

  // Step 3 data
  const [callRates, setCallRates] = useState<CallRate[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [activeServiceTab, setActiveServiceTab] = useState('')

  // Photo previews
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      if (prev[key as string]) {
        const next = { ...prev }
        delete next[key as string]
        return next
      }
      return prev
    })
  }, [])

  // localStorage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Don't restore photos (File objects can't be serialized)
        delete parsed.photos
        setForm(prev => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const { photos, ...rest } = form
      localStorage.setItem(LS_KEY, JSON.stringify(rest))
    } catch {}
  }, [form])

  // Fetch call rates + services when entering step 3
  useEffect(() => {
    if (step === 2 && callRates.length === 0) {
      setLoadingRates(true)
      fetch('/api/v1/call-rates')
        .then(r => r.json())
        .then(json => {
          if (json.success) {
            const active = (json.data as CallRate[]).filter(r => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
            setCallRates(active)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingRates(false))
    }
    if (step === 2 && services.length === 0) {
      setLoadingServices(true)
      fetch('/api/v1/services')
        .then(r => r.json())
        .then(json => {
          if (json.success) {
            setServices(json.services as Service[])
            const cats = [...new Set((json.services as Service[]).map(s => s.category))]
            if (cats.length > 0) setActiveServiceTab(cats[0])
          }
        })
        .catch(() => {})
        .finally(() => setLoadingServices(false))
    }
  }, [step, callRates.length, services.length])

  /* ─── Validation ─── */

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {}

    if (s === 0) {
      if (!form.name.trim()) errs.name = 'Name is required'
      if (!form.dateOfBirth) {
        errs.dateOfBirth = 'Date of birth is required'
      } else {
        const dob = new Date(form.dateOfBirth)
        const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        if (age < 18) errs.dateOfBirth = 'Must be at least 18 years old'
      }
    }

    if (s === 2) {
      const hasAnyRate = Object.values(form.rates).some(r => r.incall || r.outcall)
      if (!hasAnyRate) errs.rates = 'At least one rate is required (1hr incall or outcall)'
    }

    if (s === 3) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goNext() {
    if (validateStep(step)) {
      const next = Math.min(step + 1, 4)
      setVisitedSteps(prev => new Set([...prev, next]))
      setStep(next)
    }
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0))
  }

  function goToStep(s: number) {
    setVisitedSteps(prev => new Set([...prev, s]))
    setErrors({})
    setStep(s)
  }

  /* ─── Photo handling ─── */

  function handlePhotoAdd(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    const updatedPhotos = [...form.photos, ...newFiles]
    set('photos', updatedPhotos)
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removePhoto(idx: number) {
    set('photos', form.photos.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  /* ─── AI Bio Generation ─── */
  async function generateBio() {
    setGeneratingBio(true)
    try {
      // We need a model ID for the API, but since this is a new model,
      // we generate a placeholder bio based on form data
      const prompt = `Write a sophisticated, glamorous companion profile bio.
Name: ${form.name}. ${form.nationality ? `${form.nationality}. ` : ''}${form.tagline ? `${form.tagline}. ` : ''}
150-200 words. Warm, intriguing, luxury tone. Never explicit. First person optional.
Return ONLY valid JSON: {"bio": "...", "tagline": "..."}`

      const res = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        if (data.data.bio) set('bio', data.data.bio)
        if (data.data.tagline && !form.tagline) set('tagline', data.data.tagline)
      }
    } catch {
      // Silent fail — AI is optional
    } finally {
      setGeneratingBio(false)
    }
  }

  /* ─── Save ─── */

  async function handleSave(asDraft = false) {
    if (!asDraft && !validateStep(3)) { setStep(3); return }
    setSubmitting(true)
    setSubmitError('')

    try {
      const slug = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      let age: number | undefined
      if (form.ageForWeb) {
        age = parseInt(form.ageForWeb)
      } else if (form.dateOfBirth) {
        const dob = new Date(form.dateOfBirth)
        age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      }

      const selectedServiceSlugs = Object.entries(form.selectedServices)
        .filter(([, v]) => v.enabled)
        .map(([id]) => {
          const svc = services.find(s => s.id === id)
          return svc ? svc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : id
        })

      const body: Record<string, unknown> = {
        name: form.name,
        slug,
        age,
        nationality: form.nationality || undefined,
        height: form.height ? parseInt(form.height) : undefined,
        weight: form.weight ? parseInt(form.weight) : undefined,
        dressSizeUK: form.dressSize || undefined,
        feetSizeUK: form.footSize || undefined,
        breastSize: form.bustSize || undefined,
        breastType: form.bustType || undefined,
        eyesColour: form.eyeColor || undefined,
        hairColour: form.hairColor || undefined,
        measurements: form.measurements || undefined,
        orientation: form.orientation || undefined,
        smokingStatus: form.smoking || undefined,
        tattooStatus: form.tattoo || undefined,
        piercingTypes: form.piercings.length > 0 ? form.piercings.join(', ') : undefined,
        services: selectedServiceSlugs,
        notesInternal: form.internalNotes || undefined,
        tubeStation: form.nearestStation || undefined,
        addressStreet: form.street || undefined,
        addressPostcode: form.postcode || undefined,
        addressFlat: form.flatNumber || undefined,
        // Extended fields
        workingName: form.workingName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        ethnicity: form.ethnicity || undefined,
        hairLength: form.hairLength || undefined,
        phone: form.phone || undefined,
        phone2: form.phone2 || undefined,
        email: form.email || undefined,
        telegramPhone: form.telegramPhone || undefined,
        telegramTag: form.telegramTag ? form.telegramTag.replace(/^@/, '') : undefined,
        whatsapp: form.whatsapp,
        telegram: form.telegram,
        viber: form.viber,
        signal: form.signal,
        postcode: form.postcode || undefined,
        street: form.street || undefined,
        houseNumber: form.houseNumber || undefined,
        floor: form.floor || undefined,
        flatNumber: form.flatNumber || undefined,
        nearestStation: form.nearestStation || undefined,
        availableAllDay: form.availableAllDay,
        availableDays: form.availableDays,
        wardrobe: form.wardrobe,
        tagline: form.tagline || undefined,
        bio: form.bio || undefined,
        internalRating: form.internalRating,
        status: asDraft ? 'draft' : form.status,
        
        offersIncall: form.offersIncall,
        offersOutcall: form.offersOutcall,
        rates: form.rates,
        hasFlatmates: form.hasFlatmates,
        languages: form.languages.filter(l => l.language),
        dinnerDates: form.preferences.dinnerDates || false,
        travelCompanion: form.preferences.travelCompanion || false,
        worksWithCouples: form.preferences.worksWithCouples || false,
        worksWithWomen: form.preferences.worksWithWomen || false,
        willingDisabled: form.preferences.willingDisabled || false,
        willingPrivatePlaces: form.preferences.willingPrivatePlaces || false,
        willingInternational: form.preferences.willingInternational || false,
        willingLongDistance: form.preferences.willingLongDistance || false,
        paymentCash: form.payments.cash || false,
        paymentTerminal: form.payments.terminal || false,
        paymentBankTransfer: form.payments.bankTransfer || false,
        paymentMonese: form.payments.monese || false,
        paymentMonzo: form.payments.monzo || false,
        paymentRevolut: form.payments.revolut || false,
        paymentStarling: form.payments.starling || false,
        paymentBTC: form.payments.btc || false,
        paymentLTC: form.payments.ltc || false,
        paymentUSDT: form.payments.usdt || false,
      }

      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create model')

      // Upload photos if any
      if (form.photos.length > 0 && data.modelId) {
        const fd = new FormData()
        form.photos.forEach(f => fd.append('photos', f))
        await fetch(`/api/admin/models/${data.modelId}/photos`, {
          method: 'POST',
          body: fd,
        }).catch(() => {})
      }

      // Clear draft from localStorage
      localStorage.removeItem(LS_KEY)

      router.push(`/admin/models/${data.modelId}`)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ─── Service categories ─── */
  const serviceCategories = [...new Set(services.map(s => s.category))]

  // Summary stats for Step 5
  const serviceCount = Object.values(form.selectedServices).filter(s => s.enabled).length
  const hasRates = Object.values(form.rates).some(r => r.incall || r.outcall)
  const minRate = Math.min(...Object.values(form.rates).flatMap(r => [r.incall, r.outcall].filter(Boolean).map(Number)).filter(n => n > 0)) || 0

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/models" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
            Models
          </Link>
          <span className="text-zinc-600">/</span>
          <h1 className="text-xl font-bold text-zinc-100">New Model Profile</h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => {
              const isVisited = visitedSteps.has(i)
              const isPast = i < step
              const isCurrent = i === step
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors cursor-pointer
                      ${isPast ? 'bg-emerald-500 text-white' : ''}
                      ${isCurrent ? 'bg-amber-500 text-zinc-900 ring-2 ring-amber-400/50 ring-offset-2 ring-offset-zinc-950' : ''}
                      ${!isPast && !isCurrent ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300' : ''}
                    `}
                  >
                    {isPast && isVisited ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : i + 1}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className={`text-xs font-medium hidden sm:block cursor-pointer transition-colors ${isCurrent ? 'text-amber-400' : isPast ? 'text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══════ STEP 1 — Identity & Profile ═══════ */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel required>Name</FieldLabel>
                <TextInput value={form.name} onChange={v => set('name', v)} placeholder="Full name" />
                <ErrorText text={errors.name} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Working Name</FieldLabel>
                <TextInput value={form.workingName} onChange={v => set('workingName', v)} placeholder="Public pseudonym" />
              </div>
              <div>
                <FieldLabel required>Date of Birth</FieldLabel>
                <TextInput type="date" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} />
                <ErrorText text={errors.dateOfBirth} />
              </div>
              <div>
                <FieldLabel>Age for Web</FieldLabel>
                <SelectInput
                  value={form.ageForWeb}
                  onChange={v => set('ageForWeb', v)}
                  options={Array.from({ length: 33 }, (_, i) => ({ value: String(18 + i), label: String(18 + i) }))}
                  placeholder="Auto from DOB"
                />
              </div>
              <div>
                <FieldLabel required>Nationality</FieldLabel>
                <SearchableSelect
                  value={form.nationality}
                  onChange={v => set('nationality', v)}
                  options={NATIONALITIES}
                  placeholder="Search nationality..."
                />
              </div>
              <div>
                <FieldLabel>Ethnicity</FieldLabel>
                <SelectInput value={form.ethnicity} onChange={v => set('ethnicity', v)} options={ETHNICITIES} />
              </div>
            </div>

            {/* Internal */}
            <SectionLabel>Internal</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel>Internal Rating</FieldLabel>
                <div className="flex items-center gap-4">
                  <input
                    type="range" min={0} max={10} step={1}
                    value={form.internalRating}
                    onChange={e => set('internalRating', parseFloat(e.target.value))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-zinc-700"
                  />
                  <span className="text-sm font-semibold text-amber-400 w-8 text-center">{form.internalRating}</span>
                </div>
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <SelectInput value={form.status} onChange={v => set('status', v)} options={MODEL_STATUSES} />
              </div>
              <div>
                <FieldLabel>Tagline</FieldLabel>
                <TextInput value={form.tagline} onChange={v => set('tagline', v)} placeholder="Short tagline" />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel>About / Bio</FieldLabel>
                  <button
                    type="button"
                    onClick={generateBio}
                    disabled={generatingBio || !form.name}
                    className="text-xs text-amber-500 hover:text-amber-400 disabled:opacity-40 transition-colors"
                  >
                    {generatingBio ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                <textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  rows={3}
                  placeholder="Public bio..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Internal Notes</FieldLabel>
                <textarea
                  value={form.internalNotes}
                  onChange={e => set('internalNotes', e.target.value)}
                  rows={3}
                  placeholder="Notes visible only to staff..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════ STEP 2 — Physical Stats ═══════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <FieldLabel>Height</FieldLabel>
                <SelectInput value={form.height} onChange={v => set('height', v)} options={HEIGHTS} />
              </div>
              <div>
                <FieldLabel>Weight</FieldLabel>
                <SelectInput value={form.weight} onChange={v => set('weight', v)} options={WEIGHTS} />
              </div>
              <div>
                <FieldLabel>Dress Size</FieldLabel>
                <SelectInput value={form.dressSize} onChange={v => set('dressSize', v)} options={DRESS_SIZES} />
              </div>
              <div>
                <FieldLabel>Foot Size</FieldLabel>
                <SelectInput value={form.footSize} onChange={v => set('footSize', v)} options={FOOT_SIZES} />
              </div>
              <div>
                <FieldLabel>Bust Size</FieldLabel>
                <SelectInput value={form.bustSize} onChange={v => set('bustSize', v)} options={BUST_SIZES} />
              </div>
              <div>
                <FieldLabel>Bust Type</FieldLabel>
                <SelectInput value={form.bustType} onChange={v => set('bustType', v)} options={BUST_TYPES} />
              </div>
              <div>
                <FieldLabel>Eye Color</FieldLabel>
                <SelectInput value={form.eyeColor} onChange={v => set('eyeColor', v)} options={EYE_COLORS} />
              </div>
              <div>
                <FieldLabel>Hair Color</FieldLabel>
                <SelectInput value={form.hairColor} onChange={v => set('hairColor', v)} options={HAIR_COLORS} />
              </div>
              <div>
                <FieldLabel>Hair Length</FieldLabel>
                <SelectInput value={form.hairLength} onChange={v => set('hairLength', v)} options={HAIR_LENGTHS} />
              </div>
              <div>
                <FieldLabel>Measurements</FieldLabel>
                <TextInput value={form.measurements} onChange={v => set('measurements', v)} placeholder="32D-25-33" />
              </div>
              <div>
                <FieldLabel>Orientation</FieldLabel>
                <SelectInput value={form.orientation} onChange={v => set('orientation', v)} options={ORIENTATIONS} />
              </div>
              <div>
                <FieldLabel>Smoking</FieldLabel>
                <SelectInput value={form.smoking} onChange={v => set('smoking', v)} options={SMOKING} />
              </div>
              <div>
                <FieldLabel>Tattoo</FieldLabel>
                <SelectInput value={form.tattoo} onChange={v => set('tattoo', v)} options={TATTOOS} />
              </div>
            </div>

            {/* Piercings — Pill Buttons */}
            <SectionLabel>Piercings</SectionLabel>
            <PillToggle
              options={PIERCINGS}
              selected={form.piercings}
              onChange={(selected) => {
                if (selected.includes('None') && !form.piercings.includes('None')) {
                  set('piercings', ['None'])
                } else {
                  set('piercings', selected.filter(s => s !== 'None'))
                }
              }}
            />

            {/* Languages */}
            <SectionLabel>Languages</SectionLabel>
            <div className="space-y-2">
              {form.languages.map((lang, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <SelectInput
                      value={lang.language}
                      onChange={v => {
                        const updated = [...form.languages]
                        updated[idx] = { ...updated[idx], language: v }
                        set('languages', updated)
                      }}
                      options={LANGUAGES}
                      placeholder="Select language"
                    />
                  </div>
                  <div className="w-40">
                    <SelectInput
                      value={lang.level}
                      onChange={v => {
                        const updated = [...form.languages]
                        updated[idx] = { ...updated[idx], level: v }
                        set('languages', updated)
                      }}
                      options={LANGUAGE_LEVELS}
                      placeholder="Level"
                    />
                  </div>
                  {form.languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => set('languages', form.languages.filter((_, i) => i !== idx))}
                      className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {form.languages.length < 5 && (
                <button
                  type="button"
                  onClick={() => set('languages', [...form.languages, { language: '', level: '' }])}
                  className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
                >
                  + Add Language
                </button>
              )}
            </div>

            {/* Preferences — Pill Buttons */}
            <SectionLabel>Preferences</SectionLabel>
            <PillToggle
              options={PREFERENCE_FIELDS.map(pf => pf.label)}
              selected={PREFERENCE_FIELDS.filter(pf => form.preferences[pf.field]).map(pf => pf.label)}
              onChange={(selectedLabels) => {
                const newPrefs: Record<string, boolean> = {}
                PREFERENCE_FIELDS.forEach(pf => {
                  newPrefs[pf.field] = selectedLabels.includes(pf.label)
                })
                set('preferences', newPrefs)
              }}
            />
          </div>
        )}

        {/* ═══════ STEP 3 — Rates & Services ═══════ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Incall / Outcall toggles */}
            <div className="flex gap-6">
              <Toggle checked={form.offersIncall} onChange={() => set('offersIncall', !form.offersIncall)} label="Offers Incall" />
              <Toggle checked={form.offersOutcall} onChange={() => set('offersOutcall', !form.offersOutcall)} label="Offers Outcall" />
            </div>

            {/* Rates Table */}
            <SectionLabel>Rates</SectionLabel>
            {loadingRates ? (
              <p className="text-sm text-zinc-500">Loading rates...</p>
            ) : callRates.length === 0 ? (
              <p className="text-sm text-zinc-500">No call rates configured. Add them in Masters &gt; Call Rates.</p>
            ) : (
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-zinc-400 font-medium">Duration</th>
                      {form.offersIncall && <th className="text-left px-4 py-3 text-zinc-400 font-medium">Incall (GBP)</th>}
                      {form.offersOutcall && <th className="text-left px-4 py-3 text-zinc-400 font-medium">Outcall (GBP)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {callRates.map(rate => (
                      <tr key={rate.id} className="border-b border-zinc-800/50">
                        <td className="px-4 py-2 text-zinc-300">{rate.label}</td>
                        {form.offersIncall && (
                          <td className="px-4 py-2">
                            <input
                              type="number" min={0} placeholder="0"
                              value={form.rates[rate.id]?.incall || ''}
                              onChange={e => set('rates', {
                                ...form.rates,
                                [rate.id]: { ...form.rates[rate.id], incall: e.target.value, outcall: form.rates[rate.id]?.outcall || '' }
                              })}
                              className="w-28 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </td>
                        )}
                        {form.offersOutcall && (
                          <td className="px-4 py-2">
                            <input
                              type="number" min={0} placeholder="0"
                              value={form.rates[rate.id]?.outcall || ''}
                              onChange={e => set('rates', {
                                ...form.rates,
                                [rate.id]: { incall: form.rates[rate.id]?.incall || '', outcall: e.target.value }
                              })}
                              className="w-28 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <ErrorText text={errors.rates} />

            {/* Services */}
            <SectionLabel>Services</SectionLabel>
            {loadingServices ? (
              <p className="text-sm text-zinc-500">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-zinc-500">No services configured. Add them in Masters &gt; Services.</p>
            ) : (
              <>
                {/* Category tabs */}
                <div className="flex flex-wrap gap-1 mb-4 border-b border-zinc-800 pb-2">
                  {serviceCategories.map(cat => (
                    <button
                      key={cat} type="button"
                      onClick={() => setActiveServiceTab(cat)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeServiceTab === cat
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services
                    .filter(s => s.category === activeServiceTab)
                    .map(svc => {
                      const sel = form.selectedServices[svc.id]
                      const isGroup = /mmf|group|duo/i.test(svc.title)
                      const isExtra = svc.title.includes('+Extra') || (svc as any).isExtra
                      return (
                        <div key={svc.id} className="space-y-1">
                          <Toggle
                            checked={sel?.enabled || false}
                            onChange={() => set('selectedServices', {
                              ...form.selectedServices,
                              [svc.id]: { enabled: !sel?.enabled, extraPrice: sel?.extraPrice || '' }
                            })}
                            label={svc.title}
                          />
                          {isGroup && sel?.enabled && (
                            <div className="ml-6 text-xs text-zinc-400 space-y-1">
                              <span className="text-zinc-500">Pricing: Double Price / POA handled on model edit page</span>
                            </div>
                          )}
                          {isExtra && sel?.enabled && !isGroup && (
                            <input
                              type="number" min={0} placeholder="Extra price"
                              value={sel.extraPrice}
                              onChange={e => set('selectedServices', {
                                ...form.selectedServices,
                                [svc.id]: { ...sel, extraPrice: e.target.value }
                              })}
                              className="ml-6 w-24 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          )}
                        </div>
                      )
                    })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════ STEP 4 — Location & Contact ═══════ */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Contact */}
            <SectionLabel>Contact (internal)</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <FieldLabel required>Phone</FieldLabel>
                <TextInput value={form.phone} onChange={v => set('phone', v)} placeholder="+44 7..." />
                <ErrorText text={errors.phone} />
              </div>
              <div>
                <FieldLabel>Phone 2</FieldLabel>
                <TextInput value={form.phone2} onChange={v => set('phone2', v)} placeholder="Alternative phone" />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput value={form.email} onChange={v => set('email', v)} placeholder="email@example.com" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Telegram Phone</FieldLabel>
                <TextInput value={form.telegramPhone} onChange={v => set('telegramPhone', v)} placeholder="+44 7... (if different)" />
              </div>
              <div>
                <FieldLabel>Telegram Tag</FieldLabel>
                <TextInput value={form.telegramTag} onChange={v => set('telegramTag', v)} placeholder="username (without @)" />
              </div>
            </div>

            {/* Messengers — Pill Toggles */}
            <SectionLabel>Messengers</SectionLabel>
            <PillToggle
              options={['WhatsApp', 'Telegram', 'Viber', 'Signal']}
              selected={[
                ...(form.whatsapp ? ['WhatsApp'] : []),
                ...(form.telegram ? ['Telegram'] : []),
                ...(form.viber ? ['Viber'] : []),
                ...(form.signal ? ['Signal'] : []),
              ]}
              onChange={(selected) => {
                set('whatsapp', selected.includes('WhatsApp'))
                set('telegram', selected.includes('Telegram'))
                set('viber', selected.includes('Viber'))
                set('signal', selected.includes('Signal'))
              }}
            />

            {/* Incall Location */}
            <SectionLabel>Incall Location</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <FieldLabel>Postcode</FieldLabel>
                <TextInput value={form.postcode} onChange={v => set('postcode', v)} placeholder="W1U 6TY" />
              </div>
              <div>
                <FieldLabel>Street</FieldLabel>
                <TextInput value={form.street} onChange={v => set('street', v)} placeholder="Baker Street" />
              </div>
              <div>
                <FieldLabel>House / Number</FieldLabel>
                <TextInput value={form.houseNumber} onChange={v => set('houseNumber', v)} placeholder="123" />
              </div>
              <div>
                <FieldLabel>Floor</FieldLabel>
                <SelectInput
                  value={form.floor}
                  onChange={v => set('floor', v)}
                  options={[
                    ...Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
                    { value: '20+', label: '20+' },
                  ]}
                  placeholder="Select floor"
                />
              </div>
              <div>
                <FieldLabel>Flat Number</FieldLabel>
                <TextInput value={form.flatNumber} onChange={v => set('flatNumber', v)} placeholder="4A" />
              </div>
              <div>
                <FieldLabel>Nearest Station</FieldLabel>
                <SearchableSelect
                  value={form.nearestStation}
                  onChange={v => set('nearestStation', v)}
                  options={LONDON_STATIONS}
                  placeholder="Search station..."
                />
              </div>
            </div>

            {/* Availability */}
            <SectionLabel>Availability</SectionLabel>
            <div className="space-y-4">
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                  <input
                    type="radio" name="availability"
                    checked={form.availableAllDay}
                    onChange={() => set('availableAllDay', true)}
                    className="accent-amber-500"
                  />
                  Available every day
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                  <input
                    type="radio" name="availability"
                    checked={!form.availableAllDay}
                    onChange={() => set('availableAllDay', false)}
                    className="accent-amber-500"
                  />
                  On a schedule
                </label>
              </div>
              {!form.availableAllDay && (
                <PillToggle
                  options={AVAILABILITY_DAYS}
                  selected={form.availableDays}
                  onChange={(days) => set('availableDays', days)}
                />
              )}
              <Toggle checked={form.hasFlatmates} onChange={() => set('hasFlatmates', !form.hasFlatmates)} label="Has Flatmates" />
            </div>

            {/* Wardrobe — Pill Toggles */}
            <SectionLabel>Wardrobe</SectionLabel>
            <PillToggle
              options={WARDROBE_OPTIONS}
              selected={form.wardrobe}
              onChange={(selected) => set('wardrobe', selected)}
            />

            {/* Payment Methods — Pill Toggles */}
            <SectionLabel>Payment Methods</SectionLabel>
            <PillToggle
              options={PAYMENT_METHODS.map(pm => pm.label)}
              selected={PAYMENT_METHODS.filter(pm => form.payments[pm.value]).map(pm => pm.label)}
              onChange={(selectedLabels) => {
                const newPayments: Record<string, boolean> = {}
                PAYMENT_METHODS.forEach(pm => {
                  newPayments[pm.value] = selectedLabels.includes(pm.label)
                })
                set('payments', newPayments)
              }}
            />
          </div>
        )}

        {/* ═══════ STEP 5 — Photos & Publish ═══════ */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Quick Upload AI */}
            <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">AI</div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-1">Quick Upload AI</h3>
                  <p className="text-xs text-zinc-400 mb-3">Have an application form? Upload a PDF or photo and AI will fill 35+ fields automatically.</p>
                  <Link
                    href="/admin/models/quick-upload"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    Upload Application Form
                  </Link>
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <SectionLabel>Photos</SectionLabel>
            <div
              onDrop={e => { e.preventDefault(); handlePhotoAdd(e.dataTransfer.files) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900/50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={e => handlePhotoAdd(e.target.files)}
                className="hidden"
              />
              <div className="text-4xl mb-3 text-zinc-500">+</div>
              <p className="text-sm font-medium text-zinc-300">Drag & drop photos here or click to browse</p>
              <p className="text-xs text-zinc-500 mt-1">First photo = Cover. Accepts JPG, PNG, WEBP</p>
            </div>

            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-zinc-800">
                    <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-28 object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded">COVER</span>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removePhoto(idx) }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Profile Status */}
            <SectionLabel>Publish</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div>
                <FieldLabel>Status</FieldLabel>
                <SelectInput value={form.status} onChange={v => set('status', v)} options={MODEL_STATUSES} />
              </div>
            </div>

            {/* Summary */}
            <SectionLabel>Summary</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className={`rounded-lg border p-3 ${form.name ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
                <span className="text-zinc-400">Name:</span>{' '}
                <span className={form.name ? 'text-emerald-400' : 'text-zinc-500'}>{form.name || 'Not set'}</span>
              </div>
              <div className={`rounded-lg border p-3 ${hasRates ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
                <span className="text-zinc-400">Rate from:</span>{' '}
                <span className={hasRates ? 'text-emerald-400' : 'text-zinc-500'}>{hasRates ? `£${minRate}` : 'Not set'}</span>
              </div>
              <div className={`rounded-lg border p-3 ${serviceCount > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
                <span className="text-zinc-400">Services:</span>{' '}
                <span className={serviceCount > 0 ? 'text-emerald-400' : 'text-zinc-500'}>{serviceCount}</span>
              </div>
              <div className={`rounded-lg border p-3 ${form.photos.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                <span className="text-zinc-400">Photos:</span>{' '}
                <span className={form.photos.length > 0 ? 'text-emerald-400' : 'text-amber-400'}>{form.photos.length}{form.photos.length === 0 ? ' (none)' : ''}</span>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <StickyFormFooter
        currentStep={step}
        totalSteps={STEPS.length}
        stepLabel={STEPS[step]}
        onBack={goBack}
        onNext={step < 4 ? goNext : undefined}
        onCancel={() => router.push('/admin/models')}
        onSaveDraft={() => handleSave(true)}
        onSubmit={() => handleSave(false)}
        isLastStep={step === 4}
        saving={submitting}
      />
    </div>
  )
}
