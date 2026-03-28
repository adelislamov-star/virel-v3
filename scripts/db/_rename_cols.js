const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const renames = [
    ['cancellationRate', 'cancellation_rate'],
    ['refundCount', 'refund_count'],
    ['vipStatus', 'vip_status'],
  ];
  for (const [from, to] of renames) {
    try {
      await p.$executeRawUnsafe('ALTER TABLE clients RENAME COLUMN "' + from + '" TO "' + to + '"');
      console.log('Renamed ' + from + ' -> ' + to);
    } catch (e) {
      console.log(from + ': ' + e.message.substring(0, 100));
    }
  }
  console.log('Done');
  await p.$disconnect();
})();
