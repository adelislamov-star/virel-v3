// SLA TRACKER — creates and monitors SLA records
import { prisma } from '@/lib/db/client';

export async function createSLARecord(policyId: string, entityType: string, entityId: string) {
  const policy = await prisma.sLAPolicy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error(`SLA Policy ${policyId} not found`);

  const deadlineAt = new Date(Date.now() + policy.deadlineMinutes * 60 * 1000);

  return prisma.sLARecord.create({
    data: {
      policyId,
      entityType,
      entityId,
      deadlineAt
    }
  });
}

export async function completeSLA(entityType: string, entityId: string) {
  const record = await prisma.sLARecord.findFirst({
    where: {
      entityType,
      entityId,
      completedAt: null,
      breached: false
    },
    orderBy: { startedAt: 'desc' }
  });

  if (!record) return null;

  return prisma.sLARecord.update({
    where: { id: record.id },
    data: { completedAt: new Date() }
  });
}

export async function checkBreaches(): Promise<number> {
  const now = new Date();

  const result = await prisma.sLARecord.updateMany({
    where: {
      deadlineAt: { lt: now },
      completedAt: null,
      breached: false
    },
    data: { breached: true }
  });

  return result.count;
}

export async function getBreachedRecords(limit = 50) {
  return prisma.sLARecord.findMany({
    where: { breached: true },
    include: { policy: true },
    orderBy: { deadlineAt: 'desc' },
    take: limit
  });
}
