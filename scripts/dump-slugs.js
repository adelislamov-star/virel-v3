const { Client } = require('pg')
require('dotenv').config()

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  const res = await client.query('SELECT slug FROM services ORDER BY slug')
  console.log(res.rows.map(r => r.slug).join('\n'))
  await client.end()
}
main().catch(console.error)
