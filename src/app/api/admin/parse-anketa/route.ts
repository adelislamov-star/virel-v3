import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())
  if (ext === 'docx') {
    const r = await mammoth.extractRawText({ buffer: buf })
    return r.value
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

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are parsing an escort model application form. Extract all fields and return ONLY valid JSON, no markdown, no explanation.

Return this exact structure:
{
  "name": "",
  "age": "",
  "height": "",
  "weight": "",
  "dressSizeUK": "",
  "breastSize": "",
  "breastType": "",
  "eyesColour": "",
  "hairColour": "",
  "smokingStatus": "",
  "tattooStatus": "",
  "piercingStatus": "",
  "nationality": "",
  "languages": [],
  "orientation": "",
  "workWithCouples": false,
  "workWithWomen": false,
  "blackClients": true,
  "disabledClients": true,
  "tubeStation": "",
  "postcode": "",
  "rate30min": "",
  "rate45min": "",
  "rate1hIn": "",
  "rate1hOut": "",
  "rate90minIn": "",
  "rate90minOut": "",
  "rate2hIn": "",
  "rate2hOut": "",
  "rateExtraHour": "",
  "rateOvernight": "",
  "services": []
}

Rules:
- height: always in cm as integer string (e.g. "165", convert "1,65" to "165")
- age, weight: integer string
- smokingStatus: "yes" or "no"
- tattooStatus: "none", "small", "medium", or "large"
- piercingStatus: "none" or description
- orientation: "heterosexual" or "bisexual"
- breastType: "natural" or "silicone"
- rates: numbers only, no £ sign
- languages: array of language names only e.g. ["English", "French"]
- services: array of codes from this list only (include if answer is yes or extra, exclude if no):
  69, FK, DFK, GFE, OWO, OWC, COB, CIF, CIM, SWALLOW, SNOWBALLING, DT, FINGERING,
  A_LEVEL, DP, PSE, PARTY_GIRL, FACE_SITTING, DIRTY_TALK, LADY_SERVICES,
  WS_GIVING, WS_RECEIVING, RIMMING_GIVING, RIMMING_RECEIVING, SMOKING_FETISH,
  ROLEPLAY, FILMING_MASK, FILMING_NO_MASK, FOOT_FETISH, OPEN_MINDED,
  LIGHT_DOM, SPANKING_GIVING, SPANKING_SOFT_RECEIVING, DUO, BI_DUO, COUPLES,
  MMF, GROUP, MASSAGE, PROSTATE, PROFESSIONAL_MASSAGE, B2B, EROTIC_MASSAGE,
  LOMILOMI, NURU, SENSUAL, TANTRIC, STRIPTEASE, LAPDANCING, BELLY_DANCE,
  UNIFORMS, TOYS, STRAP_ON, POPPERS, HANDCUFFS, DOMINATION, FISTING_GIVING, TIE_AND_TEASE

Form text:
${text}`
      }]
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
