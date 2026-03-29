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

    const prompt = `You are a senior SEO content strategist specializing in luxury companion agencies in London. You have deep knowledge of how high-intent clients search for escort services online.

AGENCY CONTEXT:
- Name: Vaurel
- Position: London's most discreet premium companion agency
- USPs: personally verified companions, 15-min response, available 24/7, from £300/hr
- Tone: sophisticated, understated luxury, never explicit — think Tatler magazine meets private members club

SERVICE:
- Internal name: "${name}"
- Public display name: "${publicName}"
- Category: "${category}"

MANDATORY KEYWORD INCLUSIONS (use naturally):
- "${name} London" — minimum 3 times across all texts
- "${name} escort London" — minimum 2 times
- "Vaurel" — minimum 2 times
- "discreet" or "discretion" — minimum 1 time
- Price reference "from £300" — minimum 1 time

CONTENT RULES:
seoTitle: MAX 55 chars, NO "| Vaurel" at the end (added automatically), format "[Service] London | [benefit]", must include "London", must be click-worthy
seoDescription: MAX 150 chars, first 60 chars must hook, include soft CTA ("book"/"arrange"/"discover"), include "London" and service name
seoKeywords: 8-10 real search terms, mix head terms and long-tail, include price-related and location variants
introText: EXACTLY 80-100 words. First sentence: direct definition. Second paragraph: who it's for and what makes Vaurel exceptional. Must feel written by a genuine expert.
fullDescription: EXACTLY 450-500 words structured as:
  - Para 1 (~80w): What the service is — direct, informative
  - Para 2 (~100w): The Vaurel difference — verification, companion quality
  - Para 3 (~100w): The experience — how booking works, discretion, communication
  - Para 4 (~80w): Locations and availability across London
  - Para 5 (~80w): Pricing and booking — include "from £300", mention 24/7
  - Para 6 (~60w): Soft closing CTA — no hard sell

STRICT RULES:
- NEVER use explicit sexual language
- NEVER use words: sexual, erotic acts, intimate acts
- DO use: companionship, connection, sophisticated, exclusive, curated, arrangement
- Every paragraph must contain the service name or a clear synonym
- Write as if Tatler or GQ would publish this

Return ONLY valid JSON, no markdown, no explanation:
{
  "seoTitle": "",
  "seoDescription": "",
  "seoKeywords": "",
  "introText": "",
  "fullDescription": ""
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

    // Validate keyword presence
    const fullText = `${parsed.introText} ${parsed.fullDescription}`.toLowerCase()
    const serviceLower = name.toLowerCase()
    const londonMentions = (fullText.match(new RegExp(`${serviceLower}.*london|london.*${serviceLower}`, 'g')) || []).length
    const vaurelMentions = (fullText.match(/vaurel/g) || []).length

    const qualityScore = {
      londonKeyword: londonMentions >= 2,
      vaurelMentions: vaurelMentions >= 2,
      introLength: parsed.introText?.split(' ').length >= 70,
      descLength: parsed.fullDescription?.split(' ').length >= 400,
      hasPrice: fullText.includes('300') || fullText.includes('£'),
      hasDiscreet: fullText.includes('discreet') || fullText.includes('discretion'),
    }
    const score = Object.values(qualityScore).filter(Boolean).length

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

    return NextResponse.json({
      success: true,
      data: updated,
      quality: { score, maxScore: 6, checks: qualityScore }
    });
  } catch (error) {
    console.error('[services/[id]/generate-seo]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
