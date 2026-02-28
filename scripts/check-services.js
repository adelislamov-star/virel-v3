const { Client } = require('pg')
require('dotenv').config()

async function main() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  // Проверяем model_services для Comely
  const ms = await client.query(`
    SELECT ms.*, s.title, s.slug 
    FROM model_services ms 
    LEFT JOIN services s ON s.id = ms."serviceId"
    WHERE ms."modelId" = 'cmm6elwwz0001htkv9wryk2i0'
  `)
  console.log('Model services count:', ms.rowCount)
  if (ms.rowCount > 0) {
    console.log('Services:', ms.rows.map(r => r.slug).join(', '))
  } else {
    console.log('No services linked — checking slugs in services table...')
    const slugs = await client.query(`SELECT slug FROM services ORDER BY slug LIMIT 20`)
    console.log('Available slugs:', slugs.rows.map(r => r.slug).join(', '))
  }

  await client.end()
}

main().catch(console.error)
