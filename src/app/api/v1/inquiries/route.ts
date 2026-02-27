// INQUIRIES API v1
// POST /api/v1/inquiries - Create inquiry
// GET /api/v1/inquiries - List inquiries

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import InquiryStateMachine from '@/lib/state-machines/inquiry';

const prisma = new PrismaClient();

// Validation schema
const CreateInquirySchema = z.object({
  source: z.enum(['web', 'telegram', 'whatsapp', 'phone', 'partner']),
  externalRef: z.string().optional(),
  
  // Client info
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  preferredChannel: z.string().optional(),
  
  // Request details
  subject: z.string().optional(),
  message: z.string().optional(),
  requestedLocationId: z.string().optional(),
  requestedServices: z.any().optional(),
  requestedTimeFrom: z.string().datetime().optional(),
  requestedTimeTo: z.string().datetime().optional(),
  
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal')
});

// POST - Create inquiry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateInquirySchema.parse(body);
    
    // Check for duplicate (idempotency)
    if (data.source && data.externalRef) {
      const existing = await prisma.inquiry.findUnique({
        where: {
          source_externalRef: {
            source: data.source,
            externalRef: data.externalRef
          }
        }
      });
      
      if (existing) {
        return NextResponse.json({
          success: true,
          data: { inquiry: existing },
          message: 'Inquiry already exists (idempotent)'
        });
      }
    }
    
    // Create or find client
    let clientId: string | undefined;
    if (data.clientEmail || data.clientPhone) {
      const client = await prisma.client.upsert({
        where: {
          email: data.clientEmail || 'temp_' + Date.now()
        },
        create: {
          fullName: data.clientName,
          email: data.clientEmail,
          phone: data.clientPhone,
          preferredChannel: data.preferredChannel
        },
        update: {
          fullName: data.clientName,
          phone: data.clientPhone || undefined
        }
      });
      clientId = client.id;
    }
    
    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        source: data.source,
        externalRef: data.externalRef,
        clientId,
        status: 'new',
        priority: data.priority,
        subject: data.subject,
        message: data.message,
        requestedLocationId: data.requestedLocationId,
        requestedServices: data.requestedServices,
        requestedTimeFrom: data.requestedTimeFrom ? new Date(data.requestedTimeFrom) : undefined,
        requestedTimeTo: data.requestedTimeTo ? new Date(data.requestedTimeTo) : undefined
      },
      include: {
        client: true,
        requestedLocation: true
      }
    });
    
    // Create domain event
    await prisma.domainEvent.create({
      data: {
        eventType: 'inquiry.created',
        entityType: 'inquiry',
        entityId: inquiry.id,
        payload: { inquiry }
      }
    });
    
    // Create task for operator
    await prisma.task.create({
      data: {
        type: 'review_inquiry',
        status: 'open',
        priority: data.priority,
        subject: `Review inquiry from ${data.source}`,
        entityType: 'inquiry',
        entityId: inquiry.id,
        slaDeadlineAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min SLA
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { inquiry },
      message: 'Inquiry created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
}

// GET - List inquiries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (source) where.source = source;
    
    // Query
    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          client: true,
          requestedLocation: true,
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.inquiry.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
}
