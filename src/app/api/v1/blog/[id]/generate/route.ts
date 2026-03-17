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
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 },
      );
    }

    const { title, category, relatedDistricts, relatedServices } = post;

    const prompt = `You are a luxury lifestyle content writer for Vaurel, a premier companion agency in London.
Write a sophisticated, engaging blog post about: "${title}"
Category: ${category}
${relatedDistricts.length ? `Related London areas: ${relatedDistricts.join(', ')}` : ''}
${relatedServices.length ? `Related services: ${relatedServices.join(', ')}` : ''}

Requirements:
- 600-800 words
- Luxury, editorial tone (think Condé Nast, not tabloid)
- Include practical London-specific insights
- Natural internal linking opportunities (mention districts and services naturally)
- Never explicit, always tasteful and sophisticated
- End with a subtle call to action

Return ONLY valid JSON, no markdown:
{
  "title": "string (refined title)",
  "excerpt": "string (2-3 sentences summary)",
  "content": "string (full article in markdown format)"
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
        max_tokens: 2000,
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

    // Do NOT auto-save — return for editor review
    return NextResponse.json({
      success: true,
      data: { title: parsed.title, excerpt: parsed.excerpt, content: parsed.content },
    });
  } catch (error) {
    console.error('[blog/[id]/generate]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
