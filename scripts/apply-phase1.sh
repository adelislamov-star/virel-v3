#!/bin/bash
# Phase 1 — Apply migration and post-migration tasks
# Run from C:\Virel root

set -e

echo "=== Step 1: Apply Prisma migration ==="
npx prisma migrate dev --name backoffice-spec-phase1

echo ""
echo "=== Step 2: Generate Prisma client ==="
npx prisma generate

echo ""
echo "=== Step 3: Migrate model statuses (active->published, etc.) ==="
npx tsx scripts/migrate-model-statuses.ts

echo ""
echo "=== Step 4: Build check ==="
npm run build

echo ""
echo "=== Done! ==="
