// ─── Normalize Anketa Fields ───
// Cleans raw parsed values into consistent DB-ready formats.

/**
 * Phone → E.164 (UK default)
 * "+44 7911 123 456" → "+447911123456"
 * "07911123456"      → "+447911123456"
 * "7911123456"       → "+447911123456"
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Strip everything except digits and leading +
  let digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null

  // Remove leading + for digit processing
  const hasPlus = digits.startsWith('+')
  if (hasPlus) digits = digits.slice(1)

  // UK mobile: starts with 0 → replace with 44
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = '44' + digits.slice(1)
  }

  // Bare UK mobile (7xxx): prepend 44
  if (digits.startsWith('7') && digits.length === 10) {
    digits = '44' + digits
  }

  // Must be at least 10 digits
  if (digits.length < 10) return raw.trim()

  return '+' + digits
}

/**
 * Height → centimetres (integer)
 * "5'7"      → 170
 * "5ft 7in"  → 170
 * "5ft7"     → 170
 * "1.70m"    → 170
 * "1,70"     → 170
 * "170cm"    → 170
 * "170"      → 170
 */
export function normalizeHeight(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const s = String(raw).trim().toLowerCase()
  if (!s) return null

  // Feet + inches: 5'7, 5ft7, 5ft 7in, 5'7", 5 ft 7
  const ftMatch = s.match(/(\d+)\s*(?:ft|'|feet)\s*(\d+)?\s*(?:in|"|inches?)?/)
  if (ftMatch) {
    const feet = parseInt(ftMatch[1])
    const inches = parseInt(ftMatch[2] || '0')
    return Math.round(feet * 30.48 + inches * 2.54)
  }

  // Metres with dot or comma: 1.70m, 1,70, 1.70
  const mMatch = s.match(/^(\d)[.,](\d{1,2})\s*m?$/)
  if (mMatch) {
    const metres = parseFloat(`${mMatch[1]}.${mMatch[2]}`)
    if (metres > 0.5 && metres < 2.5) return Math.round(metres * 100)
  }

  // Plain number, possibly with "cm"
  const num = parseFloat(s.replace(/cm/i, '').trim())
  if (isNaN(num)) return null

  // Disambiguate: if < 10, likely metres (e.g. "1.7")
  if (num > 0 && num < 3) return Math.round(num * 100)
  // Reasonable cm range
  if (num >= 100 && num <= 250) return Math.round(num)

  return null
}

/**
 * Weight → kilograms (integer)
 * "8st 5lb"  → 53
 * "8st"      → 51
 * "120lbs"   → 54
 * "53kg"     → 53
 * "53"       → 53
 */
export function normalizeWeight(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const s = String(raw).trim().toLowerCase()
  if (!s) return null

  // Stones + pounds: 8st 5lb, 8st5, 8 stone 5
  const stMatch = s.match(/(\d+)\s*(?:st|stone)\s*(\d+)?\s*(?:lb|lbs|pounds?)?/)
  if (stMatch) {
    const stones = parseInt(stMatch[1])
    const pounds = parseInt(stMatch[2] || '0')
    return Math.round(stones * 6.35029 + pounds * 0.453592)
  }

  // Pounds only: 120lbs, 120 lb
  const lbMatch = s.match(/^(\d+)\s*(?:lb|lbs|pounds?)$/)
  if (lbMatch) {
    return Math.round(parseInt(lbMatch[1]) * 0.453592)
  }

  // Plain number, possibly with "kg"
  const num = parseFloat(s.replace(/kg/i, '').trim())
  if (isNaN(num)) return null

  // Reasonable kg range
  if (num >= 30 && num <= 200) return Math.round(num)
  // Might be lbs if > 200
  if (num > 200 && num <= 400) return Math.round(num * 0.453592)

  return null
}

/**
 * Age → integer
 * "twenty-two"   → 22
 * "22 years old" → 22
 * "22"           → 22
 */
export function normalizeAge(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const s = String(raw).trim().toLowerCase()
  if (!s) return null

  // Try direct number first
  const numMatch = s.match(/(\d+)/)
  if (numMatch) {
    const n = parseInt(numMatch[1])
    if (n >= 18 && n <= 80) return n
  }

  // Word numbers
  const words: Record<string, number> = {
    eighteen: 18, nineteen: 19, twenty: 20,
    'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24,
    'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
    'twenty-nine': 29, thirty: 30, 'thirty-one': 31, 'thirty-two': 32,
    'thirty-three': 33, 'thirty-four': 34, 'thirty-five': 35,
    'thirty-six': 36, 'thirty-seven': 37, 'thirty-eight': 38,
    'thirty-nine': 39, forty: 40, 'forty-one': 41, 'forty-two': 42,
    'forty-three': 43, 'forty-four': 44, 'forty-five': 45,
  }
  for (const [word, val] of Object.entries(words)) {
    if (s.includes(word)) return val
  }

  return null
}

/**
 * Price → number in GBP
 * "£300"    → 300
 * "300 GBP" → 300
 * "300"     → 300
 * "$350"    → 350  (assume GBP equivalent)
 */
export function normalizePrice(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null

  // Strip currency symbols, commas, "GBP", "per hour" etc
  const cleaned = s.replace(/[£$€,]/g, '').replace(/\s*(gbp|per\s*hour|ph|p\/h)\s*/gi, '').trim()
  const num = parseFloat(cleaned)
  if (isNaN(num) || num <= 0) return null

  return Math.round(num)
}
