const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Counting models...')
  const count = await prisma.model.count()
  console.log('Models before:', count)

  if (count === 0) {
    console.log('Nothing to delete!')
    return
  }

  // Delete all FK-dependent tables first via raw SQL
  const tables = [
    'model_stats',
    'model_media',
    'model_services',
    'model_rates',
    'model_addresses',
    'model_work_preferences',
    'model_categories',
    'model_attributes',
    'availabilities',
    'similarities',
    'ai_parse_examples',
    'audit_logs',
  ]

  for (const t of tables) {
    try {
      const r = await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`)
      console.log(`Deleted from ${t}:`, r)
    } catch (e) {
      console.log(`${t}: skip (${e.message.slice(0, 60)})`)
    }
  }

  // Now delete models
  console.log('Deleting models...')
  const deleted = await prisma.$executeRawUnsafe('DELETE FROM "models"')
  console.log('Deleted models:', deleted)

  const after = await prisma.model.count()
  console.log('Models after:', after)
  console.log('Done!')
}

main()
  .catch(e => { console.error('FATAL:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
