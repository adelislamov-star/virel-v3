import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const VALID_STATUSES = ['new', 'reviewing', 'approved', 'rejected']

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await request.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  // @ts-ignore
  const app = await (prisma as any).modelApplication.update({
    where: { id: params.id },
    data: { status, updatedAt: new Date() },
  })
  return NextResponse.json({ success: true, status: app.status })
}
