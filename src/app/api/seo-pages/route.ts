import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

// Validation schema
const seoPageSchema = z.object({
  type: z.enum(['GEO', 'SERVICE', 'ATTRIBUTE']),
  slug: z.string().min(3).max(100),
  url: z.string().startsWith('/'),
  title: z.string().min(10).max(60),
  metaDesc: z.string().min(50).max(160),
  h1: z.string().min(5).max(70),
  content: z.string().min(800), // Min 800 words for SEO
  faqJson: z.any().optional(),
  isIndexable: z.boolean().default(true),
  canonicalOverride: z.string().optional(),
})

// GET - List all SEO pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const isPublished = searchParams.get('published')
    
    const pages = await prisma.sEOWhitelist.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(isPublished && { isPublished: isPublished === 'true' }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ pages })
    
  } catch (error) {
    console.error('SEO pages fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new SEO page
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware
    
    const body = await request.json()
    const validatedData = seoPageSchema.parse(body)
    
    // Check if slug already exists
    const existing = await prisma.sEOWhitelist.findUnique({
      where: { slug: validatedData.slug },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }
    
    // Create page
    const page = await prisma.sEOWhitelist.create({
      data: validatedData,
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'seo_page_created',
        entityType: 'SEOWhitelist',
        entityId: page.id,
        changes: { created: validatedData },
      },
    })
    
    return NextResponse.json({ page }, { status: 201 })
    
  } catch (error) {
    console.error('SEO page creation error:', error)
    
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

// PUT - Update SEO page
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    // Get existing page
    const existing = await prisma.sEOWhitelist.findUnique({
      where: { id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }
    
    // Update page
    const updated = await prisma.sEOWhitelist.update({
      where: { id },
      data: updateData,
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'seo_page_updated',
        entityType: 'SEOWhitelist',
        entityId: id,
        changes: {
          before: existing,
          after: updated,
        },
      },
    })
    
    return NextResponse.json({ page: updated })
    
  } catch (error) {
    console.error('SEO page update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Publish/unpublish SEO page
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
    
    const isPublished = action === 'publish'
    
    const updated = await prisma.sEOWhitelist.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: isPublished ? 'seo_page_published' : 'seo_page_unpublished',
        entityType: 'SEOWhitelist',
        entityId: id,
      },
    })
    
    return NextResponse.json({ page: updated })
    
  } catch (error) {
    console.error('SEO page publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete SEO page
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
    
    await prisma.sEOWhitelist.delete({
      where: { id },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'seo_page_deleted',
        entityType: 'SEOWhitelist',
        entityId: id,
      },
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('SEO page deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
