// GET ALL SERVICES GROUPED BY CATEGORY
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id, c.name, c.slug, c.sort_order,
        json_agg(
          json_build_object(
            'id', s.id,
            'title', s.title,
            'slug', s.slug,
            'code', s.code,
            'hasExtraPrice', s.has_extra_price,
            'requiresEquipment', s.requires_equipment,
            'isPopular', s."isPopular"
          ) ORDER BY s.sort_order, s.title
        ) as services
      FROM service_categories c
      LEFT JOIN services s ON s.category_id = c.id AND s.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.slug, c.sort_order
      ORDER BY c.sort_order
    `);
    
    return NextResponse.json({
      success: true,
      data: { categories }
    });
    
  } catch (error: any) {
    console.error('Get services error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
