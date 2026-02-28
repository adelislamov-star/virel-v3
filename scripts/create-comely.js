const https = require('https')

const data = JSON.stringify({
  name: "Comely",
  age: 18,
  height: 157,
  weight: 53,
  dressSizeUK: "6",
  feetSizeUK: "5",
  breastSize: "32B",
  breastType: "natural",
  eyesColour: "Dark Brown",
  hairColour: "Dark Brown",
  smokingStatus: "no",
  tattooStatus: "large",
  piercingTypes: "Belly piercing",
  nationality: "Italian",
  languages: ["Portuguese", "English", "Italian"],
  orientation: "hetero",
  workWithCouples: true,
  workWithWomen: true,
  rate30min: 300,
  rate45min: 350,
  rate1hIn: 400,
  rate1hOut: 450,
  rate90minIn: 600,
  rate90minOut: 650,
  rate2hIn: 700,
  rate2hOut: 800,
  rateExtraHour: 350,
  rateOvernight: 3500,
  blackClients: true,
  disabledClients: true,
  addressStreet: "16 Ruthland Gate",
  addressFlat: "Flat 8, 4th floor",
  addressPostcode: "SW7 1BB",
  tubeStation: "Knightsbridge",
  services: ["69","fk","dfk","gfe","owo","owc","cob","dt","fingering","party-girl","face-sitting","dirty-talk","rimming-receiving","smoking-fetish","foot-fetish","light-domination","spanking-giving","soft-spanking-receiving","duo","massage","body-to-body-massage","striptease","lapdancing"],
  notesInternal: "Uniforms: school girl and police. OWO +£50 extra."
})

const options = {
  hostname: 'virel-v3.vercel.app',
  path: '/api/admin/models',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}

const req = https.request(options, res => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    const result = JSON.parse(body)
    if (result.success) {
      console.log(`✅ Created: Comely`)
      console.log(`   ID: ${result.modelId}`)
      console.log(`   Slug: ${result.slug}`)
      console.log(`   URL: https://virel-v3.vercel.app/catalog/${result.slug}`)
    } else {
      console.log(`❌ Error:`, result.error)
    }
  })
})

req.on('error', e => console.error('Request error:', e.message))
req.write(data)
req.end()
