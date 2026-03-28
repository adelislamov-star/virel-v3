-- Migration: rates_refactor
-- Remove CallRateMaster dependency, make model_rates the single source of truth.

-- Step 1: Add new columns (nullable for compatibility)
ALTER TABLE "model_rates"
  ADD COLUMN IF NOT EXISTS "duration_type" TEXT,
  ADD COLUMN IF NOT EXISTS "call_type" TEXT,
  ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "taxi_fee" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Step 2: Migrate existing data via JOIN with call_rate_masters (if any rows exist)
-- Incall rows
INSERT INTO "model_rates" ("id", "modelId", "duration_type", "call_type", "price", "currency", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  mr."modelId",
  CASE crm."durationMin"
    WHEN 30  THEN '30min'
    WHEN 45  THEN '45min'
    WHEN 60  THEN '1hour'
    WHEN 90  THEN '90min'
    WHEN 120 THEN '2hours'
    WHEN 180 THEN '3hours'
    WHEN 240 THEN '4hours'
    WHEN 300 THEN '5hours'
    WHEN 360 THEN '6hours'
    WHEN 480 THEN '8hours'
    WHEN 540 THEN 'overnight'
    ELSE crm."label"
  END,
  'incall',
  mr."incallPrice",
  'GBP',
  NOW(),
  NOW()
FROM "model_rates" mr
JOIN "call_rate_masters" crm ON mr."callRateMasterId" = crm.id
WHERE mr."incallPrice" IS NOT NULL
  AND mr."duration_type" IS NULL;

-- Outcall rows
INSERT INTO "model_rates" ("id", "modelId", "duration_type", "call_type", "price", "currency", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  mr."modelId",
  CASE crm."durationMin"
    WHEN 30  THEN '30min'
    WHEN 45  THEN '45min'
    WHEN 60  THEN '1hour'
    WHEN 90  THEN '90min'
    WHEN 120 THEN '2hours'
    WHEN 180 THEN '3hours'
    WHEN 240 THEN '4hours'
    WHEN 300 THEN '5hours'
    WHEN 360 THEN '6hours'
    WHEN 480 THEN '8hours'
    WHEN 540 THEN 'overnight'
    ELSE crm."label"
  END,
  'outcall',
  mr."outcallPrice",
  'GBP',
  NOW(),
  NOW()
FROM "model_rates" mr
JOIN "call_rate_masters" crm ON mr."callRateMasterId" = crm.id
WHERE mr."outcallPrice" IS NOT NULL
  AND mr."duration_type" IS NULL;

-- Step 2b: Fallback — if call_rate_masters was EMPTY, migrate by price heuristic
-- (rows with callRateMasterId but no JOIN match remain with duration_type IS NULL)
-- Incall fallback
INSERT INTO "model_rates" ("id", "modelId", "duration_type", "call_type", "price", "currency", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  mr."modelId",
  CASE
    WHEN mr."incallPrice" <= 260 THEN '30min'
    WHEN mr."incallPrice" <= 290 THEN '45min'
    WHEN mr."incallPrice" <= 320 THEN '1hour'
    WHEN mr."incallPrice" <= 460 THEN '90min'
    WHEN mr."incallPrice" <= 570 THEN '2hours'
    WHEN mr."incallPrice" >= 1600 THEN 'overnight'
    ELSE '1hour'
  END,
  'incall',
  mr."incallPrice",
  'GBP',
  NOW(),
  NOW()
FROM "model_rates" mr
WHERE mr."incallPrice" IS NOT NULL
  AND mr."duration_type" IS NULL
  AND mr."callRateMasterId" IS NOT NULL
ON CONFLICT ("modelId", "duration_type", "call_type") DO NOTHING;

-- Outcall fallback
INSERT INTO "model_rates" ("id", "modelId", "duration_type", "call_type", "price", "currency", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  mr."modelId",
  CASE
    WHEN mr."outcallPrice" <= 260 THEN '30min'
    WHEN mr."outcallPrice" <= 290 THEN '45min'
    WHEN mr."outcallPrice" <= 360 THEN '1hour'
    WHEN mr."outcallPrice" <= 510 THEN '90min'
    WHEN mr."outcallPrice" <= 620 THEN '2hours'
    WHEN mr."outcallPrice" >= 1600 THEN 'overnight'
    ELSE '1hour'
  END,
  'outcall',
  mr."outcallPrice",
  'GBP',
  NOW(),
  NOW()
FROM "model_rates" mr
WHERE mr."outcallPrice" IS NOT NULL
  AND mr."duration_type" IS NULL
  AND mr."callRateMasterId" IS NOT NULL
ON CONFLICT ("modelId", "duration_type", "call_type") DO NOTHING;

-- Step 3: Delete old-format rows (duration_type IS NULL means legacy format)
DELETE FROM "model_rates" WHERE "duration_type" IS NULL;

-- Step 4: Make new columns NOT NULL
ALTER TABLE "model_rates"
  ALTER COLUMN "duration_type" SET NOT NULL,
  ALTER COLUMN "call_type" SET NOT NULL,
  ALTER COLUMN "price" SET NOT NULL;

-- Step 5: Drop old columns
ALTER TABLE "model_rates"
  DROP COLUMN IF EXISTS "callRateMasterId",
  DROP COLUMN IF EXISTS "incallPrice",
  DROP COLUMN IF EXISTS "outcallPrice";

-- Step 6: Add unique constraint for new schema
ALTER TABLE "model_rates"
  DROP CONSTRAINT IF EXISTS "model_rates_modelId_callRateMasterId_key";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'model_rates_modelId_duration_type_call_type_key'
  ) THEN
    ALTER TABLE "model_rates"
      ADD CONSTRAINT "model_rates_modelId_duration_type_call_type_key"
      UNIQUE ("modelId", "duration_type", "call_type");
  END IF;
END $$;

-- Step 7: Add index on modelId if not exists
CREATE INDEX IF NOT EXISTS "model_rates_modelId_idx" ON "model_rates" ("modelId");

-- Step 8: Drop call_rate_masters table
DROP TABLE IF EXISTS "call_rate_masters";
