// GET ALL SERVICES — returns in categories format for ServicesTab component
// POST — create a new service
// DELETE — remove a service (via query param ?id=xxx)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { ensureServices } from '@/lib/db/ensure-services';
import { ensureExtensionTables } from '@/lib/db/ensure-tables';

// Service categories for grouping in admin UI
const CATEGORY_ORDER: Record<string, number> = {
  'Connection': 1,
  'Oral': 2,
  'Intimate': 3,
  'Group': 4,
  'Touch & Wellness': 5,
  'Fetish': 6,
  'Domination': 7,
  'Other': 99,
};

export async function GET(request: NextRequest) {
  try {
    await ensureExtensionTables();
    await ensureServices();

    const services = await prisma.service.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        description: true,
        defaultExtraPrice: true,
        isPopular: true,
        status: true,
      },
      orderBy: { title: 'asc' },
    });

    // Group by category
    const categoryMap = new Map<string, typeof services>();
    for (const s of services) {
      const cat = s.category || 'Other';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(s);
    }

    const categories = Array.from(categoryMap.entries())
      .sort(([a], [b]) => (CATEGORY_ORDER[a] ?? 50) - (CATEGORY_ORDER[b] ?? 50))
      .map(([name, svcs]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        sort_order: CATEGORY_ORDER[name] ?? 50,
        services: svcs.map(s => ({
          ...s,
          hasExtraPrice: true, // All services support optional extra price
        })),
      }));

    return NextResponse.json({
      success: true,
      data: { categories, services },
    });
  } catch (error: any) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// CREATE a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, description, defaultExtraPrice } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Title is required' } },
        { status: 400 },
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check for duplicate slug
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: `Service "${title}" already exists` } },
        { status: 409 },
      );
    }

    const service = await prisma.service.create({
      data: {
        title: title.trim(),
        slug,
        category: category || 'Other',
        description: description || null,
        defaultExtraPrice: defaultExtraPrice ? parseFloat(defaultExtraPrice) : null,
        status: 'active',
        isPopular: false,
      },
    });

    return NextResponse.json({ success: true, data: { service } });
  } catch (error: any) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// DELETE a service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Service ID is required' } },
        { status: 400 },
      );
    }

    // Remove from all model profiles first
    await prisma.modelService.deleteMany({ where: { serviceId: id } });

    // Delete the service
    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Service deleted' });
  } catch (error: any) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// UPDATE a service
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, category, description, defaultExtraPrice, isPopular } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Service ID is required' } },
        { status: 400 },
      );
    }

    const data: any = {};
    if (title !== undefined) {
      data.title = title.trim();
      data.slug = title
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description || null;
    if (defaultExtraPrice !== undefined) data.defaultExtraPrice = defaultExtraPrice ? parseFloat(defaultExtraPrice) : null;
    if (isPopular !== undefined) data.isPopular = isPopular;

    const service = await prisma.service.update({ where: { id }, data });

    return NextResponse.json({ success: true, data: { service } });
  } catch (error: any) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
