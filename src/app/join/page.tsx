'use client'
import { useState } from 'react'
import Link from 'next/link'

const SERVICES = [
  { slug: '69', label: '69' },
  { slug: 'fk', label: 'FK (French Kissing)' },
  { slug: 'dfk', label: 'DFK (Deep French Kissing)' },
  { slug: 'gfe', label: 'GFE (Girlfriend Experience)' },
  { slug: 'owo', label: 'OWO (Oral Without Condom)' },
  { slug: 'owc', label: 'OWC (Oral With Condom)' },
  { slug: 'cob', label: 'COB (Cum on Body)' },
  { slug: 'cif', label: 'CIF (Cum in Face)' },
  { slug: 'cim', label: 'CIM (Cum in Mouth)' },
  { slug: 'swallow', label: 'Swallow' },
  { slug: 'snowballing', label: 'Snowballing' },
  { slug: 'dt', label: 'DT (Deep Throat)' },
  { slug: 'fingering', label: 'Fingering' },
  { slug: 'a-level', label: 'A-Level (Anal) +Extra' },
  { slug: 'dp', label: 'DP (Double Penetration)' },
  { slug: 'pse', label: 'PSE (Porn Star Experience)' },
  { slug: 'party-girl', label: 'Party Girl' },
  { slug: 'face-sitting', label: 'Face Sitting' },
  { slug: 'dirty-talk', label: 'Dirty Talk' },
  { slug: 'ladys-services', label: "Lady's Services" },
  { slug: 'ws-giving', label: 'WS Giving +Extra' },
  { slug: 'ws-receiving', label: 'WS Receiving +Extra' },
  { slug: 'rimming-giving', label: 'Rimming Giving +Extra' },
  { slug: 'rimming-receiving', label: 'Rimming Receiving' },
  { slug: 'smoking-fetish', label: 'Smoking Fetish' },
  { slug: 'roleplay', label: 'Roleplay' },
  { slug: 'filming-with-mask', label: 'Filming with Mask +Extra' },
  { slug: 'filming-without-mask', label: 'Filming without Mask +Extra' },
  { slug: 'foot-fetish', label: 'Foot Fetish' },
  { slug: 'open-minded', label: 'Open Minded' },
  { slug: 'light-domination', label: 'Light Domination' },
  { slug: 'spanking-giving', label: 'Spanking Giving' },
  { slug: 'soft-spanking-receiving', label: 'Soft Spanking Receiving' },
  { slug: 'duo', label: 'DUO' },
  { slug: 'bi-duo', label: 'Bi DUO +Extra' },
  { slug: 'couples', label: 'Couples +Extra' },
  { slug: 'mmf', label: 'MMF (double price)' },
  { slug: 'group', label: 'Group +Extra' },
  { slug: 'massage', label: 'Massage' },
  { slug: 'prostate-massage', label: 'Prostate Massage' },
  { slug: 'professional-massage', label: 'Professional Massage (cert.)' },
  { slug: 'body-to-body-massage', label: 'Body to Body Massage' },
  { slug: 'erotic-massage', label: 'Erotic Massage' },
  { slug: 'lomilomi-massage', label: 'Lomilomi Massage' },
  { slug: 'nuru-massage', label: 'Nuru Massage' },
  { slug: 'sensual-massage', label: 'Sensual Massage' },
  { slug: 'tantric-massage', label: 'Tantric Massage' },
  { slug: 'striptease', label: 'Striptease' },
  { slug: 'lapdancing', label: 'Lapdancing' },
  { slug: 'belly-dance', label: 'Belly Dance' },
  { slug: 'toys', label: 'Toys (own)' },
  { slug: 'strap-on', label: 'Strap-on (own)' },
  { slug: 'poppers', label: 'Poppers (own)' },
  { slug: 'handcuffs', label: 'Handcuffs (own)' },
  { slug: 'domination', label: 'Domination' },
  { slug: 'fisting-giving', label: 'Fisting Giving' },
  { slug: 'tie-and-tease', label: 'Tie and Tease' },
]

const STEPS = ['Personal', 'Rates', 'Address', 'Services', 'Review']

const defaultForm = {
  name: '', age: '', height: '', weight: '',
  dressSizeUK: '', feetSizeUK: '', breastSize: '', breastType: '',
  eyesColour: '', hairColour: '', smokingStatus: '', tattooStatus: '',
  piercingTypes: '', nationality: '', languages: '', orientation: '',
  workWithCouples: false, workWithWomen: false,
  rate30min: '', rate45min: '', rate1hIn: '', rate1hOut: '',
  rate90minIn: '', rate90minOut: '', rate2hIn: '', rate2hOut: '',
  rateExtraHour: '', rateOvernight: '',
  blackClients: true, disabledClients: true,
  addressStreet: '', addressFlat: '', addressPostcode: '', tubeStation: '',
  airportHeathrow: false, airportGatwick: false, airportStansted: false,
  services: [] as string[],
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: any; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-400 transition-colors"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: any; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-white' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${checked ? 'left-6 bg-zinc-900' : 'left-1 bg-zinc-400'}`} />
      </div>
      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
    </label>
  )
}

