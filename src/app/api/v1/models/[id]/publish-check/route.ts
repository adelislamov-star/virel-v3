import { NextRequest, NextResponse } from 'next/server'
import { requireRole, isActor } from '@/lib/auth'
import { auditModelReadiness } from '@/lib/publish-validation'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER'])
    if (!isActor(auth)) return auth

    const { id } = await params
    const result = await auditModelReadiness(id)
    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
