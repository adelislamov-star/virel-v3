// JOB WORKER RUNTIME
// Polling loop that claims and executes queued jobs

import {
  claimNextJob,
  heartbeat,
  markSucceeded,
  markFailed,
  writeLog,
} from '@/services/jobService';
import { dispatchNotification } from '@/services/notificationService';
import { recalculateClientRisk } from '@/services/fraudService';
import { runDailyRetentionScan } from '@/services/retentionService';
import { detectFromBooking } from '@/services/lostRevenueService';
import { rebuildDemandStats } from '@/services/demandAnalyticsService';
import { buildPerformanceSnapshot, buildScoreSnapshot } from '@/services/staffAnalyticsService';
import { buildSnapshot } from '@/services/ownerAnalyticsService';
import { prisma } from '@/lib/db/client';

// ─── Handler registry ────────────────────────────────────

type JobHandler = (payload: any, jobId: string) => Promise<void>;

const handlers: Record<string, JobHandler> = {
  send_email: stubHandler('send_email'),
  send_telegram: stubHandler('send_telegram'),
  send_sms: stubHandler('send_sms'),
  generate_report: stubHandler('generate_report'),
  fraud_scan: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Fraud scan started');
    // Find all clients with new signals in last 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSignals = await prisma.fraudSignal.findMany({
      where: { createdAt: { gte: cutoff }, status: 'new' },
      select: { clientId: true },
      distinct: ['clientId'],
    });
    let processed = 0;
    for (const { clientId } of recentSignals) {
      await recalculateClientRisk(clientId);
      processed++;
    }
    await writeLog(jobId, 'complete', 'succeeded', `Fraud scan: ${processed} clients recalculated`);
  },
  media_processing: stubHandler('media_processing'),
  seo_generation: stubHandler('seo_generation'),
  pricing_recalculation: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Pricing recalculation started');
    // Recalculate PricingRule aggregates (timesApplied, revenueImpact)
    const rules = await prisma.pricingRule.findMany({
      where: { status: 'active', deletedAt: null },
    });
    // Get all decision logs
    const allLogs = await prisma.pricingDecisionLog.findMany({
      select: { appliedRulesJson: true, marginImpact: true },
    });
    let updated = 0;
    for (const rule of rules) {
      // Count logs that reference this rule in their appliedRulesJson
      let count = 0;
      let totalImpact = 0;
      for (const log of allLogs) {
        const rules_arr = log.appliedRulesJson as any[];
        if (Array.isArray(rules_arr) && rules_arr.some((r: any) => r.ruleId === rule.id)) {
          count++;
          totalImpact += Number(log.marginImpact || 0);
        }
      }
      await prisma.pricingRule.update({
        where: { id: rule.id },
        data: { timesApplied: count, revenueImpact: totalImpact },
      });
      updated++;
    }
    await writeLog(jobId, 'complete', 'succeeded', `Pricing recalculation: ${updated} rules updated`);
  },
  retention_scan: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Retention scan started');
    const result = await runDailyRetentionScan();
    await writeLog(jobId, 'complete', 'succeeded', `Retention scan: ${result.actionsCreated || 0} actions created`);
  },
  membership_billing: stubHandler('membership_billing'),
  notification_dispatch: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Dispatching notification');
    const notificationId = payload?.notificationId;
    if (!notificationId) throw new Error('Missing notificationId in payload');
    const result = await dispatchNotification(notificationId);
    if (result && 'skipped' in result) {
      await writeLog(jobId, 'complete', 'skipped', `Skipped: ${result.reason}`);
    } else {
      await writeLog(jobId, 'complete', 'succeeded', 'Notification dispatched');
    }
  },

  // ── New cron-driven handlers ──────────────────────────────

  lost_revenue_auto_detection: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Lost revenue auto-detection started');
    const lookbackHours = payload?.lookbackHours ?? 1;
    const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const cancelledBookings = await prisma.booking.findMany({
      where: {
        status: 'cancelled',
        updatedAt: { gte: cutoff },
        deletedAt: null,
      },
      select: { id: true },
    });
    let detected = 0;
    for (const b of cancelledBookings) {
      try {
        await detectFromBooking(b.id);
        detected++;
      } catch {
        // skip individual failures
      }
    }
    await writeLog(jobId, 'complete', 'succeeded', `Lost revenue: ${detected} bookings processed`);
  },

  operations_feed_auto_close: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Operations feed auto-close started');
    const olderThanHours = payload?.olderThanHours ?? 72;
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const result = await prisma.operationsFeedItem.updateMany({
      where: {
        status: 'resolved',
        resolvedAt: { lt: cutoff },
      },
      data: { status: 'dismissed' },
    });
    await writeLog(jobId, 'complete', 'succeeded', `Operations feed: ${result.count} items auto-dismissed`);
  },

  demand_stats_rebuild: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Demand stats rebuild started');
    const periodHours = payload?.periodHours ?? 1;
    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    await rebuildDemandStats(periodStart, periodEnd);
    await writeLog(jobId, 'complete', 'succeeded', 'Demand stats rebuilt');
  },

  staff_snapshot_build: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Staff snapshots build started');
    // Yesterday's boundaries
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const periodStart = yesterday;
    const periodEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

    const activeUsers = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
    });
    let built = 0;
    for (const u of activeUsers) {
      try {
        await buildPerformanceSnapshot(u.id, periodStart, periodEnd);
        await buildScoreSnapshot(u.id, periodStart, periodEnd);
        built++;
      } catch {
        // skip individual failures
      }
    }
    await writeLog(jobId, 'complete', 'succeeded', `Staff snapshots: ${built} users processed`);
  },

  analytics_owner_rebuild: async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', 'Owner analytics rebuild started');
    const now = new Date();
    // Yesterday
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
    await buildSnapshot(yesterday, yesterdayEnd, 'daily');

    // Current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    await buildSnapshot(monthStart, now, 'monthly');

    await writeLog(jobId, 'complete', 'succeeded', 'Owner analytics: yesterday + current month rebuilt');
  },
};

