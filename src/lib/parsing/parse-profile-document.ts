// Parse structured profile documents (DOCX/TXT content)
// Format: "Field Name -- Value" with -- as separator
// The document may arrive as a single long string or with line breaks.
// Step 1: Insert line breaks before known field keywords to normalize.
// Step 2: Parse each field with regex.

export interface ParsedRate {
  duration: string
  callType: 'incall' | 'outcall'
  price: number
  taxiFee: boolean
}

export interface ParsedService {
  name: string
  slug: string
  enabled: boolean
  extraPrice: number | null
}

export interface ParsedAddress {
  street: string | null
  flat: string | null
  floor: string | null
  postcode: string | null
  tubeStation: string | null
}

export interface ParsedProfile {
  name: string | null
  age: number | null
  heightCm: number | null
  weightKg: number | null
  nationality: string | null
  languages: string[]
  orientation: string | null
  hairColour: string | null
  eyeColour: string | null
  bustSize: string | null
  dressSize: string | null
  shoeSize: string | null
  smokes: boolean
  piercings: string | null
  worksWithCouples: boolean
  servesWomen: boolean
  address: ParsedAddress
  rates: ParsedRate[]
  services: ParsedService[]
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Known field headers — insert \n before each to normalize single-line documents
const FIELD_MARKERS = [
  /(?=\bNAME:\s)/i,
  /(?=\bAge\s*[-–—])/i,
  /(?=\bHeight\s*\()/i,
  /(?=\bWeight\s*\()/i,
  /(?=\bDress\s+size\s)/i,
  /(?=\bShoe\s+size\s)/i,
  /(?=\bBreast\s+size\s)/i,
  /(?=\bEye\s+colou?r?\s)/i,
  /(?=\bHair\s+colou?r?\s)/i,
  /(?=\bDo\s+you\s+smoke)/i,
  /(?=\bPiercing\s)/i,
  /(?=\bNationality\s)/i,
  /(?=\bLanguages?\s)/i,
  /(?=\bOrientation\s)/i,
  /(?=\*?Do\s+you\s+work\s+with\s+couples)/i,
  /(?=\*?Do\s+you\s+serve\s+women)/i,
  /(?=\bRATES:\s)/i,
  /(?=\b30\s*min\b)/i,
  /(?=\b45\s*min\b)/i,
  /(?=\b1h\s)/i,
  /(?=\b90\s*min\b)/i,
  /(?=\b2h\s)/i,
  /(?=\b3h\s)/i,
  /(?=\bExtra\s+hour\b)/i,
  /(?=\bOvernight\s+9h\b)/i,
  /(?=\bOvernight\b(?!\s+9h))/i,
  /(?=\bADDRESS:\s)/i,
  /(?=\bFlat\s+[A-Z0-9])/i,
  /(?=\bPOSTCODE\s)/i,
  /(?=\bTube\s+Station\s)/i,
  /(?=\bLIST\s+OF\s+SERVICES:)/i,
]

// (Service line markers removed — services are parsed by splitting on "-- Yes/No" pattern)

function normalizeText(text: string): string {
  let result = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Insert \n before each field marker
  for (const marker of FIELD_MARKERS) {
    result = result.replace(new RegExp(marker.source, 'gi'), '\n')
  }

  // Services section is parsed separately using split-on-separator approach

  return result
}

// Get a field value — stops at end of line
function getField(text: string, ...patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m && m[1]?.trim()) return m[1].trim()
  }
  return null
}

function parseYesNo(text: string, ...patterns: RegExp[]): boolean {
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m && m[1]) return /yes/i.test(m[1])
  }
  return false
}

