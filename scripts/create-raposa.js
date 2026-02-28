const https = require('https')

const data = JSON.stringify({
  name: "Raposa",
  age: 26,
  height: 154,
  weight: 54,
  dressSizeUK: "8",
  feetSizeUK: "6",
  breastSize: "32B",
  breastType: "natural",
  eyesColour: "Brown",
  hairColour: "Redhead",
  smokingStatus: "no",
  tattooStatus: "small",
  piercingTypes: "Nose",
  nationality: "Brazilian",
  languages: ["Portuguese", "English"],
  orientation: "bi",
  workWithCouples: true,
  workWithWomen: false,
  rate30min: 250,
  rate45min: 280,
  rate1hIn: 300,
  rate1hOut: 350,
  rate90minIn: 450,
  rate90minOut: 500,
  rate2hIn: 550,
  rate2hOut: 600,
  rateExtraHour: 250,
  rateOvernight: 2300,
  blackClients: true,
  disabledClients: true,
  addressFlat: "Flat 23",
  addressPostcode: "HA9 8QY",
  tubeStation: "South Kenton",
  services: [
    "69", "fk", "gfe", "owo", "owc", "cob", "a-level", "dp",
    "party-girl", "lady-services", "roleplay", "filming-mask",
    "foot-fetish", "open-minded", "light-dom", "duo", "bi-duo",
    "couples", "mmf", "massage", "sensual", "striptease"
  ],
  notesInternal: "OWO +£40. A-Level +£100. Filming with mask +£100. Bi DUO +£100. Couples +£150. Overnight 9h."
})

const options = {
  hostname: 'virel-v3.vercel.app',
  path: '/api/admin/models',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}

const req = https.request(options, res => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    const result = JSON.parse(body)
    if (result.success) {
      console.log(`✅ Created: Raposa`)
      console.log(`   ID: ${result.modelId}`)
      console.log(`   URL: https://virel-v3.vercel.app/catalog/${result.slug}`)
    } else {
      console.log(`❌ Error:`, result.error)
    }
  })
})

req.on('error', e => console.error('Request error:', e.message))
req.write(data)
req.end()
