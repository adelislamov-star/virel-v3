# Phase 1 — Apply migration and post-migration tasks
# Run from C:\Virel root

Write-Host "=== Step 1: Apply Prisma migration ===" -ForegroundColor Cyan
npx prisma migrate dev --name backoffice-spec-phase1

Write-Host "`n=== Step 2: Generate Prisma client ===" -ForegroundColor Cyan
npx prisma generate

Write-Host "`n=== Step 3: Migrate model statuses (active->published, etc.) ===" -ForegroundColor Cyan
npx tsx scripts/migrate-model-statuses.ts

Write-Host "`n=== Step 4: Build check ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== Done! ===" -ForegroundColor Green
