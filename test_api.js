const fs = require('fs')
const https = require('http')

const payload = JSON.stringify({
  action: 'parse_anketa',
  text: `NAME: ISMAT
Age - 21
Height (cm) - 172
Weight (kg) - 67
Dress (UK size) - 8
Breast size (natural / silicone) - natural 34C
Nationality - Brazilian
RATES:
30 min 250
1h in call 300
Overnight 1800
Black clients - no
Tube Station - bond street`
})

const req = https.request({
  hostname: 'localhost', port: 3001, path: '/api/admin/quick-upload',
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, res => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => fs.writeFileSync('C:/Virel/test_result.json', data))
})
req.on('error', e => fs.writeFileSync('C:/Virel/test_result.json', 'ERR: ' + e.message))
req.write(payload)
req.end()
