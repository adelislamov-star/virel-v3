// GET /api/v1/retention/campaigns — list campaigns
// POST /api/v1/retention/campaigns — create campaign
// RBAC: OPS_MANAGER (GET), OWNER (POST)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export async function GET() {
  try {
    const campaigns = await prisma.retentionCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: { campaigns } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  triggerType: z.string().min(1),
  segmentFilter: z.any(),
  channel: z.string().min(1),
  templateId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = CreateCampaignSchema.parse(body);

    const campaign = await prisma.retentionCampaign.create({ data });

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'retention.campaign.created',
        entityType: 'retention_campaign',
        entityId: campaign.id,
        after: { name: data.name, triggerType: data.triggerType, channel: data.channel },
      },
    });

    return NextResponse.json({ success: true, data: { campaign } }, { status: 201 });
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
