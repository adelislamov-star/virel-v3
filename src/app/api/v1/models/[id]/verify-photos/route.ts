import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit';
import { requireRole, isActor } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const { id } = await params;
    const { profilePhotoUrl, selfiePhotoUrl } = await request.json();

    if (!profilePhotoUrl || !selfiePhotoUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Both photo URLs are required' } },
        { status: 400 },
      );
    }

    const prompt = `You are a photo verification system for a companion agency.
Compare these two photos and determine if they show the same person.
Analyze: facial features, bone structure, distinguishing marks.
Return ONLY valid JSON:
{
  "isVerified": boolean,
  "confidence": number (0-100),
  "note": "string (brief explanation)"
}`;

    const [profileRes, selfieRes] = await Promise.all([
      fetch(profilePhotoUrl).then((r) => r.arrayBuffer()),
      fetch(selfiePhotoUrl).then((r) => r.arrayBuffer()),
    ]);

    const profileB64 = Buffer.from(profileRes).toString('base64');
    const selfieB64 = Buffer.from(selfieRes).toString('base64');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: profileB64 } },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: selfieB64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Invalid AI response');
      parsed = JSON.parse(match[0]);
    }

    if (parsed.isVerified) {
      await prisma.model.update({
        where: { id },
        data: { isVerified: true, verificationNote: parsed.note },
      });

      logAudit({
        action: 'VERIFY_PHOTOS',
        entityType: 'Model',
        entityId: id,
        after: { isVerified: true, confidence: parsed.confidence },
        req: request,
      });
    }

    return NextResponse.json({
      success: true,
      data: { isVerified: parsed.isVerified, confidence: parsed.confidence, note: parsed.note },
    });
  } catch (error) {
    console.error('[models/[id]/verify-photos]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
