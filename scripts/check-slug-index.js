const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const rows = await p.$queryRawUnsafe(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'models' AND indexdef LIKE '%slug%'"
  )
  console.log(JSON.stringify(rows, null, 2))
}
main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect() })
