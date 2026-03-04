// MIGRATION SCRIPT: Convert old model statuses to new ones
// Old: active/inactive/suspended + visibility (public/private/unlisted)
// New: draft, review, published, hidden, archived
//
// Mapping:
//   active + public     → published
//   active + private    → hidden
//   active + unlisted   → hidden
//   inactive            → hidden
//   suspended           → archived
//
// Run: npx tsx scripts/migrate-model-statuses.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting model status migration...\n');

  const models = await prisma.model.findMany({
    select: { id: true, name: true, status: true, visibility: true }
  });

  console.log(`Found ${models.length} models to process.\n`);

  let updated = 0;
  let skipped = 0;

  for (const model of models) {
    const oldStatus = model.status;
    let newStatus: string;

    // Skip if already using new statuses
    if (['draft', 'review', 'published', 'hidden', 'archived'].includes(oldStatus)) {
      console.log(`  SKIP: ${model.name} — already has new status "${oldStatus}"`);
      skipped++;
      continue;
    }

    if (oldStatus === 'active' && model.visibility === 'public') {
      newStatus = 'published';
    } else if (oldStatus === 'active' && (model.visibility === 'private' || model.visibility === 'unlisted')) {
      newStatus = 'hidden';
    } else if (oldStatus === 'inactive') {
      newStatus = 'hidden';
    } else if (oldStatus === 'suspended') {
      newStatus = 'archived';
    } else {
      console.log(`  WARN: ${model.name} — unknown status "${oldStatus}", skipping`);
      skipped++;
      continue;
    }

    await prisma.model.update({
      where: { id: model.id },
      data: { status: newStatus }
    });

    console.log(`  OK: ${model.name} — ${oldStatus}/${model.visibility} → ${newStatus}`);
    updated++;
  }

  console.log(`\nMigration complete: ${updated} updated, ${skipped} skipped.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
