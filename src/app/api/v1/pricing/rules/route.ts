// PRICING RULES — GET list + POST create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (status) where.status = status;

    const [rules, total] = await Promise.all([
      prisma.pricingRule.findMany({
        where,
        orderBy: { priority: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.pricingRule.count({ where })
    ]);

    return NextResponse.json({
      data: { rules, total, page, limit }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, conditionType, conditionConfig, actionType, actionValue, appliesTo, scopeEntityId, priority } = body;

    if (!name || !conditionType || !actionType || actionValue === undefined) {
      return NextResponse.json({ error: { code: 'VALIDATION', message: 'Missing required fields' } }, { status: 400 });
    }

    const rule = await prisma.pricingRule.create({
      data: {
        name,
        conditionType,
        conditionConfig: conditionConfig || {},
        actionType,
        actionValue: parseFloat(actionValue),
        appliesTo: appliesTo || 'all',
        scopeEntityId: scopeEntityId || null,
        priority: parseInt(priority || '0')
      }
    });

    return NextResponse.json({ data: { rule } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CREATE_FAILED', message: error.message } }, { status: 500 });
  }
}
