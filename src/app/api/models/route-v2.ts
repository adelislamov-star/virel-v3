import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

// Validation schema
const modelSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().int().min(18).max(60),
  nationality: z.string().min(2),
  location: z.array(z.string()).min(1),
  height: z.number().int().min(150).max(200),
  weight: z.number().int().min(40).max(100),
  hairColor: z.string(),
  eyeColor: z.string(),
  breastSize: z.string(),
  dress: z.string().optional(),
  shoe: z.number().int().optional(),
  description: z.string().min(1500), // Min 1500 words for SEO
  languages: z.array(z.string()).min(1),
  services: z.any(),
  photos: z.array(z.string()).min(3),
  videos: z.array(z.string()).optional(),
  coverPhoto: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  faqJson: z.any().optional(),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
  priority: z.number().int().default(0),
})

// Generate SEO-friendly slug
function generateSlug(name: string, existingSlugs: string[]): string {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  
  let slug = baseSlug
  let counter = 1
  
  // Ensure uniqueness
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

// GET - List all models with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const location = searchParams.get('location')
    const ageMin = searchParams.get('age_min')
    const ageMax = searchParams.get('age_max')
    const hairColor = searchParams.get('hair')
    const nationality = searchParams.get('nationality')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: any = {}
    
    if (status) where.status = status
    if (featured) where.featured = featured === 'true'
    if (location) where.location = { has: location }
    if (hairColor) where.hairColor = hairColor
    if (nationality) where.nationality = nationality
    if (ageMin || ageMax) {
      where.age = {}
      if (ageMin) where.age.gte = parseInt(ageMin)
      if (ageMax) where.age.lte = parseInt(ageMax)
    }
    
    const [models, total] = await Promise.all([
      prisma.model.findMany({
        where,
        orderBy: [
          { featured: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.model.count({ where }),
    ])
    
    return NextResponse.json({ 
      models,
      total,
      limit,
      offset,
    })
    
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new model
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // if (!isAdmin(request)) return unauthorized
    
    const body = await request.json()
    const validatedData = modelSchema.parse(body)
    
    // Get existing slugs
    const existingModels = await prisma.model.findMany({
      select: { slug: true },
    })
    const existingSlugs = existingModels.map(m => m.slug)
    
    // Generate unique slug
    const slug = generateSlug(validatedData.name, existingSlugs)
    
    // Auto-generate meta if not provided
    const metaTitle = validatedData.metaTitle || 
      `${validatedData.name} – ${validatedData.location[0]} Companion | Virel London`
    
    const metaDescription = validatedData.metaDescription ||
      `Meet ${validatedData.name}, ${validatedData.age} year old ${validatedData.nationality} companion in ${validatedData.location.join(', ')}. Verified, sophisticated, discreet.`
    
    // Create model
    const model = await prisma.model.create({
      data: {
        ...validatedData,
        slug,
        metaTitle,
        metaDescription,
        status: 'DRAFT',
      },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'model_created',
        entityType: 'Model',
        entityId: model.id,
        changes: { created: model },
      },
    })
    
    return NextResponse.json({ model }, { status: 201 })
    
  } catch (error) {
    console.error('Model creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update model
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, slug: newSlug, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    // Get existing model
    const existing = await prisma.model.findUnique({
      where: { id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }
    
    // Handle slug change (create redirect)
    if (newSlug && newSlug !== existing.slug) {
      // Check if new slug is available
      const slugTaken = await prisma.model.findUnique({
        where: { slug: newSlug },
      })
      
      if (slugTaken) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 400 }
        )
      }
      
      // Create 301 redirect
      await prisma.redirect.create({
        data: {
          fromPath: `/catalog/${existing.slug}`,
          toPath: `/catalog/${newSlug}`,
          statusCode: 301,
        },
      })
      
      updateData.slug = newSlug
    }
    
    // Update model
    const updated = await prisma.model.update({
      where: { id },
      data: updateData,
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'model_updated',
        entityType: 'Model',
        entityId: id,
        changes: {
          before: existing,
          after: updated,
        },
      },
    })
    
    return NextResponse.json({ model: updated })
    
  } catch (error) {
    console.error('Model update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update model status
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID and action are required' },
        { status: 400 }
      )
    }
    
    const statusMap: any = {
      'publish': 'ACTIVE',
      'archive': 'ARCHIVED',
      'holiday': 'ON_HOLIDAY',
      'draft': 'DRAFT',
    }
    
    const newStatus = statusMap[action]
    
    if (!newStatus) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
    
    const updated = await prisma.model.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt: newStatus === 'ACTIVE' ? new Date() : null,
      },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: `model_${action}`,
        entityType: 'Model',
        entityId: id,
      },
    })
    
    return NextResponse.json({ model: updated })
    
  } catch (error) {
    console.error('Model status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete model (archive)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    // Soft delete by archiving
    const updated = await prisma.model.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'model_deleted',
        entityType: 'Model',
        entityId: id,
      },
    })
    
    return NextResponse.json({ success: true, model: updated })
    
  } catch (error) {
    console.error('Model deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