export function parseProfileDocument(rawText: string): ParsedProfile {
  const text = normalizeText(rawText)

  // --- BASIC INFO --- (use $ with m flag to stop at end of line)
  const name = getField(text,
    /NAME:\s*(.+)$/im,
  )

  const ageStr = getField(text,
    /\bAge\s*[-–—]+\s*(\d+)/im,
  )
  const age = ageStr ? parseInt(ageStr) : null

  const heightRaw = getField(text,
    /Height\s*\(?.*?\)?\s*[-–—]+\s*([\d.]+)/im,
  )
  let heightCm: number | null = null
  if (heightRaw) {
    const h = parseFloat(heightRaw)
    heightCm = h < 3 ? Math.round(h * 100) : Math.round(h)
  }

  const weightRaw = getField(text,
    /Weight\s*\(?.*?\)?\s*[-–—]+\s*(\d+)/im,
  )
  const weightKg = weightRaw ? parseInt(weightRaw) : null

  const nationality = getField(text,
    /Nationality\s*[-–—]+\s*(.+)$/im,
  )

  const langStr = getField(text,
    /Languages?\s*\(?.*?\)?\s*[-–—]+\s*(.+)$/im,
  )
  const languages = langStr
    ? langStr.split(/,\s*|\s+and\s+/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 30)
    : []

  const orientation = getField(text,
    /Orientation\s*\(?.*?\)?\s*[-–—]+\s*(.+)$/im,
  )

  // --- APPEARANCE ---
  const hairColour = getField(text,
    /Hair\s*colou?r?\s*[-–—]+\s*(.+)$/im,
  )

  const eyeColour = getField(text,
    /Eye\s*colou?r?\s*[-–—]+\s*(.+)$/im,
  )

  const bustSize = getField(text,
    /Breast\s*size\s*\(?.*?\)?\s*[-–—]+\s*(.+)$/im,
    /Bust\s*size\s*\(?.*?\)?\s*[-–—]+\s*(.+)$/im,
  )

  const dressSize = getField(text,
    /Dress\s*size\s*\(?.*?\)?\s*[-–—]+\s*(.+)$/im,
  )

  const shoeSize = getField(text,
    /Shoe\s*size\s*[-–—]+\s*(.+)$/im,
  )

  // --- FLAGS ---
  const smokes = parseYesNo(text,
    /smok(?:e|ing|es)\??\s*[-–—]+\s*(yes|no)/i,
  )

  const piercings = getField(text,
    /Piercing\s*\(?.*?\)?\s*[-–—]+\s*(.+)$/im,
  )

  const worksWithCouples = parseYesNo(text,
    /work\s+with\s+couples\??\s*[-–—]+\s*(yes|no)/i,
  )

  const servesWomen = parseYesNo(text,
    /serve\s+women\??\s*[-–—]+\s*(yes|no)/i,
  )

  // --- ADDRESS ---
  const addressStreet = getField(text,
    /ADDRESS:\s*(.+)$/im,
  )

  const flat = getField(text,
    /^Flat\s+(.+)$/im,
  )

  const floor = getField(text,
    /floor\s+([-\d]+)/i,
  )

  const postcode = getField(text,
    /POSTCODE\s*[-–—:]*\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i,
  )

  const tubeStation = getField(text,
    /Tube\s+Station\s*[-–—]+\s*(.+)$/im,
  )

  const address: ParsedAddress = {
    street: addressStreet,
    flat: flat,
    floor: floor,
    postcode: postcode,
    tubeStation: tubeStation,
  }

  // --- RATES ---
  const rates: ParsedRate[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Find rate lines — between RATES: and ADDRESS/SERVICES
  let inRates = false
  for (const line of lines) {
    if (/^RATES:/i.test(line)) { inRates = true; continue }
    if (/^(?:ADDRESS|LIST\s+OF\s+SERVICES|SERVICES)/i.test(line)) { inRates = false; continue }
    if (!inRates) continue

    const hasTaxi = /\+\s*taxi/i.test(line)

    let duration: string | null = null
    if (/overnight\s*9h/i.test(line)) duration = 'overnight_9h'
    else if (/overnight/i.test(line)) duration = 'overnight'
    else if (/extra\s*hour/i.test(line)) duration = 'extra_hour'
    else if (/30\s*min/i.test(line)) duration = '30min'
    else if (/45\s*min/i.test(line)) duration = '45min'
    else if (/90\s*min/i.test(line)) duration = '90min'
    else if (/2\s*h/i.test(line)) duration = '2hours'
    else if (/3\s*h/i.test(line)) duration = '3hours'
    else if (/1\s*h/i.test(line)) duration = '1hour'
    if (!duration) continue

    // Strip the duration prefix to avoid matching duration numbers as prices
    // e.g. "30 min - 350" → strip "30 min" to get "- 350"
    const stripped = line
      .replace(/^\d+\s*(?:min|h\b|hour|hours)/i, '')
      .replace(/^overnight\s*(?:9h)?/i, '')
      .replace(/^extra\s*hour/i, '')
      .trim()

    const priceMatches = [...stripped.matchAll(/£?\s*(\d{2,})/g)]
    if (priceMatches.length === 0) continue

    const isIncall = /in\s*call/i.test(line)
    const isOutcall = /out\s*call/i.test(line)

    if (isIncall && isOutcall) {
      if (priceMatches.length >= 2) {
        rates.push({ duration, callType: 'incall', price: parseInt(priceMatches[0][1]), taxiFee: false })
        rates.push({ duration, callType: 'outcall', price: parseInt(priceMatches[1][1]), taxiFee: hasTaxi })
      }
    } else if (isOutcall) {
      rates.push({ duration, callType: 'outcall', price: parseInt(priceMatches[0][1]), taxiFee: hasTaxi })
    } else if (isIncall) {
      rates.push({ duration, callType: 'incall', price: parseInt(priceMatches[0][1]), taxiFee: false })
    } else {
      // No explicit qualifier
      if (priceMatches.length >= 2) {
        rates.push({ duration, callType: 'incall', price: parseInt(priceMatches[0][1]), taxiFee: false })
        rates.push({ duration, callType: 'outcall', price: parseInt(priceMatches[1][1]), taxiFee: hasTaxi })
      } else {
        rates.push({ duration, callType: 'incall', price: parseInt(priceMatches[0][1]), taxiFee: false })
      }
    }
  }

  // --- SERVICES ---
  // Split-on-separator approach: handles single-line documents correctly
  const services: ParsedService[] = []
  const servicesMatch = rawText.match(/(?:LIST\s+OF\s+)?SERVICES:\s*([\s\S]*?)$/i)
  if (servicesMatch) {
    const servicesText = servicesMatch[1]
    // Split by "-- Yes" / "-- No" / "- Yes" / "- No" separators, keeping them
    const parts = servicesText.split(/([-–—]+\s*(?:yes|no)\b)/i)

    for (let i = 0; i < parts.length - 1; i += 2) {
      const nameChunk = parts[i]
      const separator = parts[i + 1] || ''
      const afterChunk = parts[i + 2] || ''

      const enabled = /yes/i.test(separator)

      // Clean: remove "extra £XX" leftovers from previous entry, parenthetical descriptions
      let serviceName = nameChunk
        .replace(/,?\s*(?:extra\s*)?£\s*\d+\s*/gi, ' ')
        .replace(/\(.*?\)/g, '')
        .replace(/^\*+/, '')
        .trim()

      if (!serviceName || serviceName.length > 60) continue

      // Check for extra price in afterChunk (before next service name)
      let extraPrice: number | null = null
      const afterExtra = afterChunk.match(/^,?\s*(?:extra\s*)?£\s*(\d+)/i)
      if (afterExtra) {
        extraPrice = parseInt(afterExtra[1])
      }

      services.push({
        name: serviceName,
        slug: slugify(serviceName),
        enabled,
        extraPrice,
      })
    }
  }

  return {
    name,
    age,
    heightCm,
    weightKg,
    nationality,
    languages,
    orientation,
    hairColour,
    eyeColour,
    bustSize,
    dressSize,
    shoeSize,
    smokes,
    piercings,
    worksWithCouples,
    servesWomen,
    address,
    rates,
    services,
  }
}
