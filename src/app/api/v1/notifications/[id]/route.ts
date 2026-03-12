// GET /api/v1/notifications/:id — details + logs
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
      include: { template: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } },
        { status: 404 }
      );
    }

    const logs = await prisma.notificationLog.findMany({
      where: { notificationId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: { notification, logs } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
