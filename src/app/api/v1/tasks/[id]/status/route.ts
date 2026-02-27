// TASK STATUS UPDATE API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { newStatus } = body;
    
    const task = await prisma.task.findUnique({
      where: { id: params.id }
    });
    
    if (!task) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' }
      }, { status: 404 });
    }
    
    const updated = await prisma.task.update({
      where: { id: params.id },
      data: { status: newStatus, updatedAt: new Date() }
    });
    
    return NextResponse.json({
      success: true,
      data: { task: updated }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
