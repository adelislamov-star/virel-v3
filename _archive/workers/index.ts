// QUEUE WORKER
// Processes background jobs: automation, notifications, etc.

import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import AutomationEngine from '../lib/automation/engine';

const prisma = new PrismaClient();

// Redis connection
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create queues
export const criticalQueue = new Queue('critical', { connection });
export const opsQueue = new Queue('ops', { connection });
export const heavyQueue = new Queue('heavy', { connection });

// Critical queue worker
const criticalWorker = new Worker('critical', async (job) => {
  console.log(`[CRITICAL] Processing job: ${job.name}`);
  
  switch (job.name) {
    case 'process_payment':
      await processPayment(job.data);
      break;
    case 'update_booking_status':
      await updateBookingStatus(job.data);
      break;
    case 'check_sla_breach':
      await checkSLABreach(job.data);
      break;
  }
}, {
  connection,
  concurrency: 5
});

// Ops queue worker
const opsWorker = new Worker('ops', async (job) => {
  console.log(`[OPS] Processing job: ${job.name}`);
  
  switch (job.name) {
    case 'send_notification':
      await sendNotification(job.data);
      break;
    case 'execute_automation':
      await AutomationEngine.processEvent(job.data.eventId);
      break;
    case 'sync_appsheet':
      await syncToAppSheet(job.data);
      break;
  }
}, {
  connection,
  concurrency: 10
});

// Heavy queue worker
const heavyWorker = new Worker('heavy', async (job) => {
  console.log(`[HEAVY] Processing job: ${job.name}`);
  
  switch (job.name) {
    case 'process_media':
      await processMedia(job.data);
      break;
    case 'generate_report':
      await generateReport(job.data);
      break;
  }
}, {
  connection,
  concurrency: 2
});

// Job handlers
async function processPayment(data: any) {
  console.log('Processing payment:', data.paymentId);
  // Stripe payment processing logic here
}

async function updateBookingStatus(data: any) {
  console.log('Updating booking status:', data.bookingId);
  await prisma.booking.update({
    where: { id: data.bookingId },
    data: { status: data.status }
  });
}

async function checkSLABreach(data: any) {
  console.log('Checking SLA breach:', data.taskId);
  
  const task = await prisma.task.findUnique({
    where: { id: data.taskId }
  });
  
  if (!task || !task.slaDeadlineAt) return;
  
  if (new Date() > task.slaDeadlineAt && task.status !== 'done') {
    // Create exception
    await prisma.exception.create({
      data: {
        type: 'sla_breach',
        status: 'open',
        severity: 'high',
        entityType: 'task',
        entityId: task.id,
        summary: `SLA breached for task: ${task.subject}`,
        details: { task }
      }
    });
    
    // Escalate to manager
    await prisma.task.update({
      where: { id: task.id },
      data: {
        priority: 'critical'
      }
    });
  }
}

async function sendNotification(data: any) {
  console.log('Sending notification:', data.type);
  // Telegram/Email/SMS logic here
}

async function syncToAppSheet(data: any) {
  console.log('Syncing to AppSheet:', data.bookingId);
  // AppSheet API sync logic
}

async function processMedia(data: any) {
  console.log('Processing media:', data.mediaId);
  // Image optimization, WebP/AVIF conversion
}

async function generateReport(data: any) {
  console.log('Generating report:', data.reportType);
  // Report generation logic
}

// Error handlers
criticalWorker.on('failed', (job, err) => {
  console.error(`[CRITICAL] Job failed:`, job?.id, err.message);
});

opsWorker.on('failed', (job, err) => {
  console.error(`[OPS] Job failed:`, job?.id, err.message);
});

heavyWorker.on('failed', (job, err) => {
  console.error(`[HEAVY] Job failed:`, job?.id, err.message);
});

console.log('✅ Queue workers started');
console.log('- Critical queue: 5 concurrent workers');
console.log('- Ops queue: 10 concurrent workers');
console.log('- Heavy queue: 2 concurrent workers');
