// CLIENT SUBSCRIPTION — GET, POST (subscribe), DELETE (cancel)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;

    const membership = await prisma.clientMembership.findUnique({
      where: { clientId },
      include: {
        plan: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    });

    if (!membership) {
      return NextResponse.json({ data: { membership: null } });
    }

    return NextResponse.json({ data: { membership } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: { code: 'VALIDATION', message: 'planId required' } }, { status: 400 });
    }

    // Check existing
    const existing = await prisma.clientMembership.findUnique({ where: { clientId } });
    if (existing && !['cancelled', 'expired'].includes(existing.status)) {
      return NextResponse.json({ error: { code: 'ALREADY_EXISTS', message: 'Client already has an active membership' } }, { status: 409 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan not found' } }, { status: 404 });
    }

    // Delete old cancelled/expired record if exists
    if (existing) {
      await prisma.clientMembership.delete({ where: { id: existing.id } });
    }

    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const membership = await prisma.clientMembership.create({
      data: {
        clientId,
        planId,
        status: 'active',
        startedAt: new Date(),
        nextBillingAt: nextBilling,
        autoRenew: true
      },
      include: { plan: true }
    });

    return NextResponse.json({ data: { membership } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CREATE_FAILED', message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    const body = await request.json();

    const membership = await prisma.clientMembership.findUnique({ where: { clientId } });
    if (!membership) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No membership found' } }, { status: 404 });
    }

    if (['cancelled', 'expired'].includes(membership.status)) {
      return NextResponse.json({ error: { code: 'ALREADY_CANCELLED', message: 'Membership already cancelled' } }, { status: 400 });
    }

    const updated = await prisma.clientMembership.update({
      where: { clientId },
      data: {
        status: 'cancelled',
        autoRenew: false
      }
    });

    return NextResponse.json({ data: { membership: updated } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CANCEL_FAILED', message: error.message } }, { status: 500 });
  }
}
