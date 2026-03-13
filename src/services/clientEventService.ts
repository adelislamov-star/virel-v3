// CLIENT EVENT SERVICE
// Records client timeline events for audit/history tracking

import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client';

export type ClientEventType =
  | 'inquiry.created'
  | 'inquiry.converted'
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.completed'
  | 'booking.no_show'
  | 'payment.received'
  | 'payment.refunded'
  | 'review.submitted'
  | 'incident.created'
  | 'incident.resolved'
  | 'membership.started'
  | 'membership.cancelled'
  | 'fraud.signal.created'
  | 'risk_status.changed'
  | 'retention.action.created'
  | 'client.merged';

const EVENT_TITLES: Record<ClientEventType, string> = {
  'inquiry.created': 'Inquiry created',
  'inquiry.converted': 'Inquiry converted to booking',
  'booking.created': 'Booking created',
  'booking.confirmed': 'Booking confirmed',
  'booking.cancelled': 'Booking cancelled',
  'booking.completed': 'Booking completed',
  'booking.no_show': 'Client no-show',
  'payment.received': 'Payment received',
  'payment.refunded': 'Payment refunded',
  'review.submitted': 'Review submitted',
  'incident.created': 'Incident created',
  'incident.resolved': 'Incident resolved',
  'membership.started': 'Membership started',
  'membership.cancelled': 'Membership cancelled',
  'fraud.signal.created': 'Fraud signal detected',
  'risk_status.changed': 'Risk status changed',
  'retention.action.created': 'Retention action created',
  'client.merged': 'Client merged',
};

export async function recordClientEvent(
  clientId: string,
  eventType: ClientEventType,
  metadataJson: Prisma.InputJsonValue,
  actorId: string,
): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      console.warn(`[clientEventService] client ${clientId} not found, skipping event ${eventType}`);
      return;
    }

    await prisma.clientEvent.create({
      data: {
        clientId,
        eventType,
        title: EVENT_TITLES[eventType] ?? eventType,
        metadataJson,
        actorType: actorId === 'system' ? 'system' : 'user',
        createdBy: actorId,
        source: actorId === 'system' ? 'system' : 'user',
      },
    });
  } catch (err) {
    console.error(`[clientEventService] Failed to record event ${eventType} for client ${clientId}:`, err);
  }
}
