// INCIDENTS API
// GET /api/v1/incidents — list incidents with filters
// POST /api/v1/incidents — create incident

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          booking: { select: { id: true, shortId: true } },
          reporterClient: { select: { id: true, fullName: true } },
          reporterModel: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.incident.count({ where })
    ]);

    return NextResponse.json({
      data: {
        incidents,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

const CreateIncidentSchema = z.object({
  bookingId: z.string().optional(),
  reporterType: z.enum(['client', 'model', 'staff']),
  reporterClientId: z.string().optional(),
  reporterModelId: z.string().optional(),
  reporterUserId: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateIncidentSchema.parse(body);

    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          bookingId: data.bookingId,
          reporterType: data.reporterType,
          reporterClientId: data.reporterClientId,
          reporterModelId: data.reporterModelId,
          reporterUserId: data.reporterUserId,
          severity: data.severity,
          description: data.description
        }
      });

      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'CREATE',
          entityType: 'incident',
          entityId: created.id,
          after: { ...data, status: 'reported' }
        }
      });

      return created;
    });

    return NextResponse.json({ data: { incident } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
