import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

// GET - List all models with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const ageMin = searchParams.get('ageMin')
    const ageMax = searchParams.get('ageMax')
    const hairColor = searchParams.get('hairColor')
    
    const models = await prisma.model.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(featured && { featured: featured === 'true' }),
        ...(location && { location: { has: location } }),
        ...(ageMin || ageMax ? {
          age: {
            ...(ageMin && { gte: Number(ageMin) }),
            ...(ageMax && { lte: Number(ageMax) }),
          }
        } : {}),
        ...(hairColor && { hairColor }),
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    })
    
    return NextResponse.json({ models })
    
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new model (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Add authentication check here
    // if (!isAdmin(request)) return unauthorized response
    
    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    // Check if slug already exists
    const existing = await prisma.model.findUnique({
      where: { slug },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Model with this name already exists' },
        { status: 400 }
      )
    }
    
    const model = await prisma.model.create({
      data: {
        slug,
        name: body.name,
        age: body.age,
        nationality: body.nationality,
        location: body.location,
        height: body.height,
        weight: body.weight,
        hairColor: body.hairColor,
        eyeColor: body.eyeColor,
        breastSize: body.breastSize,
        description: body.description,
        languages: body.languages,
        services: body.services,
        photos: body.photos,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        status: body.status || 'ACTIVE',
        verified: body.verified || false,
        featured: body.featured || false,
      },
    })
    
    return NextResponse.json({ model }, { status: 201 })
    
  } catch (error) {
    console.error('Model creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
