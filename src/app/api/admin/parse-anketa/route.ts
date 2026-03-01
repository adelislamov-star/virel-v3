// POST /api/admin/parse-anketa
// Accepts a file (FormData), extracts text, calls Claude, returns parsed profile fields

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT = `Extract escort profile data from this anketa/application text. The text may be in any language (English, Russian, Ukrainian, etc.) and any format.

Return ONLY a valid JSON object with these exact keys (use null if not found):
{
  "name": string,
  "age": string,
  "nationality": string,
  "height": string,
  "weight": string,
  "breastSize": string,
  "dressSizeUK": string,
  "eyesColour": string,
  "hairColour": string,
  "languages": string,
  "addressPostcode": string,
  "addressStreet": string,
  "tubeStation": string,
  "rate30min": string,
  "rate1hIn": string,
  "rate1hOut": string,
  "rate90minIn": string,
  "rate90minOut": string,
  "rate2hIn": string,
  "rate2hOut": string,
  "rateOvernight": string,
  "smokingStatus": string,
  "tattooStatus": string,
  "orientation": string
}

Rules:
- height/weight: numbers only (cm/kg)
- rates: numbers only (GBP)
- age: number as string
- For languages, join multiple with comma
- smokingStatus: "smoker" or "non-smoker"
- tattooStatus: "yes" or "no"

Anketa text:
`

async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  // Word (.docx)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // Excel (.xlsx / .xls / .csv)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv' ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.csv')
  ) {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const lines: string[] = []
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet)
      lines.push(csv)
    }
    return lines.join('\n')
  }

  // Plain text / fallback
  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const text = await extractText(buffer, file.type, file.name)

    if (!text.trim()) {
      return NextResponse.json({ success: false, error: 'Could not extract text from file' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: PROMPT + text.slice(0, 4000)
      }]
    })

    const raw = (message.content[0] as any).text
      .replace(/```json|```/g, '')
      .trim()

    const parsed = JSON.parse(raw)

    const clean: Record<string, string> = {
      notesInternal: text.slice(0, 800)
    }
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== null && v !== '' && v !== undefined) {
        clean[k] = String(v)
      }
    }

    return NextResponse.json({ success: true, fields: clean })
  } catch (e: any) {
    console.error('parse-anketa error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
