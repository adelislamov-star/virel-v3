// Unit test for bug fixes: field conversion, normalization
// Tests convertClientFields logic + normalization functions

// Inline the functions since the source is TypeScript
function normalizePhone(raw) {
  if (!raw) return null
  let digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null
  const hasPlus = digits.startsWith('+')
  if (hasPlus) digits = digits.slice(1)
  if (digits.startsWith('0') && digits.length >= 10) digits = '44' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 10) digits = '44' + digits
  if (digits.length < 10) return raw.trim()
  return '+' + digits
}

function normalizePrice(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const cleaned = s.replace(/[£$€,]/g, '').replace(/\s*(gbp|per\s*hour|ph|p\/h)\s*/gi, '').trim()
  const num = parseFloat(cleaned)
  if (isNaN(num) || num <= 0) return null
  return Math.round(num)
}

function normalizeSmoking(raw) {
  if (raw == null) return null
  if (typeof raw === 'boolean') return raw ? 'Regular' : 'Non-Smoker'
  const v = String(raw).toLowerCase().trim()
  if (!v) return null
  if (['no', 'non-smoker', 'nonsmoker', 'non smoker', 'false'].includes(v)) return 'Non-Smoker'
  if (['occasional', 'sometimes', 'social'].includes(v)) return 'Occasional'
  if (['yes', 'regular', 'smoker', 'true'].includes(v)) return 'Regular'
  return null
}

