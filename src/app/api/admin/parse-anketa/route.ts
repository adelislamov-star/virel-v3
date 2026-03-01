// POST /api/admin/parse-anketa
// Pure regex parser — NO AI, no external calls.
// Supports .txt / .docx / .xlsx / .csv in any format/language.

import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const SERVICE_KEYS = [
  '69','DFK','DIRTY_TALK','FK','FACE_SITTING','FINGERING','GFE','LADY_SERVICES',
  'OPEN_MINDED','PSE','PARTY_GIRL',
  'CIF','CIM','COB','DT','OWC','OWO','SNOWBALLING','SWALLOW',
  'A_LEVEL','BI_DUO','COUPLES','DP','DUO','FILMING_MASK','FILMING_NO_MASK',
  'GROUP','MMF','RIMMING_GIVING','RIMMING_RECEIVING','WS_GIVING','WS_RECEIVING',
  'EROTIC_MASSAGE','LOMILOMI','MASSAGE','NURU','PROFESSIONAL_MASSAGE',
  'PROSTATE','SENSUAL','TANTRIC',
  'BELLY_DANCE','LAPDANCING','ROLEPLAY','STRIPTEASE',
  'DOMINATION','FISTING_GIVING','FOOT_FETISH','LIGHT_DOM','SMOKING_FETISH',
  'SPANKING_SOFT_RECEIVING','SPANKING_GIVING','TIE_AND_TEASE',
  'HANDCUFFS','POPPERS','STRAP_ON','TOYS','UNIFORMS'
]

const SERVICE_ALIASES: Record<string, string> = {
  'girlfriend experience': 'GFE',
  'deep french kiss': 'DFK', 'deep french kissing': 'DFK',
  'dirty talk': 'DIRTY_TALK',
  'french kiss': 'FK', 'french kissing': 'FK',
  'face sitting': 'FACE_SITTING', 'facesitting': 'FACE_SITTING',
  'fingering': 'FINGERING',
  'lady services': 'LADY_SERVICES',
  'open minded': 'OPEN_MINDED',
  'porn star experience': 'PSE',
  'party girl': 'PARTY_GIRL',
  'cum in face': 'CIF',
  'cum in mouth': 'CIM',
  'cum on body': 'COB',
  'deep throat': 'DT', 'deepthroat': 'DT',
  'bj with condom': 'OWC', 'blowjob with condom': 'OWC',
  'bj without condom': 'OWO', 'blowjob without condom': 'OWO',
  'snowballing': 'SNOWBALLING',
  'swallow': 'SWALLOW',
  'anal': 'A_LEVEL', 'a level': 'A_LEVEL',
  'bi duo': 'BI_DUO',
  'couples': 'COUPLES',
  'double penetration': 'DP',
  'group sex': 'GROUP',
  'rimming giving': 'RIMMING_GIVING',
  'rimming receiving': 'RIMMING_RECEIVING',
  'watersports giving': 'WS_GIVING', 'golden shower giving': 'WS_GIVING',
  'watersports receiving': 'WS_RECEIVING', 'golden shower receiving': 'WS_RECEIVING',
  'erotic massage': 'EROTIC_MASSAGE',
  'lomi lomi': 'LOMILOMI', 'lomilomi': 'LOMILOMI',
  'nuru massage': 'NURU',
  'professional massage': 'PROFESSIONAL_MASSAGE',
  'prostate massage': 'PROSTATE',
  'sensual massage': 'SENSUAL',
  'tantric massage': 'TANTRIC',
  'belly dance': 'BELLY_DANCE', 'belly dancing': 'BELLY_DANCE',
  'lap dance': 'LAPDANCING', 'lapdance': 'LAPDANCING',
  'role play': 'ROLEPLAY',
  'strip tease': 'STRIPTEASE',
  'domination': 'DOMINATION',
  'fisting': 'FISTING_GIVING',
  'foot fetish': 'FOOT_FETISH', 'feet fetish': 'FOOT_FETISH',
  'light dom': 'LIGHT_DOM', 'light domination': 'LIGHT_DOM',
  'smoking fetish': 'SMOKING_FETISH',
  'spanking receiving': 'SPANKING_SOFT_RECEIVING',
  'spanking giving': 'SPANKING_GIVING',
  'tie and tease': 'TIE_AND_TEASE',
  'strap on': 'STRAP_ON', 'strapon': 'STRAP_ON',
  'sex toys': 'TOYS',
  'uniform': 'UNIFORMS',
}

