import { NextResponse } from 'next/server';
import { DURATION_OPTIONS } from '@/lib/duration-constants';

export const runtime = 'nodejs';

// Returns available duration options (replaces the old CallRateMaster table)
export async function GET() {
  try {
    const data = DURATION_OPTIONS.map(d => ({
      id: d.key,
      label: d.label,
      durationMin: d.durationMin,
      sortOrder: d.sortOrder,
      isActive: true,
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[call-rates GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