export default function JoinPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))
  const text = (field: string) => (e: any) => set(field, e.target.value)
  const toggle = (field: string) => set(field, !(form as any)[field])
  const toggleService = (slug: string) =>
    set('services', form.services.includes(slug)
      ? form.services.filter(s => s !== slug)
      : [...form.services, slug])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'self',
          age: form.age ? Number(form.age) : null,
          height: form.height ? Number(form.height) : null,
          weight: form.weight ? Number(form.weight) : null,
          rate30min: form.rate30min ? Number(form.rate30min) : null,
          rate45min: form.rate45min ? Number(form.rate45min) : null,
          rate1hIn: form.rate1hIn ? Number(form.rate1hIn) : null,
          rate1hOut: form.rate1hOut ? Number(form.rate1hOut) : null,
          rate90minIn: form.rate90minIn ? Number(form.rate90minIn) : null,
          rate90minOut: form.rate90minOut ? Number(form.rate90minOut) : null,
          rate2hIn: form.rate2hIn ? Number(form.rate2hIn) : null,
          rate2hOut: form.rate2hOut ? Number(form.rate2hOut) : null,
          rateExtraHour: form.rateExtraHour ? Number(form.rateExtraHour) : null,
          rateOvernight: form.rateOvernight ? Number(form.rateOvernight) : null,
          languages: form.languages.split(',').map((l: string) => l.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error('Server error')
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-white mb-3">Application Submitted</h1>
        <p className="text-zinc-400 leading-relaxed">
          Thank you! Our team will review your application and get back to you shortly.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Join Virel</h1>
            <p className="text-zinc-500 text-sm">Companion Application</p>
          </div>
          <div className="text-sm text-zinc-500">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-xl mx-auto px-6 pt-6">
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-white' : 'bg-zinc-800'}`} />
              <p className={`text-xs mt-1.5 ${i === step ? 'text-white font-medium' : 'text-zinc-600'}`}>{s}</p>
            </div>
          ))}
        </div>

        {/* Step 0: Personal */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Personal Information</h2>
            <Field label="Name *">
              <Input value={form.name} onChange={text('name')} placeholder="Your working name" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Age"><Input value={form.age} onChange={text('age')} type="number" placeholder="25" /></Field>
              <Field label="Height (cm)"><Input value={form.height} onChange={text('height')} type="number" placeholder="168" /></Field>
              <Field label="Weight (kg)"><Input value={form.weight} onChange={text('weight')} type="number" placeholder="55" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dress size (UK)"><Input value={form.dressSizeUK} onChange={text('dressSizeUK')} placeholder="10" /></Field>
              <Field label="Feet size (UK)"><Input value={form.feetSizeUK} onChange={text('feetSizeUK')} placeholder="5" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Breast size"><Input value={form.breastSize} onChange={text('breastSize')} placeholder="34C" /></Field>
              <Field label="Breast type">
                <Select value={form.breastType} onChange={text('breastType')} options={[{ value: 'natural', label: 'Natural' }, { value: 'silicone', label: 'Silicone' }]} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Eyes colour"><Input value={form.eyesColour} onChange={text('eyesColour')} placeholder="Brown" /></Field>
              <Field label="Hair colour"><Input value={form.hairColour} onChange={text('hairColour')} placeholder="Brunette" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Smoking">
                <Select value={form.smokingStatus} onChange={text('smokingStatus')} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'social', label: 'Social' }]} />
              </Field>
              <Field label="Tattoo">
                <Select value={form.tattooStatus} onChange={text('tattooStatus')} options={[{ value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
              </Field>
            </div>
            <Field label="Piercings" hint="Describe which types, e.g. ears, nose, belly">
              <Input value={form.piercingTypes} onChange={text('piercingTypes')} placeholder="Ears, belly" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nationality"><Input value={form.nationality} onChange={text('nationality')} placeholder="British" /></Field>
              <Field label="Orientation">
                <Select value={form.orientation} onChange={text('orientation')} options={[{ value: 'hetero', label: 'Hetero' }, { value: 'bi', label: 'Bi' }]} />
              </Field>
            </div>
            <Field label="Languages" hint="Comma separated, e.g. English (native), French (basic)">
              <Input value={form.languages} onChange={text('languages')} placeholder="English, Russian" />
            </Field>
            <div className="space-y-3 pt-2">
              <Toggle checked={form.workWithCouples} onChange={() => toggle('workWithCouples')} label="I work with couples" />
              <Toggle checked={form.workWithWomen} onChange={() => toggle('workWithWomen')} label="I work with women" />
            </div>
          </div>
        )}

        {/* Step 1: Rates */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Rates (£ GBP)</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="30 min"><Input value={form.rate30min} onChange={text('rate30min')} type="number" placeholder="100" /></Field>
              <Field label="45 min"><Input value={form.rate45min} onChange={text('rate45min')} type="number" placeholder="130" /></Field>
              <Field label="1h incall"><Input value={form.rate1hIn} onChange={text('rate1hIn')} type="number" placeholder="160" /></Field>
              <Field label="1h outcall (+Taxi)"><Input value={form.rate1hOut} onChange={text('rate1hOut')} type="number" placeholder="200" /></Field>
              <Field label="90 min incall"><Input value={form.rate90minIn} onChange={text('rate90minIn')} type="number" placeholder="220" /></Field>
              <Field label="90 min outcall (+Taxi)"><Input value={form.rate90minOut} onChange={text('rate90minOut')} type="number" placeholder="260" /></Field>
              <Field label="2h incall"><Input value={form.rate2hIn} onChange={text('rate2hIn')} type="number" placeholder="280" /></Field>
              <Field label="2h outcall (+Taxi)"><Input value={form.rate2hOut} onChange={text('rate2hOut')} type="number" placeholder="320" /></Field>
              <Field label="Extra hour"><Input value={form.rateExtraHour} onChange={text('rateExtraHour')} type="number" placeholder="130" /></Field>
              <Field label="Overnight (9h)"><Input value={form.rateOvernight} onChange={text('rateOvernight')} type="number" placeholder="1200" /></Field>
            </div>
            <div className="space-y-3 pt-2">
              <Toggle checked={form.blackClients} onChange={() => toggle('blackClients')} label="I accept black clients" />
              <Toggle checked={form.disabledClients} onChange={() => toggle('disabledClients')} label="I accept disabled clients" />
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Address & Location</h2>
            <Field label="Street + house number">
              <Input value={form.addressStreet} onChange={text('addressStreet')} placeholder="123 Baker Street" />
            </Field>
            <Field label="Flat / Floor">
              <Input value={form.addressFlat} onChange={text('addressFlat')} placeholder="Flat 4, 2nd floor" />
            </Field>
            <Field label="Postcode">
              <Input value={form.addressPostcode} onChange={text('addressPostcode')} placeholder="W1U 6TY" />
            </Field>
            <Field label="Nearest Tube Station">
              <Input value={form.tubeStation} onChange={text('tubeStation')} placeholder="Baker Street" />
            </Field>
            <div className="pt-2">
              <p className="text-sm font-medium text-zinc-300 mb-3">Airport Outcalls Available</p>
              <div className="space-y-3">
                <Toggle checked={form.airportHeathrow} onChange={() => toggle('airportHeathrow')} label="Heathrow (LHR)" />
                <Toggle checked={form.airportGatwick} onChange={() => toggle('airportGatwick')} label="Gatwick (LGW)" />
                <Toggle checked={form.airportStansted} onChange={() => toggle('airportStansted')} label="Stansted (STN)" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Services */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Services</h2>
              <span className="text-sm text-zinc-400">{form.services.length} selected</span>
            </div>
            <div className="space-y-2">
              {SERVICES.map(svc => (
                <label
                  key={svc.slug}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.services.includes(svc.slug)
                      ? 'border-white bg-white/5 text-white'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    form.services.includes(svc.slug) ? 'border-white bg-white' : 'border-zinc-600'
                  }`}>
                    {form.services.includes(svc.slug) && (
                      <svg className="w-2.5 h-2.5 text-zinc-900" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.services.includes(svc.slug)}
                    onChange={() => toggleService(svc.slug)}
                  />
                  <span className="text-sm">{svc.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6">Review & Submit</h2>
            <div className="bg-zinc-900 rounded-xl divide-y divide-zinc-800">
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Personal</p>
                <p className="font-semibold">{form.name || '—'}</p>
                <p className="text-sm text-zinc-400">{[form.age && `Age ${form.age}`, form.nationality, form.orientation].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rates</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {form.rate1hIn && <span>1h incall: <b>£{form.rate1hIn}</b></span>}
                  {form.rate1hOut && <span>1h outcall: <b>£{form.rate1hOut}</b></span>}
                  {form.rate2hIn && <span>2h incall: <b>£{form.rate2hIn}</b></span>}
                  {form.rateOvernight && <span>Overnight: <b>£{form.rateOvernight}</b></span>}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Location</p>
                <p className="text-sm">{[form.addressStreet, form.addressPostcode, form.tubeStation && `📍 ${form.tubeStation}`].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Services ({form.services.length})</p>
                <p className="text-sm text-zinc-300">{form.services.length > 0 ? `${form.services.length} services selected` : 'None selected'}</p>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-12">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 border border-zinc-700 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors"
            >
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name.trim()}
              className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim()}
              className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
