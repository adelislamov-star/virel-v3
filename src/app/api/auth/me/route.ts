// GET /api/auth/me — returns current authenticated user
import { NextRequest, NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const actor = await getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
      roles: actor.roles,
    },
  });
}
