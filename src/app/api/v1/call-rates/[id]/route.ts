import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// CallRateMaster management is no longer needed — durations are hardcoded constants.
// These endpoints are kept as stubs for backward compatibility.

export async function PUT() {
  return NextResponse.json(
    { success: false, error: { code: 'DEPRECATED', message: 'CallRateMaster management is deprecated. Durations are now constants.' } },
    { status: 410 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: { code: 'DEPRECATED', message: 'CallRateMaster management is deprecated. Durations are now constants.' } },
    { status: 410 },
  );
}
