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
        model_id TEXT NOT NULL,
        location_id TEXT,
        duration_type TEXT NOT NULL,
        call_type TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        taxi_fee DOUBLE PRECISION,
        currency TEXT NOT NULL DEFAULT 'GBP',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(model_id, location_id, duration_type, call_type)
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

    // One-time cleanup: merge overnight_9h → overnight (both map to same label "Overnight")
    // For each model, if both exist for the same call_type, keep whichever has the higher price
    // under duration_type='overnight', then delete overnight_9h rows.
    await prisma.$executeRawUnsafe(`
      UPDATE model_rates AS keep
      SET price = GREATEST(keep.price, dup.price)
      FROM model_rates AS dup
      WHERE keep.model_id = dup.model_id
        AND keep.call_type = dup.call_type
        AND keep.duration_type = 'overnight'
        AND dup.duration_type = 'overnight_9h'
        AND COALESCE(keep.location_id, '') = COALESCE(dup.location_id, '')
        AND dup.price > keep.price
    `)
    await prisma.$executeRawUnsafe(`
      DELETE FROM model_rates WHERE duration_type = 'overnight_9h'
    `)

    tablesChecked = true
  } catch (e) {
    console.error('[ensure-tables] Failed to create extension tables:', e)
  }
}
