import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const hairColor = searchParams.get('hairColor');
    const nationality = searchParams.get('nationality');
    const districtId = searchParams.get('districtId');
    const serviceId = searchParams.get('serviceId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');

    const where: Prisma.ModelWhereInput = {
      status: 'active',
      deletedAt: null,
    };

    // Stats filters
    const statsFilter: Prisma.ModelStatsWhereInput = {};
    if (hairColor) statsFilter.hairColour = { contains: hairColor, mode: 'insensitive' };
    if (nationality) statsFilter.nationality = nationality;
    if (ageMin || ageMax) {
      statsFilter.age = {};
      if (ageMin) statsFilter.age.gte = parseInt(ageMin);
      if (ageMax) statsFilter.age.lte = parseInt(ageMax);
    }
    if (Object.keys(statsFilter).length > 0) where.stats = statsFilter;

    if (districtId) where.modelLocations = { some: { districtId } };
    if (serviceId) where.services = { some: { serviceId } };

    const [models, total] = await Promise.all([
      prisma.model.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
          availability: true,
          isVerified: true,
          isExclusive: true,
          publicTags: true,
          createdAt: true,
          stats: { select: { age: true, height: true, nationality: true, hairColour: true } },
          modelRates: {
            select: { incallPrice: true },
            orderBy: { incallPrice: 'asc' },
            take: 1,
          },
          modelLocations: {
            include: { district: { select: { name: true, slug: true } } },
          },
          media: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
        orderBy: [
          { isExclusive: 'desc' },
          { isVerified: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.model.count({ where }),
    ]);

    // Filter by price after query (Prisma doesn't support nested relation price filters easily)
    let filtered = models;
    if (minPrice) {
      filtered = filtered.filter((m) =>
        m.modelRates.length > 0 && m.modelRates[0].incallPrice! >= parseFloat(minPrice),
      );
    }
    if (maxPrice) {
      filtered = filtered.filter((m) =>
        m.modelRates.length > 0 && m.modelRates[0].incallPrice! <= parseFloat(maxPrice),
      );
    }

    const data = filtered.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      tagline: m.tagline,
      availability: m.availability,
      isVerified: m.isVerified,
      isExclusive: m.isExclusive,
      publicTags: m.publicTags,
      age: m.stats?.age,
      height: m.stats?.height,
      nationality: m.stats?.nationality,
      hairColor: m.stats?.hairColour,
      coverPhotoUrl: m.media[0]?.url ?? null,
      startingPrice: m.modelRates[0]?.incallPrice ?? null,
      districts: m.modelLocations.map((ml) => ml.district),
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[public/models GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
