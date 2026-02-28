'use client'
import { useState } from 'react'
import Link from 'next/link'

const SERVICES = [
  { slug: '69', label: '69' },
  { slug: 'fk', label: 'FK' },
  { slug: 'dfk', label: 'DFK' },
  { slug: 'gfe', label: 'GFE' },
  { slug: 'owo', label: 'OWO' },
  { slug: 'owc', label: 'OWC' },
  { slug: 'cob', label: 'COB' },
  { slug: 'cif', label: 'CIF' },
  { slug: 'cim', label: 'CIM' },
  { slug: 'swallow', label: 'Swallow' },
  { slug: 'snowballing', label: 'Snowballing' },
  { slug: 'dt', label: 'DT (Deep Throat)' },
  { slug: 'fingering', label: 'Fingering' },
  { slug: 'a-level', label: 'A-Level +Extra' },
  { slug: 'dp', label: 'DP' },
  { slug: 'pse', label: 'PSE' },
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
  notesInternal: '',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-6 pb-2 border-b mb-4">{children}</h3>
}

function Field({ label, children, col = 1 }: { label: string; children: React.ReactNode; col?: number }) {
  return (
    <div className={`space-y-1 ${col === 2 ? 'col-span-2' : ''}`}>
      <label className="text-sm font-medium">{label}</label>
      {children}
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
      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
    />
  )
}

function Select({ value, onChange, options }: any) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">—</option>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Checkbox({ checked, onChange, label }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded border-input w-4 h-4 accent-primary cursor-pointer" />
      {label}
    </label>
  )
}

