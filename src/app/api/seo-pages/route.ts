import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

// Validation schema — mapped to SEOPage model fields
const seoPageSchema = z.object({
  pageType: z.string(), // model_profile, geo_page, blog_post, service_page
  path: z.string().startsWith('/'),
  title: z.string().min(10).max(60),
  metaDescription: z.string().min(50).max(160),
  indexStatus: z.enum(['indexed', 'not_indexed', 'blocked']).default('indexed'),
  canonicalUrl: z.string().optional(),
  schemaMarkup: z.any().optional(),
})

// GET - List all SEO pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const isPublished = searchParams.get('published')
    
    const pages = await prisma.sEOPage.findMany({
      where: {
        ...(type && { pageType: type }),
        ...(isPublished && { indexStatus: isPublished === 'true' ? 'indexed' : 'not_indexed' }),
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
    
    // Check if path already exists
    const existing = await prisma.sEOPage.findUnique({
      where: { path: validatedData.path },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Path already exists' },
        { status: 400 }
      )
    }
    
    // Create page
    const page = await prisma.sEOPage.create({
      data: validatedData,
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'seo_page_created',
        entityType: 'SEOPage',
        entityId: page.id,
        after: { created: validatedData },
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
    const existing = await prisma.sEOPage.findUnique({
      where: { id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }
    
    // Update page
    const updated = await prisma.sEOPage.update({
      where: { id },
      data: updateData,
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'seo_page_updated',
        entityType: 'SEOPage',
        entityId: id,
        before: existing,
        after: updated,
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

    const updated = await prisma.sEOPage.update({
      where: { id },
      data: {
        indexStatus: isPublished ? 'indexed' : 'not_indexed',
      },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: isPublished ? 'seo_page_published' : 'seo_page_unpublished',
        entityType: 'SEOPage',
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
    
    await prisma.sEOPage.delete({
      where: { id },
    })
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'seo_page_deleted',
        entityType: 'SEOPage',
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
