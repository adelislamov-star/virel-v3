import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
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
    const district = await prisma.district.findUnique({ where: { id } });
    if (!district) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'District not found' } },
        { status: 404 },
      );
    }

    const { name, hotels, restaurants, landmarks } = district;

    const prompt = `Write a sophisticated, SEO-optimized description for luxury companions in ${name}, London.
Include references to the atmosphere, notable hotels (${hotels.join(', ')}),
restaurants (${restaurants.join(', ')}), landmarks (${landmarks.join(', ')}), and transport links.
300-400 words. Tasteful, luxury tone. Never explicit. Professional.
Return ONLY valid JSON, no markdown:
{
  "seoTitle": "string (max 60 chars)",
  "seoDescription": "string (max 155 chars)",
  "seoKeywords": "string (5-8 keywords)",
  "description": "string (300-400 words)"
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

    const updated = await prisma.district.update({
      where: { id },
      data: {
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        seoKeywords: parsed.seoKeywords,
        description: parsed.description,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[districts/[id]/generate-seo]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
