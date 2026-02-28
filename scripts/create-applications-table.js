const { Client } = require('pg')
require('dotenv').config()

const client = new Client({ connectionString: process.env.DATABASE_URL })

const sql = `
CREATE TABLE IF NOT EXISTS model_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source TEXT NOT NULL DEFAULT 'self',
  status TEXT NOT NULL DEFAULT 'new',
  name TEXT NOT NULL,
  age INTEGER,
  height INTEGER,
  weight INTEGER,
  "dressSizeUK" TEXT,
  "feetSizeUK" TEXT,
  "breastSize" TEXT,
  "breastType" TEXT,
  "eyesColour" TEXT,
  "hairColour" TEXT,
  "smokingStatus" TEXT,
  "tattooStatus" TEXT,
  "piercingTypes" TEXT,
  nationality TEXT,
  languages TEXT[] DEFAULT '{}',
  orientation TEXT,
  "workWithCouples" BOOLEAN DEFAULT false,
  "workWithWomen" BOOLEAN DEFAULT false,
  "rate30min" INTEGER,
  "rate45min" INTEGER,
  "rate1hIn" INTEGER,
  "rate1hOut" INTEGER,
  "rate90minIn" INTEGER,
  "rate90minOut" INTEGER,
  "rate2hIn" INTEGER,
  "rate2hOut" INTEGER,
  "rateExtraHour" INTEGER,
  "rateOvernight" INTEGER,
  "blackClients" BOOLEAN DEFAULT true,
  "disabledClients" BOOLEAN DEFAULT true,
  "addressStreet" TEXT,
  "addressFlat" TEXT,
  "addressPostcode" TEXT,
  "tubeStation" TEXT,
  "airportHeathrow" BOOLEAN DEFAULT false,
  "airportGatwick" BOOLEAN DEFAULT false,
  "airportStansted" BOOLEAN DEFAULT false,
  services TEXT[] DEFAULT '{}',
  "notesInternal" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS model_applications_status_idx ON model_applications(status);
CREATE INDEX IF NOT EXISTS model_applications_created_idx ON model_applications("createdAt");
`

async function run() {
  await client.connect()
  await client.query(sql)
  console.log('✅ Table model_applications created successfully')
  await client.end()
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
