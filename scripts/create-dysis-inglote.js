const https = require('https')

function post(data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data)
    const options = {
      hostname: 'virel-v3.vercel.app',
      path: '/api/admin/models',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }
    const req = https.request(options, res => {
      let b = ''
      res.on('data', c => b += c)
      res.on('end', () => {
        try { resolve(JSON.parse(b)) } catch { resolve({ success: false, error: b }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

const models = [
  {
    name: 'Dysis',
    age: 24, height: 170, weight: 57,
    dressSizeUK: '8', feetSizeUK: '7',
    breastSize: '34B', breastType: 'natural',
    eyesColour: 'Green', hairColour: 'Brunette',
    smokingStatus: 'no', tattooStatus: 'small',
    piercingTypes: null, nationality: 'Brazilian/German',
    languages: ['Portuguese', 'English', 'Spanish'],
    orientation: 'bi', workWithCouples: true, workWithWomen: true,
    rate30min: 400, rate45min: 500,
    rate1hIn: 600, rate1hOut: 600,
    rate90minIn: 800, rate90minOut: 800,
    rate2hIn: 1000, rate2hOut: 1000,
    rateExtraHour: 400, rateOvernight: 3600,
    blackClients: true, disabledClients: true,
    addressStreet: "3 Short's Gardens", addressPostcode: 'WC2H 9AT',
    tubeStation: 'Tottenham Court Road',
    notesInternal: 'OWO +£50, CIF +£60, CIM +£70, WS giving +£80, Rimming giving +£80, Bi DUO +£100, Couples +£150',
    services: ['69','fk','dfk','gfe','owo','owc','cob','cif','cim','fingering','party-girl','face-sitting','dirty-talk','lady-services','ws-giving','rimming-giving','rimming-receiving','foot-fetish','open-minded','light-dom','spanking-giving','spanking-soft-receiving','duo','bi-duo','couples','mmf','massage','b2b','erotic-massage','sensual','handcuffs','domination','tie-and-tease']
  },
  {
    name: 'Inglote',
    age: 23, height: 165, weight: 65,
    dressSizeUK: '6', feetSizeUK: '4',
    breastSize: '34C', breastType: 'silicone',
    eyesColour: 'Dark Brown', hairColour: 'Black',
    smokingStatus: 'no', tattooStatus: 'small',
    piercingTypes: null, nationality: 'Brazilian',
    languages: ['Portuguese', 'English'],
    orientation: 'hetero', workWithCouples: true, workWithWomen: false,
    rate30min: 250, rate45min: 280,
    rate1hIn: 300, rate1hOut: 350,
    rate90minIn: 450, rate90minOut: 500,
    rate2hIn: 550, rate2hOut: 600,
    rateExtraHour: 250, rateOvernight: 2300,
    blackClients: true, disabledClients: true,
    addressStreet: 'Cumberland Mansions, Seymour Place', addressFlat: 'Flat 30, Ground floor',
    addressPostcode: 'W1H 5TF', tubeStation: 'Marble Arch',
    notesInternal: 'OWO +£40, CIF +£50, CIM +£60, Swallow +£60, WS giving +£50, WS receiving +£60, Rimming giving +£60. Roleplay: yes.',
    services: ['69','fk','dfk','gfe','owo','owc','cob','cif','cim','swallow','dt','fingering','party-girl','face-sitting','ws-giving','ws-receiving','rimming-giving','rimming-receiving','foot-fetish','light-dom','spanking-giving','duo','massage','b2b','sensual','striptease','lapdancing','belly-dance','poppers','domination','tie-and-tease']
  }
]

async function main() {
  for (const model of models) {
    try {
      const result = await post(model)
      if (result.success) {
        console.log(`✅ ${model.name} — ID: ${result.modelId} | /catalog/${result.slug}`)
      } else {
        console.log(`❌ ${model.name} — ${result.error}`)
      }
    } catch (e) {
      console.log(`❌ ${model.name} — ${e.message}`)
    }
  }
}

main()
