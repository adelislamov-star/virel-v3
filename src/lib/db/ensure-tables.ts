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
        duration_type TEXT NOT NULL,
        call_type TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        taxi_fee DECIMAL(10,2),
        currency TEXT NOT NULL DEFAULT 'GBP',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("modelId", duration_type, call_type)
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
    await prisma.$executeRawUnsafe(`
      UPDATE model_rates SET duration_type = 'overnight'
      WHERE duration_type = 'overnight_9h'
        AND NOT EXISTS (
          SELECT 1 FROM model_rates AS o
          WHERE o."modelId" = model_rates."modelId"
            AND o.call_type = model_rates.call_type
            AND o.duration_type = 'overnight'
        )
    `).catch(() => {})
    await prisma.$executeRawUnsafe(`
      DELETE FROM model_rates WHERE duration_type = 'overnight_9h'
    `).catch(() => {})

    // Insert default rates for active models that have NO rates at all
    await prisma.$executeRawUnsafe(`
      INSERT INTO model_rates (id, "modelId", duration_type, call_type, price, currency, created_at, updated_at)
      SELECT gen_random_uuid()::text, m.id, d.dt, d.ct, 0, 'GBP', NOW(), NOW()
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
          WHERE mr."modelId" = m.id
        )
    `).catch(() => {})

    tablesChecked = true
  } catch (e) {
    console.error('[ensure-tables] Failed to create extension tables:', e)
  }
}
