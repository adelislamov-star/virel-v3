const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  await p.$executeRawUnsafe('DROP INDEX IF EXISTS models_slug_idx')
  console.log('Dropped models_slug_idx')
  const rows = await p.$queryRawUnsafe(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'models' AND indexdef LIKE '%slug%'"
  )
  console.log('Remaining:', JSON.stringify(rows, null, 2))
}
main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect() })
