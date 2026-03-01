'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'

const SERVICES = [
  { slug: '69', label: '69' },
  { slug: 'fk', label: 'FK (French Kissing)' },
  { slug: 'dfk', label: 'DFK (Deep French Kissing)' },
  { slug: 'gfe', label: 'GFE (Girlfriend Experience)' },
  { slug: 'owo', label: 'OWO (Oral Without Condom)' },
  { slug: 'owc', label: 'OWC (Oral With Condom)' },
  { slug: 'cob', label: 'COB' },
  { slug: 'cif', label: 'CIF' },
  { slug: 'cim', label: 'CIM' },
  { slug: 'swallow', label: 'Swallow' },
  { slug: 'snowballing', label: 'Snowballing' },
  { slug: 'dt', label: 'Deep Throat' },
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
  { slug: 'nuru-massage', label: 'Nuru Massage' },
  { slug: 'sensual-massage', label: 'Sensual Massage' },
  { slug: 'tantric-massage', label: 'Tantric Massage' },
  { slug: 'striptease', label: 'Striptease' },
  { slug: 'lapdancing', label: 'Lapdancing' },
  { slug: 'toys', label: 'Toys (own)' },
  { slug: 'strap-on', label: 'Strap-on (own)' },
  { slug: 'domination', label: 'Domination' },
  { slug: 'tie-and-tease', label: 'Tie and Tease' },
]

const STEPS = ['Personal', 'Rates', 'Location', 'Services', 'Review']

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e8e0d4',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  letterSpacing: '.2em',
  textTransform: 'uppercase',
  color: '#6b6560',
  marginBottom: 8,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function LuxInput({ value, onChange, type = 'text', placeholder }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.4)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function LuxSelect({ value, onChange, options }: { value: string; onChange: any; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, appearance: 'none' as any }}
      onFocus={e => ((e.target as any).style.borderColor = 'rgba(201,168,76,0.4)')}
      onBlur={e => ((e.target as any).style.borderColor = 'rgba(255,255,255,0.08)')}
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1815' }}>{o.label}</option>)}
    </select>
  )
}

