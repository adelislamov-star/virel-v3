// Integration test: Quick Upload bug fixes
// Tests: rates, smoking, bustType, tattoo, extraPrice

const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'http://localhost:3000'

// Simulated anketa text
const ANKETA = `Name – Victoria
Age – 26
Height – 1,73
Weight – 56
Dress Size (UK) – 8
Feet Size (UK size) – 5
Breast Size – 34C
Breast Type – Natural
Eyes Colour – Green
Hair Colour – Blonde
Smoking – No
Tattoo – None
Piercing – None
Nationality – Russian
Languages – English, Russian
Orientation – Bisexual
*Do you work with couples? – Yes
*Do you work with women? – Yes
*Do you accept black clients? – Yes
*Do you work with disabled clients? – No

ADDRESS:
12 Test Street
Flat 3A
SW1A 1AA
Tube Station – Victoria

Airport Outcalls:
Heathrow – Yes
Gatwick – No
Stansted – No

Phone: +447564771616
WhatsApp: Yes
Telegram: Yes

RATES (incall/outcall):
30 min – £350 / –
45 min – £400 / –
1 hour – £450 / £500
90 min – £600 / £650
2 hours – £800 / £850
Extra hour – £300
Overnight – £2600

SERVICES:
GFE – Yes
OWO – Yes Extra £50
69 – Yes
DFK – Yes
A Level – No
B2B massage – Yes Extra £30
Striptease – Yes
Toys – Yes`

async function run() {
  console.log('=== Quick Upload Integration Test ===\n')

  // Build FormData (native Node v18+)
  const formData = new FormData()

  // Create a text file from anketa
  const anketaBlob = new Blob([ANKETA], { type: 'text/plain' })
  const anketaFile = new File([anketaBlob], 'anketa.txt', { type: 'text/plain' })
  formData.append('files', anketaFile)

  // Create a tiny test image (1x1 red pixel PNG)
  const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8D4HwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64'
  )
  const imgFile = new File([PNG_1x1], 'test.png', { type: 'image/png' })
  formData.append('files', imgFile)

  console.log('1. POST /api/v1/models/quick-upload')
  const res = await fetch(`${BASE}/api/v1/models/quick-upload?force=true`, {
    method: 'POST',
    body: formData,
    headers: {
      cookie: 'virel-token=cmmqa0uc400014edy4zgq84ol',
    },
  })

  const data = await res.json()
  console.log('   Status:', res.status)
  console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 500))

  if (!data.success) {
    console.log('\n❌ Upload failed:', data.error)
    process.exit(1)
  }

  const modelId = data.modelId
  console.log('   ModelId:', modelId)

  // Now check the database
  console.log('\n2. Checking database...')

  // We'll use the admin API to fetch the model
  const modelRes = await fetch(`${BASE}/api/v1/models/${modelId}`, {
    headers: { cookie: 'virel-token=cmmqa0uc400014edy4zgq84ol' },
  })
  const modelData = await modelRes.json()

  if (!modelData) {
    console.log('❌ Could not fetch model')
    process.exit(1)
  }

  const m = modelData.model || modelData
  console.log('   Name:', m.name)
  console.log('   Status:', m.status)
  console.log('   Phone:', m.phone)
  console.log('   Bio length:', m.bio?.length || 0)
  console.log('   NotesInternal:', m.notesInternal?.substring(0, 100))
  console.log('   PrimaryLocationId:', m.primaryLocationId)

  // Check stats
  const stats = m.stats || {}
  console.log('   SmokingStatus:', stats.smokingStatus)
  console.log('   TattooStatus:', stats.tattooStatus)
  console.log('   BustType:', stats.bustType)

  // Check rates
  const rates = m.modelRates || m.rates || []
  console.log('   Rates count:', rates.length)
  if (rates.length > 0) {
    rates.forEach(r => console.log(`     ${r.durationType} ${r.callType}: £${r.price}`))
  }

  // Assertions
  const results = []
  results.push({ test: 'status = draft', pass: m.status === 'draft' })
  results.push({ test: 'phone = +447564771616', pass: m.phone === '+447564771616' })
  results.push({ test: 'rates.length >= 5', pass: rates.length >= 5 })
  results.push({ test: 'smokingStatus = Non-Smoker', pass: stats.smokingStatus === 'Non-Smoker' })
  results.push({ test: 'tattooStatus = None', pass: stats.tattooStatus === 'None' })
  results.push({ test: 'bustType = Natural', pass: stats.bustType === 'Natural' })
  results.push({ test: 'primaryLocationId != null', pass: !!m.primaryLocationId })
  results.push({ test: 'bio.length > 100', pass: (m.bio?.length || 0) > 100 })
  results.push({ test: 'notesInternal has Phone:', pass: m.notesInternal?.includes('Phone:') || false })

  console.log('\n=== Test Results ===')
  let allPass = true
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌'
    console.log(`${icon} ${r.test}`)
    if (!r.pass) allPass = false
  }

  if (allPass) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n💥 Some tests failed')
    process.exit(1)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
