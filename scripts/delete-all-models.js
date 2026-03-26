const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all models and related data...')

  try { const r = await prisma.modelStats.deleteMany({}); console.log('Deleted modelStats:', r.count) } catch(e) { console.log('modelStats skip:', e.message) }
  try { const r = await prisma.modelMedia.deleteMany({}); console.log('Deleted modelMedia:', r.count) } catch(e) { console.log('modelMedia skip:', e.message) }
  try { const r = await prisma.modelService.deleteMany({}); console.log('Deleted modelService:', r.count) } catch(e) { console.log('modelService skip:', e.message) }
  try { const r = await prisma.modelRate.deleteMany({}); console.log('Deleted modelRate:', r.count) } catch(e) { console.log('modelRate skip:', e.message) }

  // Raw SQL to handle any FK constraints
  try {
    await prisma.$executeRawUnsafe('DELETE FROM model_addresses')
    console.log('Deleted model_addresses')
  } catch(e) { console.log('model_addresses skip:', e.message) }

  try {
    await prisma.$executeRawUnsafe('DELETE FROM model_work_preferences')
    console.log('Deleted model_work_preferences')
  } catch(e) { console.log('model_work_preferences skip:', e.message) }

  const r = await prisma.model.deleteMany({})
  console.log('Deleted models:', r.count)
  console.log('Done!')
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
