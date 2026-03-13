// CRON AUTH — Bearer token verification for Vercel Cron Jobs
import { NextRequest, NextResponse } from 'next/server';

export function verifyCronRequest(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null; // dev mode — skip

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 },
    );
  }
  return null;
}
