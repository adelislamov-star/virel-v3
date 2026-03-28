const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const p = new PrismaClient()

async function main() {
  const results = []

  // 1. Apply migration SQL
  const sql = fs.readFileSync('C:/Virel/prisma/migrations/manual_model_profile_extensions.sql', 'utf8')
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 2 && !s.startsWith('--'))
  
  for (const stmt of statements) {
    try {
      await p.$executeRawUnsafe(stmt)
      results.push('OK: ' + stmt.substring(0, 60))
    } catch(e) {
      results.push('SKIP: ' + e.message.substring(0, 80))
    }
  }

  // 2. Check what services exist in DB
  const services = await p.service.findMany({ select: { slug: true, title: true } })
  results.push('\n=== SERVICES IN DB (' + services.length + ') ===')
  services.forEach(s => results.push(s.slug + ' | ' + s.title))

  // 3. Check model_rates table exists
  try {
    const rateCheck = await p.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM model_rates")
    results.push('\n=== model_rates table: EXISTS, rows: ' + JSON.stringify(rateCheck))
  } catch(e) {
    results.push('\n=== model_rates: ' + e.message)
  }

  // 4. Check model_addresses table
  try {
    await p.$queryRawUnsafe("SELECT COUNT(*) FROM model_addresses")
    results.push('model_addresses: EXISTS')
  } catch(e) {
    results.push('model_addresses: ' + e.message)
  }

  fs.writeFileSync('C:/Virel/fix_db_result.txt', results.join('\n'))
  await p.$disconnect()
}

main().catch(e => {
  fs.writeFileSync('C:/Virel/fix_db_result.txt', 'FATAL: ' + e.message)
  p.$disconnect()
})
