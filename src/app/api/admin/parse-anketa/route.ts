// POST /api/admin/parse-anketa
// Handles docx anketa format: "FIELD – value" (en-dash separator)

import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const SERVICE_MAP: [string, string][] = [
  ['69', '69'],
  ['deep french', 'DFK'], ['dfk', 'DFK'],
  ['french kissing without', 'FK'], [' fk ', 'FK'], ['fk(', 'FK'],
  ['girlfriend experience', 'GFE'], ['gfe', 'GFE'],
  ['blow job without', 'OWO'], ['owo', 'OWO'],
  ['blow job with', 'OWC'], ['owc', 'OWC'],
  ['cum on body', 'COB'], ['cob', 'COB'],
  ['cum in face', 'CIF'], ['cif', 'CIF'],
  ['cum in mouth', 'CIM'], ['cim', 'CIM'],
  ['swallow', 'SWALLOW'],
  ['snowball', 'SNOWBALLING'],
  ['deep throat', 'DT'],
  ['fingering', 'FINGERING'],
  ['a-level', 'A_LEVEL'], ['anal sex', 'A_LEVEL'],
  ['double penetration', 'DP'], [' dp ', 'DP'], ['dp(', 'DP'],
  ['porn star', 'PSE'], ['pse', 'PSE'],
  ['party girl', 'PARTY_GIRL'],
  ['face sitting', 'FACE_SITTING'],
  ['dirty talk', 'DIRTY_TALK'],
  ["lady's service", 'LADY_SERVICES'],
  ['ws giving', 'WS_GIVING'],
  ['ws receiving', 'WS_RECEIVING'],
  ['rimming giving', 'RIMMING_GIVING'],
  ['rimming receiving', 'RIMMING_RECEIVING'],
  ['smoking fetish', 'SMOKING_FETISH'],
  ['roleplay', 'ROLEPLAY'],
  ['filming with mask', 'FILMING_MASK'],
  ['filming without mask', 'FILMING_NO_MASK'],
  ['foot fetish', 'FOOT_FETISH'],
  ['squirting', 'SQUIRTING'],
  ['open minded', 'OPEN_MINDED'],
  ['light dom', 'LIGHT_DOM'],
  ['spanking giving', 'SPANKING_GIVING'],
  ['soft spanking receiving', 'SPANKING_SOFT_RECEIVING'],
  ['spanking receiving', 'SPANKING_SOFT_RECEIVING'],
  ['bi duo', 'BI_DUO'],
  [' duo', 'DUO'],
  ['couples', 'COUPLES'],
  ['mmf', 'MMF'],
  ['group', 'GROUP'],
  ['prostate massage', 'PROSTATE'],
  ['professional massage', 'PROFESSIONAL_MASSAGE'],
  ['body to body', 'BODY_TO_BODY'],
  ['erotic massage', 'EROTIC_MASSAGE'],
  ['lomilomi', 'LOMILOMI'],
  ['nuru', 'NURU'],
  ['sensual massage', 'SENSUAL'],
  ['tantric', 'TANTRIC'],
  ['massage', 'MASSAGE'],
  ['striptease', 'STRIPTEASE'],
  ['lapdanc', 'LAPDANCING'],
  ['belly dance', 'BELLY_DANCE'], ['belly-dance', 'BELLY_DANCE'],
  ['uniforms', 'UNIFORMS'],
  ['strap-on', 'STRAP_ON'],
  ['poppers', 'POPPERS'],
  ['handcuffs', 'HANDCUFFS'],
  ['fisting giving', 'FISTING_GIVING'],
  ['fisting receiving', 'FISTING_RECEIVING'],
  ['domination', 'DOMINATION'],
  ['tie and tease', 'TIE_AND_TEASE'],
  ['toys', 'TOYS'],
]

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

function findField(text: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = text.match(new RegExp(
    esc + '[\\s?*]*(?:--|[–—])\\s*(.+?)(?=\\s+\\*?[A-Z][a-zA-Z\\s()/+?]+\\s*(?:--|[–—])|$)',
    'i'
  ))
  if (!m) return ''
  return m[1].replace(/\s+[A-Z][A-Z\s]+$/, '').trim()
}

function parseRates(text: string): Record<string, string> {
  const rates: Record<string, string> = {}
  const pairs: [RegExp, string][] = [
    [/30\s*min[^£\n]*£\s*(\d+)/i, 'rate30min'],
    [/45\s*min[^£\n]*£\s*(\d+)/i, 'rate45min'],
    [/1h\s*out\s*call[^£\n]*£\s*(\d+)/i, 'rate1hOut'],
    [/1h\s*in\s*call[^£\n]*£\s*(\d+)/i, 'rate1hIn'],
    [/1\s*hour\s*out[^£\n]*£\s*(\d+)/i, 'rate1hOut'],
    [/1\s*hour\s*in[^£\n]*£\s*(\d+)/i, 'rate1hIn'],
    [/90\s*min\s*out[^£\n]*£\s*(\d+)/i, 'rate90minOut'],
    [/90\s*min(?!\s*out)[^£\n]*£\s*(\d+)/i, 'rate90minIn'],
    [/2h\s*out\s*call[^£\n]*£\s*(\d+)/i, 'rate2hOut'],
    [/2h\s*in\s*call[^£\n]*£\s*(\d+)/i, 'rate2hIn'],
    [/2\s*hour\s*out[^£\n]*£\s*(\d+)/i, 'rate2hOut'],
    [/2\s*hour\s*in[^£\n]*£\s*(\d+)/i, 'rate2hIn'],
    [/extra\s*hour[^£\n]*£\s*(\d+)/i, 'rateExtraHour'],
    [/overnight[^£\n]*£\s*(\d+)/i, 'rateOvernight'],
  ]
  for (const [re, key] of pairs) {
    if (rates[key]) continue
    const m = text.match(re)
    if (m) rates[key] = m[1]
  }
  return rates
}

