// GET ALL SERVICES — returns in categories format for ServicesTab component
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { ensureServices } from '@/lib/db/ensure-services';

export async function GET(request: NextRequest) {
  try {
    await ensureServices();

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

    // ServicesTab expects categories with nested services
    // Wrap all services in a single "All Services" category
    const categories = [
      {
        id: 'all',
        name: 'All Services',
        slug: 'all',
        sort_order: 0,
        services: services.map(s => ({
          ...s,
          hasExtraPrice: false,
        })),
      }
    ];

    return NextResponse.json({
      success: true,
      data: { categories, services }
    });

  } catch (error: any) {
    console.error('Get services error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
