import { prisma } from '@/lib/db/client';
import { NextRequest } from 'next/server';

type AuditParams = {
  actorUserId?: string;
  actorType?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: any;
  after?: any;
  req?: NextRequest;
};

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: params.actorType ?? 'user',
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? '',
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        ipAddress: params.req?.headers.get('x-forwarded-for') ?? undefined,
        userAgent: params.req?.headers.get('user-agent') ?? undefined,
      },
    });
  } catch (e) {
    // Never throw — audit must not break main flow
    console.error('[audit] failed to write:', e);
  }
}
