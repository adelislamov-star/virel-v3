const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

async function main() {
  const p = new PrismaClient()
  const results = []

  try {
    const sql = fs.readFileSync('C:/Virel/prisma/migrations/manual_model_profile_extensions.sql', 'utf8')
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 5 && !s.startsWith('--'))

    for (const stmt of statements) {
      try {
        await p.$executeRawUnsafe(stmt)
        results.push('OK: ' + stmt.substring(0, 80))
      } catch (e) {
        results.push('SKIP: ' + e.message.substring(0, 100))
      }
    }

    // Verify tables
    const tables = ['model_rates', 'model_addresses', 'model_work_preferences']
    for (const t of tables) {
      try {
        const r = await p.$queryRawUnsafe('SELECT COUNT(*) as c FROM ' + t)
        results.push('TABLE OK: ' + t + ' rows=' + r[0].c)
      } catch (e) {
        results.push('TABLE MISSING: ' + t + ' - ' + e.message)
      }
    }

    fs.writeFileSync('C:/Virel/migration_done.txt', results.join('\n'))
  } finally {
    await p.$disconnect()
  }
}

main()
