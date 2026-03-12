// POST /api/v1/clients/merge — merge duplicate client into primary
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

const MergeSchema = z.object({
  primaryClientId: z.string().min(1),
  duplicateClientId: z.string().min(1),
  reasonCode: z.string().min(1, 'reasonCode is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = MergeSchema.parse(body);
    const actorId = 'system'; // TODO: from auth

    const [primary, duplicate] = await Promise.all([
      prisma.client.findUnique({ where: { id: data.primaryClientId } }),
      prisma.client.findUnique({ where: { id: data.duplicateClientId } }),
    ]);

    if (!primary || primary.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Primary client not found' } },
        { status: 404 },
      );
    }
    if (!duplicate || duplicate.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Duplicate client not found' } },
        { status: 404 },
      );
    }
    if (data.primaryClientId === data.duplicateClientId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot merge client with itself' } },
        { status: 400 },
      );
    }

    // Transfer relations
    const [bookings, inquiries, reviews, fraudSignals] = await Promise.all([
      prisma.booking.updateMany({ where: { clientId: data.duplicateClientId }, data: { clientId: data.primaryClientId } }),
      prisma.inquiry.updateMany({ where: { clientId: data.duplicateClientId }, data: { clientId: data.primaryClientId } }),
      prisma.review.updateMany({ where: { clientId: data.duplicateClientId }, data: { clientId: data.primaryClientId } }),
      prisma.fraudSignal.updateMany({ where: { clientId: data.duplicateClientId }, data: { clientId: data.primaryClientId } }),
    ]);

    // Mark duplicate as merged
    await prisma.client.update({
      where: { id: data.duplicateClientId },
      data: { mergedIntoClientId: data.primaryClientId },
    });

    // Create merge log
    const mergeLog = await prisma.clientMergeLog.create({
      data: {
        primaryClientId: data.primaryClientId,
        duplicateClientId: data.duplicateClientId,
        mergedBy: actorId,
        reasonCode: data.reasonCode,
        mergeSummaryJson: {
          bookingsMoved: bookings.count,
          inquiriesMoved: inquiries.count,
          reviewsMoved: reviews.count,
          fraudSignalsMoved: fraudSignals.count,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'client.merged',
        entityType: 'client',
        entityId: data.primaryClientId,
        before: { duplicateClientId: data.duplicateClientId },
        after: {
          mergeLogId: mergeLog.id,
          reasonCode: data.reasonCode,
          bookingsMoved: bookings.count,
          inquiriesMoved: inquiries.count,
        },
      },
    });

    return NextResponse.json({ success: true, data: { mergeLog } }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
