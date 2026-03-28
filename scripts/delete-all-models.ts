import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all models and related data...')

  // Delete dependent records first
  const stats = await prisma.modelStats.deleteMany({})
  console.log('Deleted modelStats:', stats.count)

  const media = await prisma.modelMedia.deleteMany({})
  console.log('Deleted modelMedia:', media.count)

  const services = await prisma.modelService.deleteMany({})
  console.log('Deleted modelService:', services.count)

  const rates = await prisma.modelRate.deleteMany({})
  console.log('Deleted modelRate:', rates.count)

  const models = await prisma.model.deleteMany({})
  console.log('Deleted models:', models.count)

  console.log('Done!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