function esc(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function findVal(lines: string[], ...keys: string[]): string | null {
  for (const line of lines) {
    for (const key of keys) {
      const m = line.match(new RegExp(`^${esc(key)}\\s*[:\\-=]\\s*(.+)$`, 'i'))
      if (m && m[1].trim()) return m[1].trim()
    }
  }
  return null
}

function findNum(lines: string[], ...keys: string[]): string | null {
  const v = findVal(lines, ...keys)
  if (!v) return null
  const m = v.match(/\d+(\.\d+)?/)
  return m ? m[0] : null
}

function parseServices(text: string) {
  const yes: string[] = []
  const extra: string[] = []
  const lower = text.toLowerCase()
  const seen = new Set<string>()

  const all = [
    ...SERVICE_KEYS.map(k => ({ code: k, pattern: k.toLowerCase() })),
    ...Object.entries(SERVICE_ALIASES).map(([alias, code]) => ({ code, pattern: alias }))
  ]

  for (const { code, pattern } of all) {
    if (seen.has(code)) continue
    const re = new RegExp(`${esc(pattern)}\\s*[:\\-=]\\s*(yes|no|extra)`, 'i')
    const m = lower.match(re)
    if (m) {
      seen.add(code)
      const val = m[1].toLowerCase()
      if (val === 'yes') yes.push(code)
      else if (val === 'extra') extra.push(code)
    }
  }
  return { yes, extra }
}

async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv' ||
    fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')
  ) {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    return workbook.SheetNames.map(n => XLSX.utils.sheet_to_csv(workbook.Sheets[n])).join('\n')
  }
  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractText(buffer, file.type, file.name)
    if (!text.trim()) return NextResponse.json({ success: false, error: 'Empty file' }, { status: 400 })

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

    const fields: Record<string, any> = {
      notesInternal: text.slice(0, 1000),
      name:           findVal(lines, 'name', 'model name', 'stage name', 'working name'),
      age:            findNum(lines, 'age'),
      height:         findNum(lines, 'height'),
      weight:         findNum(lines, 'weight'),
      nationality:    findVal(lines, 'nationality', 'country', 'origin', 'from'),
      hairColour:     findVal(lines, 'hair colour', 'hair color', 'hair'),
      eyesColour:     findVal(lines, 'eye colour', 'eye color', 'eyes'),
      breastSize:     findVal(lines, 'breast size', 'bust', 'bra size', 'cup'),
      dressSizeUK:    findVal(lines, 'dress size', 'uk size', 'size uk', 'clothing size', 'dress'),
      smokingStatus:  findVal(lines, 'smoking'),
      tattooStatus:   findVal(lines, 'tattoo'),
      orientation:    findVal(lines, 'orientation'),
      languages:      findVal(lines, 'languages', 'language', 'speaks'),
      piercing:       findVal(lines, 'piercing', 'piercings'),
      addressStreet:  findVal(lines, 'street', 'street address', 'address'),
      addressPostcode:findVal(lines, 'postcode', 'post code', 'postal code', 'zip'),
      tubeStation:    findVal(lines, 'tube', 'tube station', 'nearest tube', 'underground'),
      rate30min:      findNum(lines, '30 min incall', '30min incall', '30 min'),
      rate45min:      findNum(lines, '45 min incall', '45min incall', '45 min'),
      rate1hIn:       findNum(lines, '1 hour incall', '1hr incall', '1h incall'),
      rate1hOut:      findNum(lines, '1 hour outcall', '1hr outcall', '1h outcall'),
      rate90minIn:    findNum(lines, '90 min incall', '90min incall', '90 min'),
      rate90minOut:   findNum(lines, '90 min outcall', '90min outcall'),
      rate2hIn:       findNum(lines, '2 hours incall', '2hr incall', '2h incall'),
      rate2hOut:      findNum(lines, '2 hours outcall', '2hr outcall', '2h outcall'),
      rateOvernight:  findNum(lines, 'overnight', 'overnight incall'),
    }

    const { yes, extra } = parseServices(text)
    if (yes.length || extra.length) {
      fields.services = [...yes, ...extra]
    }

    const clean: Record<string, any> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v !== null && v !== undefined && v !== '') clean[k] = v
    }

    return NextResponse.json({ success: true, fields: clean })
  } catch (e: any) {
    console.error('parse-anketa error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