function LuxToggle({ checked, onChange, label }: { checked: boolean; onChange: any; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
      <div
        onClick={onChange}
        style={{
          position: 'relative', width: 44, height: 24,
          background: checked ? '#c9a84c' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${checked ? '#c9a84c' : 'rgba(255,255,255,0.12)'}`,
          transition: 'all .25s', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: checked ? 22 : 3,
          width: 16, height: 16,
          background: checked ? '#0a0a0a' : '#4a4540',
          transition: 'left .25s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#9a9189', letterSpacing: '.02em' }}>{label}</span>
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
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, source: 'self',
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

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase',
    color: '#c9a84c', marginBottom: 32, display: 'block',
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400&display=swap');`}</style>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 56, height: 56, border: '1px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: '#c9a84c', fontSize: 22 }}>✓</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>Application Received</h1>
        <p style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.9, margin: '0 0 32px' }}>
          Thank you. Our team will carefully review your application and reach out shortly via your preferred contact.
        </p>
        <Link href="/" style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#c9a84c', textDecoration: 'none', borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: 2 }}>
          Return to Virel
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        .join-back-btn { padding:14px 28px; border:1px solid rgba(255,255,255,0.1); background:none; color:#6b6560; font-size:11px; letter-spacing:.15em; text-transform:uppercase; cursor:pointer; font-family:inherit; transition:border-color .2s, color .2s; }
        .join-back-btn:hover { border-color:rgba(255,255,255,0.25); color:#9a9189; }
        select option { background: #1a1815; }
        ::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        .join-input:focus { border-color: rgba(201,168,76,0.4) !important; }
      `}</style>

      <Header />

      {/* Hero */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 40px 48px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <nav style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', marginBottom: 40 }}>
            <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
            <span style={{ margin: '0 10px' }}>—</span>
            <span style={{ color: '#c9a84c' }}>JOIN VIREL</span>
          </nav>
          <span style={{ ...sectionLabel, marginBottom: 16 }}>Companion Application</span>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px', lineHeight: 1.05 }}>
            Join Our<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Roster</em>
          </h1>
          <p style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.9, maxWidth: 440, margin: 0 }}>
            We work with sophisticated, professional companions who maintain the highest standards of discretion and presentation.
          </p>
        </div>
      </div>

      {/* Form area */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '52px 40px 100px' }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 52 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: 1,
                background: i < step ? '#c9a84c' : i === step ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.07)',
                transition: 'background .3s',
              }} />
              <p style={{
                fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase',
                marginTop: 8, color: i === step ? '#c9a84c' : i < step ? '#6b6560' : '#2a2520',
                transition: 'color .3s',
              }}>{s}</p>
            </div>
          ))}
        </div>

        {/* ── STEP 0: Personal ── */}
        {step === 0 && (
          <div>
            <span style={sectionLabel}>Personal Information</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Field label="Working Name *">
                <LuxInput value={form.name} onChange={text('name')} placeholder="Your stage name" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Age"><LuxInput value={form.age} onChange={text('age')} type="number" placeholder="25" /></Field>
                <Field label="Height (cm)"><LuxInput value={form.height} onChange={text('height')} type="number" placeholder="168" /></Field>
                <Field label="Weight (kg)"><LuxInput value={form.weight} onChange={text('weight')} type="number" placeholder="55" /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Dress size (UK)"><LuxInput value={form.dressSizeUK} onChange={text('dressSizeUK')} placeholder="10" /></Field>
                <Field label="Feet size (UK)"><LuxInput value={form.feetSizeUK} onChange={text('feetSizeUK')} placeholder="5" /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Breast size"><LuxInput value={form.breastSize} onChange={text('breastSize')} placeholder="34C" /></Field>
                <Field label="Breast type">
                  <LuxSelect value={form.breastType} onChange={text('breastType')} options={[{ value: 'natural', label: 'Natural' }, { value: 'silicone', label: 'Silicone' }]} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Eyes colour"><LuxInput value={form.eyesColour} onChange={text('eyesColour')} placeholder="Brown" /></Field>
                <Field label="Hair colour"><LuxInput value={form.hairColour} onChange={text('hairColour')} placeholder="Brunette" /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Smoking">
                  <LuxSelect value={form.smokingStatus} onChange={text('smokingStatus')} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'social', label: 'Social' }]} />
                </Field>
                <Field label="Tattoos">
                  <LuxSelect value={form.tattooStatus} onChange={text('tattooStatus')} options={[{ value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
                </Field>
              </div>
              <Field label="Piercings (describe)"><LuxInput value={form.piercingTypes} onChange={text('piercingTypes')} placeholder="Ears, belly..." /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Nationality"><LuxInput value={form.nationality} onChange={text('nationality')} placeholder="British" /></Field>
                <Field label="Orientation">
                  <LuxSelect value={form.orientation} onChange={text('orientation')} options={[{ value: 'hetero', label: 'Hetero' }, { value: 'bi', label: 'Bi' }]} />
                </Field>
              </div>
              <Field label="Languages (comma separated)">
                <LuxInput value={form.languages} onChange={text('languages')} placeholder="English, Russian, French" />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
                <LuxToggle checked={form.workWithCouples} onChange={() => toggle('workWithCouples')} label="I work with couples" />
                <LuxToggle checked={form.workWithWomen} onChange={() => toggle('workWithWomen')} label="I work with women" />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Rates ── */}
        {step === 1 && (
          <div>
            <span style={sectionLabel}>Rates (£ GBP)</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: '30 min', field: 'rate30min', ph: '100' },
                { label: '45 min', field: 'rate45min', ph: '130' },
                { label: '1h Incall', field: 'rate1hIn', ph: '160' },
                { label: '1h Outcall (+Taxi)', field: 'rate1hOut', ph: '200' },
                { label: '90 min Incall', field: 'rate90minIn', ph: '220' },
                { label: '90 min Outcall (+Taxi)', field: 'rate90minOut', ph: '260' },
                { label: '2h Incall', field: 'rate2hIn', ph: '280' },
                { label: '2h Outcall (+Taxi)', field: 'rate2hOut', ph: '320' },
                { label: 'Extra hour', field: 'rateExtraHour', ph: '130' },
                { label: 'Overnight (9h)', field: 'rateOvernight', ph: '1200' },
              ].map(r => (
                <Field key={r.field} label={r.label}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#c9a84c', fontSize: 14, pointerEvents: 'none' }}>£</span>
                    <LuxInput value={(form as any)[r.field]} onChange={text(r.field)} type="number" placeholder={r.ph} />
                  </div>
                </Field>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
              <LuxToggle checked={form.blackClients} onChange={() => toggle('blackClients')} label="I accept clients of all ethnicities" />
              <LuxToggle checked={form.disabledClients} onChange={() => toggle('disabledClients')} label="I accept clients with disabilities" />
            </div>
          </div>
        )}

        {/* ── STEP 2: Location ── */}
        {step === 2 && (
          <div>
            <span style={sectionLabel}>Address & Location</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Street + house number">
                <LuxInput value={form.addressStreet} onChange={text('addressStreet')} placeholder="123 Baker Street" />
              </Field>
              <Field label="Flat / Floor">
                <LuxInput value={form.addressFlat} onChange={text('addressFlat')} placeholder="Flat 4, 2nd floor" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Postcode">
                  <LuxInput value={form.addressPostcode} onChange={text('addressPostcode')} placeholder="W1U 6TY" />
                </Field>
                <Field label="Nearest Tube Station">
                  <LuxInput value={form.tubeStation} onChange={text('tubeStation')} placeholder="Baker Street" />
                </Field>
              </div>
              <div style={{ paddingTop: 8 }}>
                <span style={{ ...labelStyle, marginBottom: 16 }}>Airport Outcalls Available</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <LuxToggle checked={form.airportHeathrow} onChange={() => toggle('airportHeathrow')} label="Heathrow (LHR)" />
                  <LuxToggle checked={form.airportGatwick} onChange={() => toggle('airportGatwick')} label="Gatwick (LGW)" />
                  <LuxToggle checked={form.airportStansted} onChange={() => toggle('airportStansted')} label="Stansted (STN)" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Services ── */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
              <span style={{ ...sectionLabel, marginBottom: 0 }}>Services</span>
              <span style={{ fontSize: 11, color: '#c9a84c', letterSpacing: '.08em' }}>{form.services.length} selected</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SERVICES.map(svc => {
                const active = form.services.includes(svc.slug)
                return (
                  <div
                    key={svc.slug}
                    onClick={() => toggleService(svc.slug)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '13px 16px', cursor: 'pointer',
                      background: active ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.015)',
                      borderLeft: `2px solid ${active ? '#c9a84c' : 'transparent'}`,
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 13, color: active ? '#ddd5c8' : '#6b6560', transition: 'color .15s' }}>{svc.label}</span>
                    <div style={{
                      width: 16, height: 16, flexShrink: 0,
                      border: `1px solid ${active ? '#c9a84c' : 'rgba(255,255,255,0.12)'}`,
                      background: active ? '#c9a84c' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s',
                    }}>
                      {active && <span style={{ color: '#0a0a0a', fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div>
            <span style={sectionLabel}>Review & Submit</span>
            <div style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                {
                  title: 'Personal',
                  content: (
                    <div>
                      <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, color: '#f0e8dc', margin: '0 0 6px' }}>{form.name || '—'}</p>
                      <p style={{ fontSize: 12, color: '#6b6560', margin: 0 }}>
                        {[form.age && `Age ${form.age}`, form.nationality, form.orientation].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  ),
                },
                {
                  title: 'Rates',
                  content: (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 13 }}>
                      {form.rate1hIn && <span style={{ color: '#9a9189' }}>1h incall: <span style={{ color: '#e8e0d4' }}>£{form.rate1hIn}</span></span>}
                      {form.rate1hOut && <span style={{ color: '#9a9189' }}>1h outcall: <span style={{ color: '#e8e0d4' }}>£{form.rate1hOut}</span></span>}
                      {form.rate2hIn && <span style={{ color: '#9a9189' }}>2h incall: <span style={{ color: '#e8e0d4' }}>£{form.rate2hIn}</span></span>}
                      {form.rateOvernight && <span style={{ color: '#9a9189' }}>Overnight: <span style={{ color: '#e8e0d4' }}>£{form.rateOvernight}</span></span>}
                    </div>
                  ),
                },
                {
                  title: 'Location',
                  content: (
                    <p style={{ fontSize: 13, color: '#9a9189', margin: 0 }}>
                      {[form.addressStreet, form.addressPostcode, form.tubeStation && `◉ ${form.tubeStation}`].filter(Boolean).join(' · ') || '—'}
                    </p>
                  ),
                },
                {
                  title: 'Services',
                  content: (
                    <p style={{ fontSize: 13, color: form.services.length > 0 ? '#c9a84c' : '#3a3530', margin: 0 }}>
                      {form.services.length > 0 ? `${form.services.length} services selected` : 'None selected'}
                    </p>
                  ),
                },
              ].map((section, i) => (
                <div key={section.title} style={{ padding: '24px 28px', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <p style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: '#6b6560', marginBottom: 12 }}>{section.title}</p>
                  {section.content}
                </div>
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 16, padding: '12px 16px', border: '1px solid rgba(248,113,113,0.3)' }}>{error}</p>
            )}

            <p style={{ fontSize: 12, color: '#3a3530', letterSpacing: '.04em', lineHeight: 1.8, marginTop: 24 }}>
              By submitting you confirm all information is accurate. We treat all applications with complete discretion and confidentiality.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="join-back-btn"
            >
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name.trim()}
              style={{
                padding: '14px 36px',
                background: step === 0 && !form.name.trim() ? 'rgba(201,168,76,0.2)' : '#c9a84c',
                color: '#0a0a0a', border: 'none',
                fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
                cursor: step === 0 && !form.name.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontWeight: 500, transition: 'background .2s',
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim()}
              style={{
                padding: '14px 36px',
                background: submitting ? 'rgba(201,168,76,0.4)' : '#c9a84c',
                color: '#0a0a0a', border: 'none',
                fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontWeight: 500,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
