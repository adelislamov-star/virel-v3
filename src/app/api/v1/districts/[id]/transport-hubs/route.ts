import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { toSlug } from '@/lib/slug';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const hubs = await prisma.transportHub.findMany({
      where: { districtId: id },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: hubs });
  } catch (error) {
    console.error('[transport-hubs GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const { name, slug, walkingMinutes, description, seoTitle, seoDescription } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'name is required' } },
        { status: 400 },
      );
    }

    const hub = await prisma.transportHub.create({
      data: {
        name,
        slug: slug || toSlug(name),
        districtId: id,
        walkingMinutes: walkingMinutes ?? 5,
        description: description ?? null,
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'TransportHub',
      entityId: hub.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: hub });
  } catch (error) {
    console.error('[transport-hubs POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
