const { Client } = require('pg')
require('dotenv').config()

async function main() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  // Все слаги в БД
  const svcs = await client.query('SELECT id, slug, title FROM services ORDER BY slug')
  console.log('All services in DB:')
  svcs.rows.forEach(r => console.log(`  ${r.slug} → "${r.title}" (${r.id})`))

  await client.end()
}

main().catch(console.error)
