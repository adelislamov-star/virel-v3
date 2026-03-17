import { prisma } from './client'

let tablesChecked = false

/**
 * Ensure extension tables exist (model_rates, model_addresses, model_work_preferences).
 * These are outside the main Prisma schema and may not have been created.
 * Safe to call repeatedly — uses IF NOT EXISTS and caches the check.
 */
export async function ensureExtensionTables(): Promise<void> {
  if (tablesChecked) return

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS model_rates (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "modelId" TEXT NOT NULL,
        "callRateMasterId" TEXT NOT NULL,
        "incallPrice" DOUBLE PRECISION,
        "outcallPrice" DOUBLE PRECISION,
        UNIQUE("modelId", "callRateMasterId")
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS model_addresses (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        street TEXT,
        flat_number TEXT,
        flat_floor INTEGER,
        post_code TEXT,
        tube_station TEXT,
        heathrow_available BOOLEAN NOT NULL DEFAULT false,
        gatwick_available BOOLEAN NOT NULL DEFAULT false,
        stansted_available BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(model_id)
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS model_work_preferences (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        work_with_couples BOOLEAN NOT NULL DEFAULT false,
        work_with_women BOOLEAN NOT NULL DEFAULT false,
        black_clients_welcome BOOLEAN NOT NULL DEFAULT true,
        disabled_clients_welcome BOOLEAN NOT NULL DEFAULT true,
        UNIQUE(model_id)
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS quick_upload_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        model_id TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
        ai_parsed_fields JSONB,
        operator_edits JSONB,
        final_fields JSONB,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_quick_upload_logs_model ON quick_upload_logs(model_id)
    `).catch(() => {})
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_quick_upload_logs_created ON quick_upload_logs(created_at)
    `).catch(() => {})

    // Ensure extraPrice column exists on model_services
    await prisma.$executeRawUnsafe(`
      ALTER TABLE model_services ADD COLUMN IF NOT EXISTS "extraPrice" DOUBLE PRECISION
    `).catch(() => {})

    // Ensure category, description, defaultExtraPrice columns exist on services
    await prisma.$executeRawUnsafe(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Other'
    `).catch(() => {})
    await prisma.$executeRawUnsafe(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS "description" TEXT
    `).catch(() => {})
    await prisma.$executeRawUnsafe(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS "defaultExtraPrice" DOUBLE PRECISION
    `).catch(() => {})

    // One-time cleanup: merge overnight_9h → overnight (both map to same label "Overnight")
    // Step 1: Rename overnight_9h → overnight where model has NO existing overnight rate
    await prisma.$executeRawUnsafe(`
      UPDATE model_rates SET duration_type = 'overnight'
      WHERE duration_type = 'overnight_9h'
        AND NOT EXISTS (
          SELECT 1 FROM model_rates AS o
          WHERE o.model_id = model_rates.model_id
            AND o.call_type = model_rates.call_type
            AND o.duration_type = 'overnight'
            AND COALESCE(o.location_id, '') = COALESCE(model_rates.location_id, '')
        )
    `).catch(() => {})
    // Step 2: For models that have BOTH, keep the higher price under overnight
    await prisma.$executeRawUnsafe(`
      UPDATE model_rates AS keep
      SET price = GREATEST(keep.price, dup.price)
      FROM model_rates AS dup
      WHERE keep.model_id = dup.model_id
        AND keep.call_type = dup.call_type
        AND keep.duration_type = 'overnight'
        AND dup.duration_type = 'overnight_9h'
        AND COALESCE(keep.location_id, '') = COALESCE(dup.location_id, '')
    `).catch(() => {})
    // Step 3: Delete remaining overnight_9h duplicates
    await prisma.$executeRawUnsafe(`
      DELETE FROM model_rates WHERE duration_type = 'overnight_9h'
    `).catch(() => {})

    // Insert default rates for active models that have NO rates at all
    // Durations: 1hour, 2hours, 3hours, 4hours, overnight × incall/outcall = 10 rows per model
    // Price 0 means "On request" in the UI
    await prisma.$executeRawUnsafe(`
      INSERT INTO model_rates (id, model_id, duration_type, call_type, price, currency, is_active)
      SELECT gen_random_uuid()::text, m.id, d.dt, d.ct, 0, 'GBP', true
      FROM models m
      CROSS JOIN (VALUES
        ('1hour','incall'), ('1hour','outcall'),
        ('2hours','incall'), ('2hours','outcall'),
        ('3hours','incall'), ('3hours','outcall'),
        ('4hours','incall'), ('4hours','outcall'),
        ('overnight','incall'), ('overnight','outcall')
      ) AS d(dt, ct)
      WHERE m.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM model_rates mr
          WHERE mr.model_id = m.id AND mr.is_active = true
        )
    `).catch(() => {})

    tablesChecked = true
  } catch (e) {
    console.error('[ensure-tables] Failed to create extension tables:', e)
  }
}
