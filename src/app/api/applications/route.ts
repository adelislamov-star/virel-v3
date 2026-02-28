import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@virel.com'

// All 41 service labels for email readability
const SERVICE_LABELS: Record<string, string> = {
  '69': '69',
  'fk': 'FK (French Kissing)',
  'dfk': 'DFK (Deep French Kissing)',
  'gfe': 'GFE (Girlfriend Experience)',
  'owo': 'OWO (Oral Without Condom)',
  'owc': 'OWC (Oral With Condom)',
  'cob': 'COB (Cum on Body)',
  'cif': 'CIF (Cum in Face)',
  'cim': 'CIM (Cum in Mouth)',
  'swallow': 'Swallow',
  'snowballing': 'Snowballing',
  'dt': 'DT (Deep Throat)',
  'fingering': 'Fingering',
  'a-level': 'A-Level (Anal)',
  'dp': 'DP (Double Penetration)',
  'pse': 'PSE (Porn Star Experience)',
  'party-girl': 'Party Girl',
  'face-sitting': 'Face Sitting',
  'dirty-talk': 'Dirty Talk',
  'ladys-services': "Lady's Services",
  'ws-giving': 'WS Giving',
  'ws-receiving': 'WS Receiving',
  'rimming-giving': 'Rimming Giving',
  'rimming-receiving': 'Rimming Receiving',
  'smoking-fetish': 'Smoking Fetish',
  'roleplay': 'Roleplay',
  'filming-with-mask': 'Filming with Mask',
  'filming-without-mask': 'Filming without Mask',
  'foot-fetish': 'Foot Fetish',
  'open-minded': 'Open Minded',
  'light-domination': 'Light Domination',
  'spanking-giving': 'Spanking Giving',
  'soft-spanking-receiving': 'Soft Spanking Receiving',
  'duo': 'DUO',
  'bi-duo': 'Bi DUO',
  'couples': 'Couples',
  'mmf': 'MMF',
  'group': 'Group',
  'massage': 'Massage',
  'prostate-massage': 'Prostate Massage',
  'professional-massage': 'Professional Massage',
  'body-to-body-massage': 'Body to Body Massage',
  'erotic-massage': 'Erotic Massage',
  'lomilomi-massage': 'Lomilomi Massage',
  'nuru-massage': 'Nuru Massage',
  'sensual-massage': 'Sensual Massage',
  'tantric-massage': 'Tantric Massage',
  'striptease': 'Striptease',
  'lapdancing': 'Lapdancing',
  'belly-dance': 'Belly Dance',
  'toys': 'Toys',
  'strap-on': 'Strap-on',
  'poppers': 'Poppers',
  'handcuffs': 'Handcuffs',
  'domination': 'Domination',
  'fisting-giving': 'Fisting Giving',
  'tie-and-tease': 'Tie and Tease',
}

