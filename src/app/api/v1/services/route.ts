import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const isPublic = searchParams.get('isPublic');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || undefined;

    const where: Prisma.ServiceWhereInput = {
      ...(category && { category }),
      ...(isPublic !== null && isPublic !== undefined && { isPublic: isPublic === 'true' }),
      ...(isActive !== null && isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { title: { contains: search, mode: 'insensitive' as const } },
          { publicName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        title: true,
        name: true,
        slug: true,
        category: true,
        publicName: true,
        description: true,
        introText: true,
        fullDescription: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        isPublic: true,
        isPopular: true,
        isActive: true,
        sortOrder: true,
        defaultExtraPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { models: true } },
      },
    });

    const [total, publicCount, membersOnly, activeCount] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { isPublic: true } }),
      prisma.service.count({ where: { isPublic: false } }),
      prisma.service.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      services,
      stats: { total, public: publicCount, membersOnly, active: activeCount },
    });
  } catch (error: unknown) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, name, category, description, publicName, isPublic, isPopular, isActive, sortOrder, defaultExtraPrice,
      seoTitle, seoDescription, seoKeywords, introText, fullDescription } = body;

    const label = title || name;
    if (!label || !label.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Title is required' } },
        { status: 400 },
      );
    }

    const slug = body.slug || label
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: `Service "${label}" already exists` } },
        { status: 409 },
      );
    }

    const service = await prisma.service.create({
      data: {
        title: label.trim(),
        name: name?.trim() || null,
        slug,
        category: category || 'signature',
        description: description || null,
        publicName: publicName || null,
        defaultExtraPrice: defaultExtraPrice ? parseFloat(defaultExtraPrice) : null,
        isPublic: isPublic ?? true,
        isPopular: isPopular ?? false,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        status: 'active',
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        introText: introText || null,
        fullDescription: fullDescription || null,
      },
    });

    revalidatePath('/admin/services');
    revalidatePath('/services');
    return NextResponse.json({ success: true, data: { service } });
  } catch (error: unknown) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 },
    );
  }
}
