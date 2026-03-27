import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/client'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())
  if (ext === 'docx' || ext === 'doc') {
    const r = await mammoth.extractRawText({ buffer: buf })
    return r.value
  }
  if (ext === 'pdf' || file.type.includes('pdf')) {
    try {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buf)
      return data.text || ''
    } catch (e) {
      console.error('[parse-anketa] PDF parse failed:', e)
      return ''
    }
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const wb = XLSX.read(buf)
    return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
  }
  return buf.toString('utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'No file' }, { status: 400 })

    const text = await extractText(file)

    if (text.trim().length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract text from document. The file may be encrypted, scanned as image, or corrupted. Please try a text-based PDF or DOCX.',
      }, { status: 422 })
    }

    const EXAMPLE_INPUT = `Name – Sophia
Age – 24
Height – 1,67
Weight – 54
Dress Size (UK) – 8
Feet Size (UK size) – 5
Breast Size – 34C
Breast Type – Natural
Eyes Colour – Green
Hair Colour – Brown
Smoking – No
Tattoo – Small
Piercing – Ears only
Nationality – Romanian
Languages – English, Romanian
Orientation – Bisexual
*Do you work with couples? – Yes
*Do you work with women? – Yes
*Do you accept black clients? – Yes
*Do you work with disabled clients? – No

ADDRESS:
34 Baker Street
Flat 4B
W1U 6RS
Tube Station – Baker Street

Airport Outcalls:
Heathrow – Yes
Gatwick – No
Stansted – No

RATES (incall/outcall):
30 min – £150 / –
45 min – £200 / –
1 hour – £250 / £300
90 min – £350 / £400
2 hours – £450 / £500
Extra hour – £200
Overnight – £1200

SERVICES:
GFE – Yes
OWO – Yes Extra £30
69 – Yes
DFK – Yes
A Level – No
B2B massage – Yes Extra £20
Striptease – Yes
Toys – Yes`

    const EXAMPLE_OUTPUT = `{"name":"Sophia","age":"24","height":"167","weight":"54","dressSizeUK":"8","feetSizeUK":"5","breastSize":"34C","breastType":"natural","eyesColour":"Green","hairColour":"Brown","smokingStatus":"no","tattooStatus":"small","piercingTypes":"Ears only","nationality":"Romanian","languages":["English","Romanian"],"orientation":"bisexual","workWithCouples":true,"workWithWomen":true,"blackClients":true,"disabledClients":false,"tubeStation":"Baker Street","addressStreet":"34 Baker Street","addressFlat":"4B","addressPostcode":"W1U 6RS","airportHeathrow":true,"airportGatwick":false,"airportStansted":false,"rate30min":"150","rate45min":"200","rate1hIn":"250","rate1hOut":"300","rate90minIn":"350","rate90minOut":"400","rate2hIn":"450","rate2hOut":"500","rateExtraHour":"200","rateOvernight":"1200","services":[{"serviceId":"matched-id","enabled":true,"isExtra":false,"extraPrice":null},{"serviceId":"matched-id","enabled":true,"isExtra":true,"extraPrice":30},{"serviceId":"matched-id","enabled":true,"isExtra":false,"extraPrice":null}]}`

    // Load active services from DB
    const servicesFromDb = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, title: true, slug: true, category: true, defaultExtraPrice: true },
      orderBy: { category: 'asc' },
    });
    const servicesBlock = servicesFromDb.map(s =>
      `- id: ${s.id} | title: "${s.title}" | category: ${s.category}${s.defaultExtraPrice ? ` | defaultExtraPrice: £${s.defaultExtraPrice}` : ''}`
    ).join('\n');

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      system: `You are an expert data extraction assistant for an escort agency platform. Your only job is to parse application forms and return perfectly structured JSON. You read EVERY field in the document, no matter the language or format. You never skip any field. You return ONLY valid JSON with no markdown, no explanation, no extra text.

Field rules:
- height: integer string in cm (convert "1,67" → "167", "5ft 5" → "165")
- age, weight: integer string
- feetSizeUK: string as-is (e.g. "4.5", "5")
- smokingStatus: "yes" or "no"
- tattooStatus: "none", "small", "medium", or "large"
- piercingTypes: "none" or description
- orientation: "heterosexual" or "bisexual"
- breastSize: breast cup size only, e.g. "34C", "32B". Extract ONLY the size, ignore natural/silicone.
- breastType: "natural" or "silicone". Look for these words near breast size. "silicone 34C" → breastType: "silicone", breastSize: "34C"
- rates: number string, no currency symbols
- languages: array of strings
- booleans (workWithCouples, workWithWomen, blackClients, disabledClients, airports): true or false
  IMPORTANT: disabledClients means "does the model accept disabled clients". If answer is "no" → false. If "yes" → true. Do NOT default to true.
- services: array of objects. Include service if answer is yes/has price, exclude if no/blank.
  Each object: {"serviceId":"<id>","enabled":true,"isExtra":false,"extraPrice":null}
  Extra price detection — ALL these formats mean extraPrice (extract the number):
    "Yes Extra £30", "Yes Extra 30/", "Yes £30/", "£30", "30", "Extra 30", "30/"
  If only "Yes" with no number → enabled: true, isExtra: false, extraPrice: null
  If service has defaultExtraPrice and appears to be an extra → isExtra: true, extraPrice: defaultExtraPrice
  If "No" → exclude service entirely.

AVAILABLE SERVICES IN CATALOGUE (match anketa services to these by title):
${servicesBlock}`,
      messages: [
        {
          role: 'user',
          content: `Parse this application form and return JSON:\n\n${EXAMPLE_INPUT}`
        },
        {
          role: 'assistant',
          content: EXAMPLE_OUTPUT
        },
        {
          role: 'user',
          content: `Parse this application form and return JSON:\n\n${text}`
        }
      ]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = raw.replace(/```json\n?|```/g, '').trim()

    let fields: Record<string, any>
    try {
      fields = JSON.parse(clean)
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 })
      fields = JSON.parse(match[0])
    }

    // ── Convert flat rate fields → nested rates object ──
    const rates: Record<string, { incall: number | null; outcall: number | null }> = {}
    const rateMap: Record<string, { key: string; type: 'incall' | 'outcall' }> = {
      rate30min: { key: '30min', type: 'incall' },
      rate45min: { key: '45min', type: 'incall' },
      rate1hIn: { key: '1hour', type: 'incall' },
      rate1h: { key: '1hour', type: 'incall' },
      rate1hOut: { key: '1hour', type: 'outcall' },
      rate90minIn: { key: '90min', type: 'incall' },
      rate90min: { key: '90min', type: 'incall' },
      rate90minOut: { key: '90min', type: 'outcall' },
      rate2hIn: { key: '2hours', type: 'incall' },
      rate2h: { key: '2hours', type: 'incall' },
      rate2hOut: { key: '2hours', type: 'outcall' },
      rate3hIn: { key: '3hours', type: 'incall' },
      rate3h: { key: '3hours', type: 'incall' },
      rate3hOut: { key: '3hours', type: 'outcall' },
      rateOvernightIn: { key: 'overnight', type: 'incall' },
      rateOvernight: { key: 'overnight', type: 'incall' },
      rateOvernightOut: { key: 'overnight', type: 'outcall' },
    }
    for (const [field, { key, type }] of Object.entries(rateMap)) {
      const v = fields[field]
      if (v == null) continue
      const price = typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10)
      if (isNaN(price)) continue
      if (!rates[key]) rates[key] = { incall: null, outcall: null }
      rates[key][type] = price
      delete fields[field]
    }
    // Also remove rateExtraHour (not mapped to duration)
    delete fields.rateExtraHour
    if (Object.keys(rates).length > 0) {
      fields.rates = rates
    }

    // ── Build notesInternal from raw extracted data ──
    const factLines: string[] = []
    if (fields.name) factLines.push(`Name: ${fields.name}`)
    if (fields.age) factLines.push(`Age: ${fields.age}`)
    if (fields.nationality) factLines.push(`Nationality: ${fields.nationality}`)
    if (fields.phone || fields.phone2) {
      const phones = [fields.phone, fields.phone2].filter(Boolean).join(', ')
      factLines.push(`Phone: ${phones}`)
    }
    if (fields.email) factLines.push(`Email: ${fields.email}`)
    if (fields.addressPostcode || fields.tubeStation) {
      const loc = [fields.addressPostcode, fields.tubeStation].filter(Boolean).join(', ')
      factLines.push(`Location: ${loc}`)
    }
    if (fields.languages?.length) factLines.push(`Languages: ${fields.languages.join(', ')}`)
    if (fields.height) factLines.push(`Height: ${fields.height}cm`)
    if (fields.weight) factLines.push(`Weight: ${fields.weight}kg`)
    if (fields.breastSize) factLines.push(`Bust: ${fields.breastSize} ${fields.breastType || ''}`.trim())
    if (fields.orientation) factLines.push(`Orientation: ${fields.orientation}`)
    if (fields.smokingStatus) factLines.push(`Smoking: ${fields.smokingStatus}`)
    if (fields.tattooStatus && fields.tattooStatus !== 'none') factLines.push(`Tattoo: ${fields.tattooStatus}`)
    if (fields.rates?.['1hour']?.incall) factLines.push(`1h incall: £${fields.rates['1hour'].incall}`)
    if (fields.rates?.['1hour']?.outcall) factLines.push(`1h outcall: £${fields.rates['1hour'].outcall}`)
    if (fields.rates?.['overnight']?.incall) factLines.push(`Overnight: £${fields.rates['overnight'].incall}`)
    fields.notesInternal = factLines.join(' | ')

    // ── Generate public bio via separate AI call ──
    try {
      const bioResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `You write elegant, professional bios for a high-end London companion agency website. Rules:
- 150–200 words, third person ("She is…", "Her…")
- Literary, warm, alluring tone — never vulgar
- Mention personality, appearance highlights, interests, what makes her special
- NEVER include: phone numbers, email, address, postcode, prices, rates, specific services
- NEVER use explicit sexual language
- Return ONLY the bio text, no quotes, no markdown`,
        messages: [{
          role: 'user',
          content: `Write a website bio for this companion based on the following profile data:\n\nName: ${fields.name || 'Unknown'}\nAge: ${fields.age || 'N/A'}\nNationality: ${fields.nationality || 'N/A'}\nLanguages: ${fields.languages?.join(', ') || 'English'}\nHeight: ${fields.height ? fields.height + 'cm' : 'N/A'}\nHair: ${fields.hairColour || 'N/A'}\nEyes: ${fields.eyesColour || 'N/A'}\nOrientation: ${fields.orientation || 'N/A'}\nBreast: ${fields.breastSize || 'N/A'} ${fields.breastType || ''}\nTattoo: ${fields.tattooStatus || 'N/A'}\nPiercing: ${fields.piercingTypes || 'N/A'}`
        }]
      })
      const bioText = bioResponse.content[0].type === 'text' ? bioResponse.content[0].text.trim() : ''
      if (bioText.length > 50) {
        fields.bio = bioText
      }
    } catch (e) {
      console.error('[parse-anketa] Bio generation failed (non-fatal):', e)
    }

    return NextResponse.json({ success: true, fields })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
