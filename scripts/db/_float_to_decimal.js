// Migrate Float (double precision) columns to Decimal (numeric) before prisma db push
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alterations = [
    // payments
    `ALTER TABLE "payments" ALTER COLUMN "amount" TYPE numeric(12,2) USING "amount"::numeric(12,2)`,
    `ALTER TABLE "payments" ALTER COLUMN "refundedAmount" TYPE numeric(12,2) USING "refundedAmount"::numeric(12,2)`,
    // bookings
    `ALTER TABLE "bookings" ALTER COLUMN "priceTotal" TYPE numeric(12,2) USING "priceTotal"::numeric(12,2)`,
    `ALTER TABLE "bookings" ALTER COLUMN "depositRequired" TYPE numeric(12,2) USING "depositRequired"::numeric(12,2)`,
    // lost_revenue_registry
    `ALTER TABLE "lost_revenue_registry" ALTER COLUMN "amount" TYPE numeric(12,2) USING "amount"::numeric(12,2)`,
    // incidents
    `ALTER TABLE "incidents" ALTER COLUMN "compensationAmount" TYPE numeric(12,2) USING "compensationAmount"::numeric(12,2)`,
    // pricing_rules
    `ALTER TABLE "pricing_rules" ALTER COLUMN "actionValue" TYPE numeric(12,4) USING "actionValue"::numeric(12,4)`,
    `ALTER TABLE "pricing_rules" ALTER COLUMN "revenueImpact" TYPE numeric(12,2) USING "revenueImpact"::numeric(12,2)`,
    // membership_plans
    `ALTER TABLE "membership_plans" ALTER COLUMN "priceMonthly" TYPE numeric(12,2) USING "priceMonthly"::numeric(12,2)`,
    // subscription_invoices
    `ALTER TABLE "subscription_invoices" ALTER COLUMN "amount" TYPE numeric(12,2) USING "amount"::numeric(12,2)`,
    // clients
    `ALTER TABLE "clients" ALTER COLUMN "totalSpent" TYPE numeric(12,2) USING "totalSpent"::numeric(12,2)`,
  ];

  for (const sql of alterations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      const col = sql.match(/ALTER COLUMN "(\w+)"/)?.[1];
      const table = sql.match(/ALTER TABLE "(\w+)"/)?.[1];
      console.log(`OK: ${table}.${col}`);
    } catch (e) {
      // Column might not exist yet or already correct type
      console.log(`SKIP: ${e.message.substring(0, 80)}`);
    }
  }
}

main().then(() => { console.log('Done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
