// GET ALL SERVICES (fixed: removed service_categories reference)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        title: true,
        slug: true,
        isPopular: true,
        status: true
      },
      orderBy: { title: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: { services }
    });

  } catch (error: any) {
    console.error('Get services error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
