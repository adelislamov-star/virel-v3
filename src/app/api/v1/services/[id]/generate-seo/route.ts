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
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 },
      );
    }

    const name = service.name || service.title;
    const publicName = service.publicName || name;
    const category = service.category;

    const prompt = `You are an SEO expert for Virel, a luxury companion agency in London.
Generate sophisticated, tasteful, SEO-optimized content for the service: "${name}"
Public name: "${publicName}". Category: "${category}".
Return ONLY valid JSON, no markdown, no explanation:
{
  "seoTitle": "string (max 60 chars, include London)",
  "seoDescription": "string (max 155 chars)",
  "seoKeywords": "string (5-8 comma-separated keywords)",
  "introText": "string (80-100 words, sophisticated tone, never explicit)",
  "fullDescription": "string (400-500 words, SEO-rich, luxury tone, never explicit)"
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

    const updated = await prisma.service.update({
      where: { id },
      data: {
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        seoKeywords: parsed.seoKeywords,
        introText: parsed.introText,
        fullDescription: parsed.fullDescription,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[services/[id]/generate-seo]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