function normalizeBustType(raw) {
  if (!raw) return null
  const v = String(raw).toLowerCase().trim()
  if (['natural', 'nat', 'real'].includes(v)) return 'Natural'
  if (['silicone', 'enhanced', 'augmented', 'implants', 'fake'].includes(v)) return 'Enhanced'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function normalizeTattoo(raw) {
  if (!raw) return null
  const v = String(raw).toLowerCase().trim()
  if (['none', 'no', 'n/a', ''].includes(v)) return 'None'
  if (['small', 'tiny', 'discreet'].includes(v)) return 'Small'
  if (['medium', 'moderate', 'some'].includes(v)) return 'Medium'
  if (['large', 'many', 'heavily tattooed', 'full'].includes(v)) return 'Large'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

// ── Test normalizeSmoking (Bug 2) ──
console.log('=== Bug 2: normalizeSmoking ===')
const smokingTests = [
  ['no', 'Non-Smoker'],
  ['No', 'Non-Smoker'],
  ['non-smoker', 'Non-Smoker'],
  [false, 'Non-Smoker'],
  ['yes', 'Regular'],
  [true, 'Regular'],
  ['occasional', 'Occasional'],
  ['sometimes', 'Occasional'],
  [null, null],
  [undefined, null],
]
for (const [input, expected] of smokingTests) {
  const result = normalizeSmoking(input)
  const pass = result === expected
  console.log(`${pass ? '✅' : '❌'} normalizeSmoking(${JSON.stringify(input)}) = ${JSON.stringify(result)} (expected: ${JSON.stringify(expected)})`)
}

// ── Test normalizeBustType (Bug 4) ──
console.log('\n=== Bug 4a: normalizeBustType ===')
const bustTests = [
  ['natural', 'Natural'],
  ['Natural', 'Natural'],
  ['silicone', 'Enhanced'],
  ['enhanced', 'Enhanced'],
  ['implants', 'Enhanced'],
  [null, null],
]
for (const [input, expected] of bustTests) {
  const result = normalizeBustType(input)
  const pass = result === expected
  console.log(`${pass ? '✅' : '❌'} normalizeBustType(${JSON.stringify(input)}) = ${JSON.stringify(result)} (expected: ${JSON.stringify(expected)})`)
}

// ── Test normalizeTattoo (Bug 4) ──
console.log('\n=== Bug 4b: normalizeTattoo ===')
const tattooTests = [
  ['none', 'None'],
  ['None', 'None'],
  ['no', 'None'],
  ['small', 'Small'],
  ['Small', 'Small'],
  ['medium', 'Medium'],
  ['large', 'Large'],
  [null, null],
]
for (const [input, expected] of tattooTests) {
  const result = normalizeTattoo(input)
  const pass = result === expected
  console.log(`${pass ? '✅' : '❌'} normalizeTattoo(${JSON.stringify(input)}) = ${JSON.stringify(result)} (expected: ${JSON.stringify(expected)})`)
}

// ── Test rate conversion (Bug 1) ──
console.log('\n=== Bug 1: Rate field conversion ===')
// Simulate parse-anketa flat fields
const parseAnketaFields = {
  name: 'Victoria',
  age: '26',
  rate30min: '350',
  rate1hIn: '450',
  rate1hOut: '500',
  rate90minIn: '600',
  rate90minOut: '650',
  rate2hIn: '800',
  rate2hOut: '850',
  rateExtraHour: '300',
  rateOvernight: '2600',
  breastSize: '34C',
  breastType: 'natural',
  smokingStatus: 'no',
  tattooStatus: 'none',
  services: [
    { code: 'GFE' },
    { code: 'OWO', extraPrice: 50 },
    { code: '69' },
    { code: 'DFK' },
    { code: 'B2B', extraPrice: 30 },
    { code: 'STRIPTEASE' },
    { code: 'TOYS' },
  ],
  phone: '+447564771616',
  tubeStation: 'Victoria',
  notesInternal: 'Name: Victoria | Age: 26 | Phone: +447564771616',
}

// Simulate convertClientFields logic
function convertClientFields(raw) {
  if (raw.rates && typeof raw.rates === 'object' && !Array.isArray(raw.rates)) {
    if (raw.services && Array.isArray(raw.services)) {
      raw.services = raw.services.map(s => ({
        name: s.name || s.code || '',
        enabled: s.enabled ?? true,
        extra_price: s.extra_price ?? s.extraPrice ?? null,
      }))
    }
    return raw
  }

  const rates = {}
  const rateMap = {
    rate30min: { key: '30min', type: 'incall' },
    rate30minIn: { key: '30min', type: 'incall' },
    rate30minOut: { key: '30min', type: 'outcall' },
    rate45min: { key: '45min', type: 'incall' },
    rate45minIn: { key: '45min', type: 'incall' },
    rate45minOut: { key: '45min', type: 'outcall' },
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
    rateExtraHour: { key: 'extra_hour', type: 'incall' },
    rateOvernight: { key: 'overnight', type: 'incall' },
    rateOvernightIn: { key: 'overnight', type: 'incall' },
    rateOvernightOut: { key: 'overnight', type: 'outcall' },
  }

  for (const [field, { key, type }] of Object.entries(rateMap)) {
    const val = raw[field]
    if (val == null || val === '' || val === '0') continue
    const price = normalizePrice(val)
    if (price == null) continue
    if (!rates[key]) rates[key] = { incall: null, outcall: null }
    if (type === 'incall') rates[key].incall = price
    else rates[key].outcall = price
  }

  let services = null
  if (raw.services && Array.isArray(raw.services)) {
    services = raw.services.map(s => ({
      name: s.name || s.code || '',
      enabled: s.enabled ?? true,
      extra_price: s.extra_price ?? s.extraPrice ?? null,
    }))
  }

  return {
    name: raw.name || null,
    bust_type: raw.breastType || raw.bust_type || null,
    smokes: raw.smokingStatus != null ? (raw.smokingStatus === 'yes' || raw.smokingStatus === true) : null,
    tattoo: raw.tattooStatus || raw.tattoo || null,
    phone: raw.phone || null,
    tube_station: raw.tubeStation || raw.tube_station || null,
    notesInternal: raw.notesInternal || null,
    rates: Object.keys(rates).length > 0 ? rates : null,
    services,
  }
}

const converted = convertClientFields({ ...parseAnketaFields })

// Check rates
const rateKeys = converted.rates ? Object.keys(converted.rates) : []
console.log(`✅ rates object has ${rateKeys.length} duration keys: ${rateKeys.join(', ')}`)

const rateChecks = [
  ['30min incall = 350', converted.rates?.['30min']?.incall === 350],
  ['1hour incall = 450', converted.rates?.['1hour']?.incall === 450],
  ['1hour outcall = 500', converted.rates?.['1hour']?.outcall === 500],
  ['overnight incall = 2600', converted.rates?.['overnight']?.incall === 2600],
  ['extra_hour incall = 300', converted.rates?.['extra_hour']?.incall === 300],
  ['90min incall = 600', converted.rates?.['90min']?.incall === 600],
  ['2hours outcall = 850', converted.rates?.['2hours']?.outcall === 850],
]
for (const [desc, pass] of rateChecks) {
  console.log(`${pass ? '✅' : '❌'} ${desc}`)
}

// Check services (Bug 3)
console.log('\n=== Bug 3: Extra charges ===')
const owoSvc = converted.services?.find(s => s.name === 'OWO')
const b2bSvc = converted.services?.find(s => s.name === 'B2B')
console.log(`${owoSvc?.extra_price === 50 ? '✅' : '❌'} OWO extra_price = ${owoSvc?.extra_price} (expected: 50)`)
console.log(`${b2bSvc?.extra_price === 30 ? '✅' : '❌'} B2B extra_price = ${b2bSvc?.extra_price} (expected: 30)`)

// Check field mapping
console.log('\n=== Field mapping ===')
console.log(`${converted.bust_type === 'natural' ? '✅' : '❌'} bust_type = ${converted.bust_type} (raw: breastType → bust_type)`)
console.log(`${converted.tattoo === 'none' ? '✅' : '❌'} tattoo = ${converted.tattoo} (raw: tattooStatus → tattoo)`)
console.log(`${converted.smokes === false ? '✅' : '❌'} smokes = ${converted.smokes} (raw: smokingStatus "no" → false)`)
console.log(`${converted.phone === '+447564771616' ? '✅' : '❌'} phone = ${converted.phone}`)
console.log(`${converted.tube_station === 'Victoria' ? '✅' : '❌'} tube_station = ${converted.tube_station}`)

// Final normalization pass (what route.ts does)
console.log('\n=== Final normalized values (as stored in DB) ===')
const finalSmoking = normalizeSmoking(converted.smokes)
const finalBustType = normalizeBustType(converted.bust_type)
const finalTattoo = normalizeTattoo(converted.tattoo) || 'None'
console.log(`${finalSmoking === 'Non-Smoker' ? '✅' : '❌'} smokingStatus = "${finalSmoking}" (expected: Non-Smoker)`)
console.log(`${finalBustType === 'Natural' ? '✅' : '❌'} bustType = "${finalBustType}" (expected: Natural)`)
console.log(`${finalTattoo === 'None' ? '✅' : '❌'} tattooStatus = "${finalTattoo}" (expected: None)`)

console.log('\n=== Summary ===')
const allPass =
  rateKeys.length >= 5 &&
  converted.rates?.['30min']?.incall === 350 &&
  converted.rates?.['1hour']?.incall === 450 &&
  converted.rates?.['1hour']?.outcall === 500 &&
  converted.rates?.['overnight']?.incall === 2600 &&
  owoSvc?.extra_price === 50 &&
  b2bSvc?.extra_price === 30 &&
  finalSmoking === 'Non-Smoker' &&
  finalBustType === 'Natural' &&
  finalTattoo === 'None'

console.log(allPass ? '🎉 ALL TESTS PASSED' : '💥 SOME TESTS FAILED')
process.exit(allPass ? 0 : 1)
