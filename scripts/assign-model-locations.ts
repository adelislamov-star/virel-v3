// Assign primary districts to active companions
// Run: npx tsx scripts/assign-model-locations.ts

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ASSIGNMENTS = [
  { modelSlug: 'giorgina-vegas', districtSlug: 'marble-arch',   isPrimary: true },
  { modelSlug: 'marsalina',     districtSlug: 'earls-court',    isPrimary: true },
  { modelSlug: 'marzena',       districtSlug: 'knightsbridge',  isPrimary: true },
  { modelSlug: 'angelina',      districtSlug: 'kensington',     isPrimary: true },
  { modelSlug: 'comely',        districtSlug: 'mayfair',        isPrimary: true },
  { modelSlug: 'veruca',        districtSlug: 'chelsea',        isPrimary: true },
  { modelSlug: 'burana',        districtSlug: 'belgravia',      isPrimary: true },
  { modelSlug: 'watari',        districtSlug: 'marylebone',     isPrimary: true },
  { modelSlug: 'vicky',         districtSlug: 'notting-hill',   isPrimary: true },
]

async function main() {
  console.log('Assigning model locations...\n')

  for (const { modelSlug, districtSlug, isPrimary } of ASSIGNMENTS) {
    const model = await prisma.model.findUnique({ where: { slug: modelSlug }, select: { id: true, name: true } })
    if (!model) {
      console.log(`  SKIP  ${modelSlug} — model not found`)
      continue
    }

    const district = await prisma.district.findUnique({ where: { slug: districtSlug }, select: { id: true, name: true } })
    if (!district) {
      console.log(`  SKIP  ${modelSlug} → ${districtSlug} — district not found`)
      continue
    }

    const existing = await prisma.modelLocation.findUnique({
      where: { modelId_districtId: { modelId: model.id, districtId: district.id } },
    })

    if (existing) {
      if (existing.isPrimary !== isPrimary) {
        await prisma.modelLocation.update({
          where: { id: existing.id },
          data: { isPrimary },
        })
        console.log(`  UPDATE  ${model.name} → ${district.name} (isPrimary: ${isPrimary})`)
      } else {
        console.log(`  EXISTS  ${model.name} → ${district.name}`)
      }
      continue
    }

    await prisma.modelLocation.create({
      data: {
        modelId: model.id,
        districtId: district.id,
        isPrimary,
      },
    })
    console.log(`  CREATE  ${model.name} → ${district.name} (isPrimary: ${isPrimary})`)
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
