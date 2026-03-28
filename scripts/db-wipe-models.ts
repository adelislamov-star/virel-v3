/**
 * db-wipe-models.ts — удаляет все модели и связанные данные
 * Run: npm run db-wipe
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.drive' })
dotenv.config({ path: '.env.production' })

process.env.DATABASE_URL = process.env.DATABASE_DIRECT_URL || process.env.DIRECT_URL || process.env.DATABASE_URL!

import { prisma } from '../src/lib/db/client'

async function main() {
  const count = await prisma.model.count()
  console.log(`Моделей в БД: ${count}`)

  if (count === 0) {
    console.log('БД уже пуста.')
    await prisma.$disconnect()
    return
  }

  await prisma.modelStats.deleteMany({})
  console.log('✓ model_stats')

  await prisma.$executeRawUnsafe(`DELETE FROM model_rates`)
  console.log('✓ model_rates')

  await prisma.$executeRawUnsafe(`DELETE FROM model_services`)
  console.log('✓ model_services')

  await prisma.$executeRawUnsafe(`DELETE FROM model_addresses`)
  console.log('✓ model_addresses')

  await prisma.$executeRawUnsafe(`DELETE FROM model_work_preferences`)
  console.log('✓ model_work_preferences')

  await prisma.$executeRawUnsafe(`DELETE FROM model_media`)
  console.log('✓ model_media')

  try { await prisma.availabilitySlot.deleteMany({}) } catch {}
  try { await prisma.bookingRequest.deleteMany({}) } catch {}
  try { await prisma.review.deleteMany({}) } catch {}

  const models = await prisma.model.deleteMany({})
  console.log(`✓ models удалено: ${models.count}`)

  console.log('\n✅ Готово.')
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error('Fatal:', e)
  await prisma.$disconnect()
  process.exit(1)
})
