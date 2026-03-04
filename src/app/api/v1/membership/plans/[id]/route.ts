// MEMBERSHIP PLAN — PATCH update + DELETE (archive)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.tier !== undefined && { tier: parseInt(body.tier) }),
        ...(body.priceMonthly !== undefined && { priceMonthly: parseFloat(body.priceMonthly) }),
        ...(body.bookingDiscountPercent !== undefined && { bookingDiscountPercent: parseInt(body.bookingDiscountPercent) }),
        ...(body.prioritySupportLevel !== undefined && { prioritySupportLevel: parseInt(body.prioritySupportLevel) }),
        ...(body.perks !== undefined && { perks: body.perks }),
        ...(body.status !== undefined && { status: body.status })
      }
    });

    return NextResponse.json({ data: { plan } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'UPDATE_FAILED', message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: { status: 'archived' }
    });

    return NextResponse.json({ data: { plan } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'ARCHIVE_FAILED', message: error.message } }, { status: 500 });
  }
}
