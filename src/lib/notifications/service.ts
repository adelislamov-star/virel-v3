// NOTIFICATION SERVICE (Main orchestrator)
import { PrismaClient } from '@prisma/client';
import { NotificationChannel, NotificationData, NotificationResult } from './types';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { sendTelegram } from './telegram';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Send notification via specified channels
   */
  static async send(
    data: NotificationData,
    channels: NotificationChannel[] = ['email']
  ): Promise<NotificationResult[]> {
    
    const results: NotificationResult[] = [];
    
    // Send via each channel
    for (const channel of channels) {
      let result: NotificationResult;
      
      switch (channel) {
        case 'email':
          result = await sendEmail(data);
          break;
        case 'sms':
          result = await sendSMS(data);
          break;
        case 'telegram':
          result = await sendTelegram(data);
          break;
        default:
          result = {
            success: false,
            channel,
            error: 'Unknown channel'
          };
      }
      
      results.push(result);
      
      // Log to database (optional)
      try {
        await prisma.domainEvent.create({
          data: {
            eventType: `notification.${result.success ? 'sent' : 'failed'}`,
            entityType: 'notification',
            entityId: result.messageId || 'unknown',
            payload: {
              template: data.template,
              channel,
              recipient: data.recipient.email || data.recipient.phone || data.recipient.telegramChatId,
              result
            }
          }
        });
      } catch (e) {
        console.error('Failed to log notification:', e);
      }
    }
    
    return results;
  }
  
  /**
   * Send booking confirmed notification
   */
  static async notifyBookingConfirmed(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        model: true,
        location: true
      }
    });
    
    if (!booking || !booking.client) return;
    
    const data: NotificationData = {
      template: 'booking_confirmed',
      recipient: {
        email: booking.client.email || undefined,
        phone: booking.client.phone || undefined,
        name: booking.client.fullName
      },
      variables: {
        clientName: booking.client.fullName,
        modelName: booking.model?.name || 'Unknown',
        date: new Date(booking.startAt).toLocaleDateString('en-GB'),
        time: new Date(booking.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        location: booking.location?.title || 'TBD',
        duration: Math.round((booking.endAt.getTime() - booking.startAt.getTime()) / (1000 * 60 * 60)),
        amount: booking.priceTotal,
        bookingId: booking.id
      }
    };
    
    // Send to client via email/SMS
    const clientChannels: NotificationChannel[] = [];
    if (booking.client.email) clientChannels.push('email');
    if (booking.client.phone) clientChannels.push('sms');
    
    const clientResults = await this.send(data, clientChannels);
    
    // Notify operators via Telegram
    const operators = await prisma.user.findMany({
      where: { 
        telegramChatId: { not: null },
        roles: {
          some: {
            role: { code: { in: ['OPERATOR', 'OPS_MANAGER'] } }
          }
        }
      }
    });
    
    for (const operator of operators) {
      if (operator.telegramChatId) {
        await this.send({
          ...data,
          recipient: { telegramChatId: operator.telegramChatId }
        }, ['telegram']);
      }
    }
    
    return clientResults;
  }
  
  /**
   * Send payment received notification
   */
  static async notifyPaymentReceived(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: true,
            model: true
          }
        }
      }
    });
    
    if (!payment || !payment.booking.client) return;
    
    const data: NotificationData = {
      template: 'payment_received',
      recipient: {
        email: payment.booking.client.email || undefined,
        name: payment.booking.client.fullName
      },
      variables: {
        clientName: payment.booking.client.fullName,
        amount: payment.amount,
        transactionId: payment.providerPaymentId,
        bookingId: payment.bookingId
      }
    };
    
    return await this.send(data, ['email']);
  }
  
  /**
   * Send task assigned notification
   */
  static async notifyTaskAssigned(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedUser: true
      }
    });
    
    if (!task || !task.assignedUser?.telegramChatId) return;
    
    const data: NotificationData = {
      template: 'task_assigned',
      recipient: {
        telegramChatId: task.assignedUser.telegramChatId,
        name: task.assignedUser.name
      },
      variables: {
        subject: task.subject,
        priority: task.priority,
        dueAt: task.dueAt?.toLocaleString() || 'No deadline',
        taskId: task.id
      }
    };
    
    return await this.send(data, ['telegram']);
  }
}

export default NotificationService;