export default function NewModelPage() {
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

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'admin',
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
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('Failed to save. Check console.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="p-8 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-xl font-bold mb-2">Application Saved</h2>
      <p className="text-muted-foreground mb-6">Profile created and manager notified by email.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/admin/models" className="border border-border rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">Back to Models</Link>
        <button onClick={() => { setDone(false); setForm(defaultForm) }} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">Add Another</button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/models" className="text-muted-foreground hover:text-foreground text-sm">← Models</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">New Model Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">

        {/* PERSONAL */}
        <SectionTitle>Personal Information</SectionTitle>
        <div className="grid grid-cols-4 gap-4">
          <Field label="Name *" col={2}>
            <Input value={form.name} onChange={text('name')} placeholder="Working name" />
          </Field>
          <Field label="Age"><Input value={form.age} onChange={text('age')} type="number" placeholder="25" /></Field>
          <Field label="Nationality"><Input value={form.nationality} onChange={text('nationality')} placeholder="British" /></Field>
          <Field label="Height (cm)"><Input value={form.height} onChange={text('height')} type="number" placeholder="168" /></Field>
          <Field label="Weight (kg)"><Input value={form.weight} onChange={text('weight')} type="number" placeholder="55" /></Field>
          <Field label="Dress (UK)"><Input value={form.dressSizeUK} onChange={text('dressSizeUK')} placeholder="10" /></Field>
          <Field label="Feet (UK)"><Input value={form.feetSizeUK} onChange={text('feetSizeUK')} placeholder="5" /></Field>
          <Field label="Breast size"><Input value={form.breastSize} onChange={text('breastSize')} placeholder="34C" /></Field>
          <Field label="Breast type">
            <Select value={form.breastType} onChange={text('breastType')} options={[{ value: 'natural', label: 'Natural' }, { value: 'silicone', label: 'Silicone' }]} />
          </Field>
          <Field label="Eyes"><Input value={form.eyesColour} onChange={text('eyesColour')} placeholder="Brown" /></Field>
          <Field label="Hair"><Input value={form.hairColour} onChange={text('hairColour')} placeholder="Brunette" /></Field>
          <Field label="Smoking">
            <Select value={form.smokingStatus} onChange={text('smokingStatus')} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'social', label: 'Social' }]} />
          </Field>
          <Field label="Tattoo">
            <Select value={form.tattooStatus} onChange={text('tattooStatus')} options={[{ value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
          </Field>
          <Field label="Piercings" col={2}>
            <Input value={form.piercingTypes} onChange={text('piercingTypes')} placeholder="Ears, belly button" />
          </Field>
          <Field label="Languages" col={2}>
            <Input value={form.languages} onChange={text('languages')} placeholder="English (native), Russian (fluent)" />
          </Field>
          <Field label="Orientation">
            <Select value={form.orientation} onChange={text('orientation')} options={[{ value: 'hetero', label: 'Hetero' }, { value: 'bi', label: 'Bi' }]} />
          </Field>
          <div className="col-span-3 flex gap-6 items-end pb-2">
            <Checkbox checked={form.workWithCouples} onChange={() => toggle('workWithCouples')} label="Works with couples" />
            <Checkbox checked={form.workWithWomen} onChange={() => toggle('workWithWomen')} label="Works with women" />
          </div>
        </div>

        {/* RATES */}
        <SectionTitle>Rates (£ GBP)</SectionTitle>
        <div className="grid grid-cols-4 gap-4">
          <Field label="30 min"><Input value={form.rate30min} onChange={text('rate30min')} type="number" placeholder="100" /></Field>
          <Field label="45 min"><Input value={form.rate45min} onChange={text('rate45min')} type="number" placeholder="130" /></Field>
          <Field label="1h incall"><Input value={form.rate1hIn} onChange={text('rate1hIn')} type="number" placeholder="160" /></Field>
          <Field label="1h outcall"><Input value={form.rate1hOut} onChange={text('rate1hOut')} type="number" placeholder="200" /></Field>
          <Field label="90 min incall"><Input value={form.rate90minIn} onChange={text('rate90minIn')} type="number" placeholder="220" /></Field>
          <Field label="90 min outcall"><Input value={form.rate90minOut} onChange={text('rate90minOut')} type="number" placeholder="260" /></Field>
          <Field label="2h incall"><Input value={form.rate2hIn} onChange={text('rate2hIn')} type="number" placeholder="280" /></Field>
          <Field label="2h outcall"><Input value={form.rate2hOut} onChange={text('rate2hOut')} type="number" placeholder="320" /></Field>
          <Field label="Extra hour"><Input value={form.rateExtraHour} onChange={text('rateExtraHour')} type="number" placeholder="130" /></Field>
          <Field label="Overnight (9h)"><Input value={form.rateOvernight} onChange={text('rateOvernight')} type="number" placeholder="1200" /></Field>
          <div className="col-span-4 flex gap-6">
            <Checkbox checked={form.blackClients} onChange={() => toggle('blackClients')} label="Accepts black clients" />
            <Checkbox checked={form.disabledClients} onChange={() => toggle('disabledClients')} label="Accepts disabled clients" />
          </div>
        </div>

        {/* ADDRESS */}
        <SectionTitle>Address</SectionTitle>
        <div className="grid grid-cols-4 gap-4">
          <Field label="Street + house number" col={2}>
            <Input value={form.addressStreet} onChange={text('addressStreet')} placeholder="123 Baker Street" />
          </Field>
          <Field label="Flat / Floor">
            <Input value={form.addressFlat} onChange={text('addressFlat')} placeholder="Flat 4, 2nd floor" />
          </Field>
          <Field label="Postcode">
            <Input value={form.addressPostcode} onChange={text('addressPostcode')} placeholder="W1U 6TY" />
          </Field>
          <Field label="Nearest Tube">
            <Input value={form.tubeStation} onChange={text('tubeStation')} placeholder="Baker Street" />
          </Field>
          <div className="col-span-4 flex gap-6">
            <Checkbox checked={form.airportHeathrow} onChange={() => toggle('airportHeathrow')} label="Heathrow" />
            <Checkbox checked={form.airportGatwick} onChange={() => toggle('airportGatwick')} label="Gatwick" />
            <Checkbox checked={form.airportStansted} onChange={() => toggle('airportStansted')} label="Stansted" />
          </div>
        </div>

        {/* SERVICES */}
        <SectionTitle>Services ({form.services.length} selected)</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {SERVICES.map(svc => (
            <Checkbox
              key={svc.slug}
              checked={form.services.includes(svc.slug)}
              onChange={() => toggleService(svc.slug)}
              label={svc.label}
            />
          ))}
        </div>

        {/* NOTES */}
        <SectionTitle>Internal Notes</SectionTitle>
        <textarea
          value={form.notesInternal}
          onChange={text('notesInternal')}
          rows={3}
          placeholder="Any internal notes about this model..."
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Submit */}
        <div className="flex gap-3 pt-4 pb-8">
          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Profile & Notify Manager'}
          </button>
          <Link href="/admin/models" className="border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
