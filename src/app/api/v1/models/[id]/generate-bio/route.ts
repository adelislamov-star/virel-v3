import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

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
    const model = await prisma.model.findUnique({
      where: { id },
      include: { stats: true },
    });
    if (!model) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Model not found' } },
        { status: 404 },
      );
    }

    const { name, tagline, education } = model;
    const nationality = model.stats?.nationality;
    const age = model.stats?.age;
    const languages = model.stats?.languages;

    const prompt = `Write a sophisticated, glamorous companion profile bio for ${name}.
${nationality ? `${nationality}, ` : ''}${age ? `${age} years old. ` : ''}${tagline ? `${tagline}. ` : ''}
${languages?.length ? `Languages: ${languages.join(', ')}. ` : ''}
${education ? `Education: ${education}. ` : ''}
150-200 words. Warm, intriguing, luxury tone. Never explicit. First person optional.
Return ONLY valid JSON, no markdown:
{
  "bio": "string (150-200 words)",
  "tagline": "string (3-6 words, evocative, luxury)"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
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

    await prisma.model.update({
      where: { id },
      data: { notesInternal: parsed.bio, tagline: parsed.tagline },
    });

    return NextResponse.json({ success: true, data: { bio: parsed.bio, tagline: parsed.tagline } });
  } catch (error) {
    console.error('[models/[id]/generate-bio]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