function buildEmailHtml(data: any): string {
  const services = (data.services || [])
    .map((s: string) => SERVICE_LABELS[s] || s)
    .join(', ')

  const airports = [
    data.airportHeathrow && 'Heathrow',
    data.airportGatwick && 'Gatwick',
    data.airportStansted && 'Stansted',
  ].filter(Boolean).join(', ') || '—'

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
    h1 { background: #18181b; color: #fff; padding: 20px 24px; margin: 0; font-size: 20px; }
    .badge { display: inline-block; background: #f4f4f5; border-radius: 4px; padding: 2px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge.self { background: #dcfce7; color: #166534; }
    .badge.admin { background: #dbeafe; color: #1e40af; }
    section { padding: 20px 24px; border-bottom: 1px solid #e4e4e7; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 5px 0; font-size: 14px; }
    td:first-child { color: #71717a; width: 200px; }
    td:last-child { font-weight: 500; }
    .services { font-size: 13px; line-height: 1.8; color: #3f3f46; }
    .cta { background: #18181b; color: #fff; text-decoration: none; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 8px; }
    footer { padding: 16px 24px; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <h1>
    New Application — ${data.name}
    &nbsp;<span class="badge ${data.source}">${data.source === 'self' ? 'Self-Registration' : 'Back Office'}</span>
  </h1>

  <section>
    <h2>Personal Information</h2>
    <table>
      <tr><td>Age</td><td>${data.age || '—'}</td></tr>
      <tr><td>Height</td><td>${data.height ? data.height + ' cm' : '—'}</td></tr>
      <tr><td>Weight</td><td>${data.weight ? data.weight + ' kg' : '—'}</td></tr>
      <tr><td>Dress size (UK)</td><td>${data.dressSizeUK || '—'}</td></tr>
      <tr><td>Feet size (UK)</td><td>${data.feetSizeUK || '—'}</td></tr>
      <tr><td>Breast</td><td>${data.breastSize ? `${data.breastSize} (${data.breastType || '—'})` : '—'}</td></tr>
      <tr><td>Eyes</td><td>${data.eyesColour || '—'}</td></tr>
      <tr><td>Hair</td><td>${data.hairColour || '—'}</td></tr>
      <tr><td>Smoking</td><td>${data.smokingStatus || '—'}</td></tr>
      <tr><td>Tattoo</td><td>${data.tattooStatus || '—'}</td></tr>
      <tr><td>Piercings</td><td>${data.piercingTypes || '—'}</td></tr>
      <tr><td>Nationality</td><td>${data.nationality || '—'}</td></tr>
      <tr><td>Languages</td><td>${(data.languages || []).join(', ') || '—'}</td></tr>
      <tr><td>Orientation</td><td>${data.orientation || '—'}</td></tr>
      <tr><td>Works with couples</td><td>${data.workWithCouples ? '✅ Yes' : '❌ No'}</td></tr>
      <tr><td>Works with women</td><td>${data.workWithWomen ? '✅ Yes' : '❌ No'}</td></tr>
    </table>
  </section>

  <section>
    <h2>Rates (GBP)</h2>
    <table>
      <tr><td>30 min</td><td>${data.rate30min ? '£' + data.rate30min : '—'}</td></tr>
      <tr><td>45 min</td><td>${data.rate45min ? '£' + data.rate45min : '—'}</td></tr>
      <tr><td>1h incall</td><td>${data.rate1hIn ? '£' + data.rate1hIn : '—'}</td></tr>
      <tr><td>1h outcall</td><td>${data.rate1hOut ? '£' + data.rate1hOut + ' + Taxi' : '—'}</td></tr>
      <tr><td>90 min incall</td><td>${data.rate90minIn ? '£' + data.rate90minIn : '—'}</td></tr>
      <tr><td>90 min outcall</td><td>${data.rate90minOut ? '£' + data.rate90minOut + ' + Taxi' : '—'}</td></tr>
      <tr><td>2h incall</td><td>${data.rate2hIn ? '£' + data.rate2hIn : '—'}</td></tr>
      <tr><td>2h outcall</td><td>${data.rate2hOut ? '£' + data.rate2hOut + ' + Taxi' : '—'}</td></tr>
      <tr><td>Extra hour</td><td>${data.rateExtraHour ? '£' + data.rateExtraHour : '—'}</td></tr>
      <tr><td>Overnight (9h)</td><td>${data.rateOvernight ? '£' + data.rateOvernight : '—'}</td></tr>
      <tr><td>Black clients</td><td>${data.blackClients ? '✅ Yes' : '❌ No'}</td></tr>
      <tr><td>Disabled clients</td><td>${data.disabledClients ? '✅ Yes' : '❌ No'}</td></tr>
    </table>
  </section>

  <section>
    <h2>Address</h2>
    <table>
      <tr><td>Street</td><td>${data.addressStreet || '—'}</td></tr>
      <tr><td>Flat</td><td>${data.addressFlat || '—'}</td></tr>
      <tr><td>Postcode</td><td>${data.addressPostcode || '—'}</td></tr>
      <tr><td>Tube station</td><td>${data.tubeStation || '—'}</td></tr>
      <tr><td>Airport outcalls</td><td>${airports}</td></tr>
    </table>
  </section>

  <section>
    <h2>Services (${(data.services || []).length})</h2>
    <div class="services">${services || '—'}</div>
  </section>

  ${data.notesInternal ? `
  <section>
    <h2>Internal Notes</h2>
    <p style="font-size:14px;line-height:1.6;">${data.notesInternal}</p>
  </section>` : ''}

  <section>
    <a href="${process.env.NEXT_PUBLIC_URL || 'https://virel-v3.vercel.app'}/admin/applications" class="cta">
      View in Admin Panel →
    </a>
  </section>

  <footer>Virel Operations Platform — sent automatically on new application</footer>
</body>
</html>
  `.trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Save to DB
    // @ts-ignore — ModelApplication added via raw migration
    const application = await (prisma as any).modelApplication.create({
      data: {
        source: body.source || 'self',
        name: body.name.trim(),
        age: body.age ? Number(body.age) : null,
        height: body.height ? Number(body.height) : null,
        weight: body.weight ? Number(body.weight) : null,
        dressSizeUK: body.dressSizeUK || null,
        feetSizeUK: body.feetSizeUK || null,
        breastSize: body.breastSize || null,
        breastType: body.breastType || null,
        eyesColour: body.eyesColour || null,
        hairColour: body.hairColour || null,
        smokingStatus: body.smokingStatus || null,
        tattooStatus: body.tattooStatus || null,
        piercingTypes: body.piercingTypes || null,
        nationality: body.nationality || null,
        languages: body.languages || [],
        orientation: body.orientation || null,
        workWithCouples: Boolean(body.workWithCouples),
        workWithWomen: Boolean(body.workWithWomen),
        rate30min: body.rate30min ? Number(body.rate30min) : null,
        rate45min: body.rate45min ? Number(body.rate45min) : null,
        rate1hIn: body.rate1hIn ? Number(body.rate1hIn) : null,
        rate1hOut: body.rate1hOut ? Number(body.rate1hOut) : null,
        rate90minIn: body.rate90minIn ? Number(body.rate90minIn) : null,
        rate90minOut: body.rate90minOut ? Number(body.rate90minOut) : null,
        rate2hIn: body.rate2hIn ? Number(body.rate2hIn) : null,
        rate2hOut: body.rate2hOut ? Number(body.rate2hOut) : null,
        rateExtraHour: body.rateExtraHour ? Number(body.rateExtraHour) : null,
        rateOvernight: body.rateOvernight ? Number(body.rateOvernight) : null,
        blackClients: body.blackClients !== false,
        disabledClients: body.disabledClients !== false,
        addressStreet: body.addressStreet || null,
        addressFlat: body.addressFlat || null,
        addressPostcode: body.addressPostcode || null,
        tubeStation: body.tubeStation || null,
        airportHeathrow: Boolean(body.airportHeathrow),
        airportGatwick: Boolean(body.airportGatwick),
        airportStansted: Boolean(body.airportStansted),
        services: body.services || [],
        notesInternal: body.notesInternal || null,
      },
    })

    // Send email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Virel Platform <noreply@virel.com>',
        to: MANAGER_EMAIL,
        subject: `New Application: ${body.name}`,
        html: buildEmailHtml(body),
      })
    }

    return NextResponse.json({ success: true, id: application.id })
  } catch (error) {
    console.error('Application submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // @ts-ignore
    const applications = await (prisma as any).modelApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ applications })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
