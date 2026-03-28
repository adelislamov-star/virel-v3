const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const before = await prisma.model.count()
  console.log('Models before:', before)
  if (before === 0) { console.log('Nothing to delete!'); return }

  // All FK-dependent tables that reference "models"
  const deps = [
    'model_stats', 'model_media', 'model_categories', 'model_attributes',
    'model_rates', 'model_services', 'model_locations', 'model_addresses',
    'model_work_preferences', 'model_availabilities', 'model_similarities',
    'availability_conflicts', 'availability_slots', 'availability_mismatches',
    'inquiry_matches', 'booking_services', 'booking_timeline', 'bookings',
    'reviews', 'fraud_signals', 'incidents', 'alternative_offers',
    'review_complaint_patterns', 'payments', 'ai_parse_examples',
  ]

  for (const t of deps) {
    try {
      const r = await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`)
      console.log(`  ${t}: ${r} deleted`)
    } catch (e) {
      console.log(`  ${t}: skip`)
    }
  }

  console.log('Deleting models...')
  const r = await prisma.$executeRawUnsafe('DELETE FROM "models"')
  console.log('Deleted from models:', r)

  const after = await prisma.model.count()
  console.log('Models after:', after)
  console.log('DONE!')
}

main()
  .catch(e => { console.error('FATAL:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