function stubHandler(type: string): JobHandler {
  return async (payload: any, jobId: string) => {
    await writeLog(jobId, 'start', 'running', `Handler ${type} started`);
    // Stub: real logic will be added in future sprints
    console.log(`[JobWorker] Executing ${type} for job ${jobId}`);
    await writeLog(jobId, 'complete', 'succeeded', `Handler ${type} completed`);
  };
}

// ─── Worker loop ─────────────────────────────────────────

let running = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

export function startWorker(workerName: string) {
  if (running) {
    console.log(`[JobWorker] Worker ${workerName} already running`);
    return;
  }

  running = true;
  console.log(`[JobWorker] Starting worker: ${workerName}`);

  async function poll() {
    if (!running) return;

    try {
      const job = await claimNextJob(workerName);

      if (job) {
        console.log(`[JobWorker] Claimed job ${job.id} (${job.type})`);

        // Start heartbeat interval
        const heartbeatInterval = setInterval(async () => {
          try {
            await heartbeat(job.id);
          } catch {
            // Ignore heartbeat errors
          }
        }, 15_000);

        try {
          const handler = handlers[job.type];
          if (!handler) {
            throw new Error(`No handler registered for job type: ${job.type}`);
          }

          await handler(job.payloadJson, job.id);
          await markSucceeded(job.id);
          console.log(`[JobWorker] Job ${job.id} succeeded`);
        } catch (err: any) {
          console.error(`[JobWorker] Job ${job.id} failed:`, err.message);
          await writeLog(job.id, 'error', 'failed', err.message);
          await markFailed(job.id, err.message);
        } finally {
          clearInterval(heartbeatInterval);
        }
      }
    } catch (err: any) {
      console.error(`[JobWorker] Poll error:`, err.message);
    }

    // Schedule next poll
    if (running) {
      pollTimer = setTimeout(poll, 5_000);
    }
  }

  poll();
}

export function stopWorker() {
  running = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  console.log('[JobWorker] Worker stopped');
}

// ─── Register custom handler ─────────────────────────────

export function registerHandler(type: string, handler: JobHandler) {
  handlers[type] = handler;
}
