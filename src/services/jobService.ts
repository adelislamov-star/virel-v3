// JOB SERVICE
// Queue management: enqueue, claim, heartbeat, succeed/fail, retry, cancel

import { prisma } from '@/lib/db/client';
import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────

type EnqueueOptions = {
  priority?: string;
  scheduledAt?: Date;
  maxAttempts?: number;
  dedupeKey?: string;
  parentJobId?: string;
};

// ─── Priority sort order for claiming ────────────────────

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// ─── enqueue ─────────────────────────────────────────────

export async function enqueue(
  type: string,
  payload: any,
  options?: EnqueueOptions
) {
  // Dedupe check
  if (options?.dedupeKey) {
    const existing = await prisma.jobQueue.findFirst({
      where: {
        dedupeKey: options.dedupeKey,
        status: { in: ['queued', 'running'] },
      },
    });
    if (existing) return existing;
  }

  return prisma.jobQueue.create({
    data: {
      type,
      payloadJson: payload,
      dedupeKey: options?.dedupeKey ?? null,
      priority: options?.priority ?? 'normal',
      maxAttempts: options?.maxAttempts ?? 3,
      scheduledAt: options?.scheduledAt ?? new Date(),
      parentJobId: options?.parentJobId ?? null,
    },
  });
}

// ─── claimNextJob ────────────────────────────────────────

export async function claimNextJob(workerName: string) {
  // Use a transaction to atomically find and lock a job
  return prisma.$transaction(async (tx) => {
    // Find the next eligible job
    const jobs = await tx.jobQueue.findMany({
      where: {
        status: 'queued',
        scheduledAt: { lte: new Date() },
      },
      orderBy: [
        { scheduledAt: 'asc' },
      ],
      take: 20,
    });

    if (jobs.length === 0) return null;

    // Sort by priority in application code
    jobs.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99;
      const pb = PRIORITY_ORDER[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });

    const job = jobs[0];
    const lockToken = randomUUID();

    const claimed = await tx.jobQueue.update({
      where: { id: job.id, status: 'queued' },
      data: {
        status: 'running',
        lockToken,
        lockedAt: new Date(),
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        workerName,
        attempts: { increment: 1 },
      },
    });

    return claimed;
  });
}

// ─── heartbeat ───────────────────────────────────────────

export async function heartbeat(jobId: string) {
  return prisma.jobQueue.update({
    where: { id: jobId },
    data: { lastHeartbeatAt: new Date() },
  });
}

// ─── markSucceeded ───────────────────────────────────────

export async function markSucceeded(jobId: string) {
  return prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: 'succeeded',
      finishedAt: new Date(),
    },
  });
}

// ─── markFailed ──────────────────────────────────────────

export async function markFailed(jobId: string, errorText: string) {
  const job = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job ${jobId} not found`);

  const isDead = job.attempts >= job.maxAttempts;

  if (isDead) {
    return prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'dead_letter',
        failedAt: new Date(),
        errorText,
      },
    });
  }

  // Exponential backoff: attempts * 2 minutes
  const backoffMs = job.attempts * 2 * 60_000;

  return prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: 'queued',
      failedAt: new Date(),
      errorText,
      scheduledAt: new Date(Date.now() + backoffMs),
      lockToken: null,
      lockedAt: null,
      workerName: null,
    },
  });
}

// ─── retryJob ────────────────────────────────────────────

export async function retryJob(jobId: string, actorId: string) {
  const job = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status !== 'failed' && job.status !== 'dead_letter') {
    throw new Error(`Cannot retry job in status ${job.status}`);
  }

  const updated = await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: 'queued',
      attempts: Math.max(0, job.attempts - 1),
      scheduledAt: new Date(),
      errorText: null,
      failedAt: null,
      lockToken: null,
      lockedAt: null,
      workerName: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'job.retried',
      entityType: 'job_queue',
      entityId: jobId,
      before: { status: job.status, attempts: job.attempts },
      after: { status: 'queued', attempts: updated.attempts },
    },
  });

  return updated;
}

// ─── cancelJob ───────────────────────────────────────────

export async function cancelJob(jobId: string, actorId: string) {
  const job = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status !== 'queued') {
    throw new Error(`Cannot cancel job in status ${job.status}`);
  }

  const updated = await prisma.jobQueue.update({
    where: { id: jobId },
    data: { status: 'cancelled' },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'job.cancelled',
      entityType: 'job_queue',
      entityId: jobId,
      before: { status: 'queued' },
      after: { status: 'cancelled' },
    },
  });

  return updated;
}

// ─── writeLog ────────────────────────────────────────────

export async function writeLog(
  jobId: string,
  step: string,
  status: string,
  message: string
) {
  return prisma.jobLog.create({
    data: { jobId, step, status, message },
  });
}
