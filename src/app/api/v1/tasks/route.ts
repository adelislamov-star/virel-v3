// TASKS API v1
// GET /api/v1/tasks - List tasks (Action Center)
// POST /api/v1/tasks - Create task
// POST /api/v1/tasks/[id]/status - Update task status
// POST /api/v1/tasks/[id]/assign - Assign task

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List tasks (for Action Center)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const priority = searchParams.get('priority');
    const entityType = searchParams.get('entity_type');
    const slaBreached = searchParams.get('sla_breached') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;
    if (entityType) where.entityType = entityType;
    
    // SLA breached filter
    if (slaBreached) {
      where.slaDeadlineAt = {
        lt: new Date() // Deadline passed
      };
      where.status = {
        notIn: ['done', 'cancelled']
      };
    }
    
    // Query
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          // SLA breached first
          { slaDeadlineAt: 'asc' },
          // Then by priority
          { priority: 'desc' },
          // Then by creation time
          { createdAt: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.task.count({ where })
    ]);
    
    // Calculate if SLA breached for each task
    const now = new Date();
    const tasksWithSLA = tasks.map(task => ({
      ...task,
      slaBreached: task.slaDeadlineAt ? task.slaDeadlineAt < now : false,
      slaMinutesRemaining: task.slaDeadlineAt 
        ? Math.floor((task.slaDeadlineAt.getTime() - now.getTime()) / 60000)
        : null
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksWithSLA,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        summary: {
          totalOpen: await prisma.task.count({ 
            where: { status: 'open' }
          }),
          totalSLABreached: await prisma.task.count({
            where: {
              slaDeadlineAt: { lt: now },
              status: { notIn: ['done', 'cancelled'] }
            }
          }),
          urgentCount: await prisma.task.count({
            where: {
              priority: 'critical',
              status: { notIn: ['done', 'cancelled'] }
            }
          })
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

// POST - Create task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create task
    const task = await prisma.task.create({
      data: {
        type: body.type,
        status: 'open',
        priority: body.priority || 'normal',
        subject: body.subject,
        entityType: body.entityType,
        entityId: body.entityId,
        assignedTo: body.assignedTo,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        slaDeadlineAt: body.slaDeadlineAt ? new Date(body.slaDeadlineAt) : undefined
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Create domain event
    await prisma.domainEvent.create({
      data: {
        eventType: 'task.created',
        entityType: 'task',
        entityId: task.id,
        payload: { task }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { task },
      message: 'Task created successfully'
    }, { status: 201 });
    
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
