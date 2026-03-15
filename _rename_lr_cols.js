const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function run() {
  const renames = [
    ["bookingId", "booking_id"],
    ["leadId", "lead_id"],
    ["rootCause", "root_cause"],
    ["responsibleRole", "responsible_role"],
    ["resolvedAt", "resolved_at"],
    ["resolvedBy", "resolved_by"],
    ["createdAt", "created_at"],
    ["updatedAt", "updated_at"],
  ];
  for (const pair of renames) {
    try {
      var sql = 'ALTER TABLE lost_revenue_registry RENAME COLUMN "' + pair[0] + '" TO "' + pair[1] + '"';
      await p.$executeRawUnsafe(sql);
      console.log("Renamed: " + pair[0] + " -> " + pair[1]);
    } catch(e) {
      console.log("Skip: " + pair[0] + " (" + e.message.slice(0, 80) + ")");
    }
  }
  console.log("Done");
}

run().finally(function() { p.$disconnect(); });
