// PRICING RULE — PATCH update + DELETE (deactivate)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const rule = await prisma.pricingRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.conditionType !== undefined && { conditionType: body.conditionType }),
        ...(body.conditionConfig !== undefined && { conditionConfig: body.conditionConfig }),
        ...(body.actionType !== undefined && { actionType: body.actionType }),
        ...(body.actionValue !== undefined && { actionValue: parseFloat(body.actionValue) }),
        ...(body.appliesTo !== undefined && { appliesTo: body.appliesTo }),
        ...(body.scopeEntityId !== undefined && { scopeEntityId: body.scopeEntityId }),
        ...(body.priority !== undefined && { priority: parseInt(body.priority) }),
        ...(body.status !== undefined && { status: body.status })
      }
    });

    return NextResponse.json({ data: { rule } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'UPDATE_FAILED', message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const rule = await prisma.pricingRule.update({
      where: { id },
      data: { status: 'disabled' }
    });

    return NextResponse.json({ data: { rule } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'DELETE_FAILED', message: error.message } }, { status: 500 });
  }
}