function parseServices(text: string): string[] {
  const result = new Set<string>()
  const servIdx = text.search(/list of services/i)
  const servText = servIdx >= 0 ? text.slice(servIdx) : text

  const re = /([A-Za-z0-9][^–—\n]{1,60}?)\s*[–—]\s*(yes|no|extra)/gi
  let m
  while ((m = re.exec(servText)) !== null) {
    if (m[2].toLowerCase() === 'no') continue
    const cleanName = (' ' + m[1].replace(/extra\s*£\s*\d+\s*/gi, '').trim() + ' ').toLowerCase()
    for (const [pattern, code] of SERVICE_MAP) {
      if (cleanName.includes(pattern.toLowerCase())) {
        result.add(code)
        break
      }
    }
  }
  return Array.from(result)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'No file' }, { status: 400 })

    const text = await extractText(file)

    const nameRaw = findField(text, 'NAME:') || findField(text, 'Name')
    const ageRaw = findField(text, 'Age')
    const heightRaw = findField(text, 'Height (cm)') || findField(text, 'Height')
    const weightRaw = findField(text, 'Weight (kg)') || findField(text, 'Weight')
    const dressSizeUK = findField(text, 'Dress (UK size)') || findField(text, 'Dress Size')
    const breastRaw = findField(text, 'Breast size (natural / silicone)') || findField(text, 'Breast size') || findField(text, 'Breast')
    const eyesColour = findField(text, 'Eyes colour') || findField(text, 'Eye colour')
    const hairColour = findField(text, 'Hair colour') || findField(text, 'Hair color')
    const smokingRaw = findField(text, 'Do you smoke?') || findField(text, 'Smoking')
    const tattooRaw = findField(text, 'Tattoo (small / medium / large)') || findField(text, 'Tattoo')
    const piercingRaw = findField(text, 'Piercings (which types)') || findField(text, 'Piercing')
    const nationality = findField(text, 'Nationality')
    const languagesRaw = findField(text, 'Languages (+ levels)') || findField(text, 'Languages')
    const orientationRaw = findField(text, 'Orientation (Bi / Hetero)') || findField(text, 'Orientation')
    const couplesRaw = findField(text, 'Do you work with couples?') || findField(text, 'work with couples')
    const womenRaw = findField(text, 'Do you work with women?') || findField(text, 'work with women')
    const blackRaw = findField(text, 'Black clients')
    const disabledRaw = findField(text, 'Disabled clients')
    const tubeStationRaw = findField(text, 'Tube Station') || findField(text, 'Tube station')
    const tubeStation = tubeStationRaw.split(/\s+/).slice(0, 3).join(' ')

    const postcodeMatch = text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/)
    const postcode = postcodeMatch ? postcodeMatch[1] : ''

    const heightNum = parseFloat(heightRaw.replace(',', '.'))
    const height = heightNum > 0 ? (heightNum < 10 ? String(Math.round(heightNum * 100)) : String(Math.round(heightNum))) : ''

    const age = ageRaw.match(/\d+/)?.[0] || ''
    const weight = weightRaw.match(/\d+/)?.[0] || ''
    const breastSizeM = breastRaw.match(/(\d+[a-zA-Z]+)/)
    const breastSize = breastSizeM ? breastSizeM[1].toUpperCase() : ''
    const breastType = /silicone/i.test(breastRaw) ? 'silicone' : /natural/i.test(breastRaw) ? 'natural' : ''
    const smokingStatus = /^no/i.test(smokingRaw) ? 'no' : /^yes/i.test(smokingRaw) ? 'yes' : smokingRaw
    const tattooStatus = /^no/i.test(tattooRaw) ? 'none' : /small/i.test(tattooRaw) ? 'small' : /medium/i.test(tattooRaw) ? 'medium' : /large/i.test(tattooRaw) ? 'large' : tattooRaw
    const piercingStatus = /^no/i.test(piercingRaw) ? 'none' : piercingRaw
    const orientation = /bi/i.test(orientationRaw) ? 'bisexual' : /hetero/i.test(orientationRaw) ? 'heterosexual' : orientationRaw
    const languages = languagesRaw.split(/[,/]/).map((l: string) => l.trim().split(' ')[0]).filter(Boolean)
    const workWithCouples = /yes/i.test(couplesRaw)
    const workWithWomen = /yes/i.test(womenRaw)
    const blackClients = !/^no/i.test(blackRaw)
    const disabledClients = !/^no/i.test(disabledRaw)

    const rates = parseRates(text)
    const services = parseServices(text)

    return NextResponse.json({
      success: true,
      fields: {
        name: nameRaw, age, height, weight,
        dressSizeUK, breastSize, breastType,
        eyesColour, hairColour, smokingStatus,
        tattooStatus, piercingStatus, nationality,
        languages, orientation,
        workWithCouples, workWithWomen,
        blackClients, disabledClients,
        tubeStation, postcode,
        ...rates,
        services,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
