import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'

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

    const EXAMPLE_OUTPUT = `{"name":"Sophia","age":"24","height":"167","weight":"54","dressSizeUK":"8","feetSizeUK":"5","breastSize":"34C","breastType":"natural","eyesColour":"Green","hairColour":"Brown","smokingStatus":"no","tattooStatus":"small","piercingTypes":"Ears only","nationality":"Romanian","languages":["English","Romanian"],"orientation":"bisexual","workWithCouples":true,"workWithWomen":true,"blackClients":true,"disabledClients":false,"tubeStation":"Baker Street","addressStreet":"34 Baker Street","addressFlat":"4B","addressPostcode":"W1U 6RS","airportHeathrow":true,"airportGatwick":false,"airportStansted":false,"rate30min":"150","rate45min":"200","rate1hIn":"250","rate1hOut":"300","rate90minIn":"350","rate90minOut":"400","rate2hIn":"450","rate2hOut":"500","rateExtraHour":"200","rateOvernight":"1200","services":[{"code":"GFE"},{"code":"OWO","extraPrice":30},{"code":"69"},{"code":"DFK"},{"code":"B2B","extraPrice":20},{"code":"STRIPTEASE"},{"code":"TOYS"}]}`

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
- breastType: "natural" or "silicone"
- rates: number string, no currency symbols
- languages: array of strings
- booleans (workWithCouples, workWithWomen, blackClients, disabledClients, airports): true or false
- services: array of objects. Include service if answer is yes/has price, exclude if no/blank.
  Each object: {"code":"CODE"} or {"code":"CODE","extraPrice":NUMBER} if any price mentioned.
  Extra price detection — ALL these formats mean extraPrice (extract the number):
    "Yes Extra £30", "Yes Extra 30/", "Yes £30/", "£30", "30", "Extra 30", "30/"
  If only "Yes" with no number → no extraPrice. If "No" → exclude service entirely.
  Use ONLY codes from this list:
  69, FK, DFK, GFE, OWO, OWC, COB, CIF, CIM, SWALLOW, SNOWBALLING, DT, FINGERING,
  A_LEVEL, DP, PSE, PARTY_GIRL, FACE_SITTING, DIRTY_TALK, LADY_SERVICES,
  WS_GIVING, WS_RECEIVING, RIMMING_GIVING, RIMMING_RECEIVING, SMOKING_FETISH,
  ROLEPLAY, FILMING_MASK, FILMING_NO_MASK, FOOT_FETISH, OPEN_MINDED,
  LIGHT_DOM, SPANKING_GIVING, SPANKING_SOFT_RECEIVING, DUO, BI_DUO, COUPLES,
  MMF, GROUP, MASSAGE, PROSTATE, PROFESSIONAL_MASSAGE, B2B, EROTIC_MASSAGE,
  LOMILOMI, NURU, SENSUAL, TANTRIC, STRIPTEASE, LAPDANCING, BELLY_DANCE,
  UNIFORMS, TOYS, STRAP_ON, POPPERS, HANDCUFFS, DOMINATION, FISTING_GIVING, TIE_AND_TEASE`,
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

    return NextResponse.json({ success: true, fields })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
