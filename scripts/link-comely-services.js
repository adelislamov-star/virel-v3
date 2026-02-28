const { Client } = require('pg')
require('dotenv').config()

const MODEL_ID = 'cmm6elwwz0001htkv9wryk2i0' // Comely

const COMELY_SERVICES = [
  '69', 'fk', 'dfk', 'gfe', 'owo', 'owc', 'cob', 'dt', 'fingering',
  'party-girl', 'face-sitting', 'dirty-talk', 'rimming-receiving',
  'smoking-fetish', 'foot-fetish', 'light-dom', 'spanking-giving',
  'spanking-soft-receiving', 'duo', 'massage', 'b2b', 'striptease', 'lapdancing'
]

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()

  await client.query(`DELETE FROM model_services WHERE "modelId" = $1`, [MODEL_ID])

  let linked = 0
  for (const slug of COMELY_SERVICES) {
    const res = await client.query(`SELECT id FROM services WHERE slug = $1`, [slug])
    if (res.rows[0]) {
      await client.query(
        `INSERT INTO model_services ("modelId", "serviceId", "isEnabled") VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
        [MODEL_ID, res.rows[0].id]
      )
      linked++
    } else {
      console.log(`⚠️  Not found: ${slug}`)
    }
  }

  console.log(`✅ Linked ${linked} services to Comely`)
  await client.end()
}

main().catch(console.error)
