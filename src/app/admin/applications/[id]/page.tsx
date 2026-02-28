// @ts-nocheck
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { StatusButtons } from './StatusButtons'

export const dynamic = 'force-dynamic'

const SERVICE_LABELS: Record<string, string> = {
  '69': '69', 'fk': 'FK', 'dfk': 'DFK', 'gfe': 'GFE', 'owo': 'OWO', 'owc': 'OWC',
  'cob': 'COB', 'cif': 'CIF', 'cim': 'CIM', 'swallow': 'Swallow', 'snowballing': 'Snowballing',
  'dt': 'DT (Deep Throat)', 'fingering': 'Fingering', 'a-level': 'A-Level +Extra',
  'dp': 'DP', 'pse': 'PSE', 'party-girl': 'Party Girl', 'face-sitting': 'Face Sitting',
  'dirty-talk': 'Dirty Talk', 'ladys-services': "Lady's Services",
  'ws-giving': 'WS Giving +Extra', 'ws-receiving': 'WS Receiving +Extra',
  'rimming-giving': 'Rimming Giving +Extra', 'rimming-receiving': 'Rimming Receiving',
  'smoking-fetish': 'Smoking Fetish', 'roleplay': 'Roleplay',
  'filming-with-mask': 'Filming with Mask +Extra', 'filming-without-mask': 'Filming without Mask +Extra',
  'foot-fetish': 'Foot Fetish', 'open-minded': 'Open Minded', 'light-domination': 'Light Domination',
  'spanking-giving': 'Spanking Giving', 'soft-spanking-receiving': 'Soft Spanking Receiving',
  'duo': 'DUO', 'bi-duo': 'Bi DUO +Extra', 'couples': 'Couples +Extra',
  'mmf': 'MMF', 'group': 'Group +Extra', 'massage': 'Massage',
  'prostate-massage': 'Prostate Massage', 'professional-massage': 'Professional Massage',
  'body-to-body-massage': 'Body to Body Massage', 'erotic-massage': 'Erotic Massage',
  'nuru-massage': 'Nuru Massage', 'sensual-massage': 'Sensual Massage',
  'tantric-massage': 'Tantric Massage', 'striptease': 'Striptease', 'lapdancing': 'Lapdancing',
  'belly-dance': 'Belly Dance', 'toys': 'Toys', 'strap-on': 'Strap-on',
  'poppers': 'Poppers', 'handcuffs': 'Handcuffs', 'domination': 'Domination',
  'fisting-giving': 'Fisting Giving', 'tie-and-tease': 'Tie and Tease',
}

function Row({ label, value }: { label: string; value?: any }) {
  if (value === null || value === undefined || value === '') return null
  const display = typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : String(value)
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-6 text-sm text-muted-foreground w-48">{label}</td>
      <td className="py-2.5 text-sm font-medium">{display}</td>
    </tr>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
      <div className="px-5 py-3 bg-muted/50 border-b border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      <div className="px-5 py-2">
        <table className="w-full">{children}</table>
      </div>
    </div>
  )
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  let app: any = null
  try {
    app = await (prisma as any).modelApplication.findUnique({ where: { id: params.id } })
  } catch {}
  if (!app) notFound()

  const airports = [
    app.airportHeathrow && 'Heathrow',
    app.airportGatwick && 'Gatwick',
    app.airportStansted && 'Stansted',
  ].filter(Boolean).join(', ') || '—'

  const statusColor: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/admin/applications" className="text-muted-foreground hover:text-foreground text-sm">← Applications</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">{app.name}</h1>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.source === 'self' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-600'}`}>
          {app.source === 'self' ? 'Self-registration' : 'Back Office'}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor[app.status] || ''}`}>
          {app.status}
        </span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <StatusButtons id={app.id} current={app.status} />
        <Link href="/admin/models/new"
          className="ml-auto px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
        >
          + Create Model Profile
        </Link>
      </div>

      <Section title="Personal">
        <Row label="Name" value={app.name} />
        <Row label="Age" value={app.age} />
        <Row label="Height" value={app.height ? `${app.height} cm` : null} />
        <Row label="Weight" value={app.weight ? `${app.weight} kg` : null} />
        <Row label="Dress size (UK)" value={app.dressSizeUK} />
        <Row label="Feet size (UK)" value={app.feetSizeUK} />
        <Row label="Breast" value={app.breastSize ? `${app.breastSize} (${app.breastType || '—'})` : null} />
        <Row label="Eyes" value={app.eyesColour} />
        <Row label="Hair" value={app.hairColour} />
        <Row label="Smoking" value={app.smokingStatus} />
        <Row label="Tattoo" value={app.tattooStatus} />
        <Row label="Piercings" value={app.piercingTypes} />
        <Row label="Nationality" value={app.nationality} />
        <Row label="Languages" value={app.languages?.join(', ')} />
        <Row label="Orientation" value={app.orientation} />
        <Row label="Couples" value={app.workWithCouples} />
        <Row label="Women" value={app.workWithWomen} />
      </Section>

      <Section title="Rates (£)">
        <Row label="30 min" value={app.rate30min ? `£${app.rate30min}` : null} />
        <Row label="45 min" value={app.rate45min ? `£${app.rate45min}` : null} />
        <Row label="1h incall" value={app.rate1hIn ? `£${app.rate1hIn}` : null} />
        <Row label="1h outcall" value={app.rate1hOut ? `£${app.rate1hOut} + Taxi` : null} />
        <Row label="90 min incall" value={app.rate90minIn ? `£${app.rate90minIn}` : null} />
        <Row label="90 min outcall" value={app.rate90minOut ? `£${app.rate90minOut} + Taxi` : null} />
        <Row label="2h incall" value={app.rate2hIn ? `£${app.rate2hIn}` : null} />
        <Row label="2h outcall" value={app.rate2hOut ? `£${app.rate2hOut} + Taxi` : null} />
        <Row label="Extra hour" value={app.rateExtraHour ? `£${app.rateExtraHour}` : null} />
        <Row label="Overnight" value={app.rateOvernight ? `£${app.rateOvernight}` : null} />
        <Row label="Black clients" value={app.blackClients} />
        <Row label="Disabled clients" value={app.disabledClients} />
      </Section>

      <Section title="Address">
        <Row label="Street" value={app.addressStreet} />
        <Row label="Flat" value={app.addressFlat} />
        <Row label="Postcode" value={app.addressPostcode} />
        <Row label="Tube" value={app.tubeStation} />
        <Row label="Airports" value={airports} />
      </Section>

      <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services</h2>
          <span className="text-xs text-muted-foreground">{app.services?.length || 0} selected</span>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {app.services?.length > 0
            ? app.services.map((s: string) => (
                <span key={s} className="text-xs bg-muted px-2.5 py-1 rounded-full border border-border">
                  {SERVICE_LABELS[s] || s}
                </span>
              ))
            : <p className="text-sm text-muted-foreground">None</p>
          }
        </div>
      </div>

      {app.notesInternal && (
        <Section title="Notes">
          <tr><td colSpan={2} className="py-3 text-sm leading-relaxed">{app.notesInternal}</td></tr>
        </Section>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {new Date(app.createdAt).toLocaleString('en-GB')} · {app.id}
      </p>
    </div>
  )
}
