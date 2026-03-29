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

    const buildPrompt = (retryHint?: string) => {
      let p = `You are a senior SEO content strategist specializing in luxury companion agencies in London. You have deep knowledge of how high-intent clients search for escort services online.

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

introText: CRITICAL — MUST be between 80 and 100 words. Count carefully. Not 60, not 70, MINIMUM 80 words. First sentence: direct definition. Second paragraph: who it's for and what makes Vaurel exceptional. Must feel written by a genuine expert. Write 5-6 full sentences to reach 80+ words.

fullDescription: CRITICAL — MUST be between 450 and 500 words. This is a LONG text, approximately 6 substantial paragraphs. Count carefully. Separate paragraphs with double newlines (\\n\\n). Structure:
  - Para 1 (~80w): What the service is — direct, informative, establish expertise
  - Para 2 (~100w): The Vaurel difference — verification process, companion quality, selection standards
  - Para 3 (~100w): The experience — how booking works, discretion protocols, communication channels
  - Para 4 (~80w): Locations and availability across London — mention specific areas like Mayfair, Knightsbridge, Chelsea, Kensington
  - Para 5 (~80w): Pricing and booking — include "from £300", mention 24/7 availability, incall and outcall options
  - Para 6 (~60w): Soft closing CTA — invite to explore, no hard sell, mention the concierge team

STRICT RULES:
- NEVER use explicit sexual language
- NEVER use words: sexual, erotic acts, intimate acts
- DO use: companionship, connection, sophisticated, exclusive, curated, arrangement
- Every paragraph must contain the service name or a clear synonym
- Write as if Tatler or GQ would publish this
- fullDescription MUST use \\n\\n between paragraphs`;

      if (retryHint) {
        p += `\n\nIMPORTANT — YOUR PREVIOUS ATTEMPT FAILED QUALITY CHECKS:\n${retryHint}\nPlease fix these issues. Write MORE content to hit the required word counts.`;
      }

      p += `\n\nReturn ONLY valid JSON, no markdown, no explanation:
{
  "seoTitle": "",
  "seoDescription": "",
  "seoKeywords": "",
  "introText": "",
  "fullDescription": ""
}`;
      return p;
    };

    const callAI = async (prompt: string) => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      try {
        return JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Invalid AI response');
        return JSON.parse(match[0]);
      }
    };

    const evaluate = (parsed: Record<string, string>) => {
      const fullText = `${parsed.introText} ${parsed.fullDescription}`.toLowerCase()
      const serviceLower = name.toLowerCase()
      const londonMentions = (fullText.match(new RegExp(`${serviceLower}.*london|london.*${serviceLower}`, 'g')) || []).length
      const vaurelMentions = (fullText.match(/vaurel/g) || []).length
      const introWords = parsed.introText?.split(/\s+/).filter(Boolean).length ?? 0
      const descWords = parsed.fullDescription?.split(/\s+/).filter(Boolean).length ?? 0

      const checks = {
        londonKeyword: londonMentions >= 2,
        vaurelMentions: vaurelMentions >= 2,
        introLength: introWords >= 80,
        descLength: descWords >= 400,
        hasPrice: fullText.includes('300') || fullText.includes('£'),
        hasDiscreet: fullText.includes('discreet') || fullText.includes('discretion'),
      }
      const score = Object.values(checks).filter(Boolean).length

      const failures: string[] = []
      if (!checks.introLength) failures.push(`introText is ${introWords} words — MUST be at least 80 words`)
      if (!checks.descLength) failures.push(`fullDescription is ${descWords} words — MUST be at least 450 words`)
      if (!checks.londonKeyword) failures.push(`"${name} London" not found enough times`)
      if (!checks.vaurelMentions) failures.push(`"Vaurel" not mentioned enough`)
      if (!checks.hasPrice) failures.push(`No price reference (£300) found`)
      if (!checks.hasDiscreet) failures.push(`No "discreet"/"discretion" found`)

      return { checks, score, failures, introWords, descWords }
    }

    // Try up to 3 times, retrying if word counts fail
    let parsed = await callAI(buildPrompt());
    let result = evaluate(parsed);

    // Retry if intro or description word counts fail (regardless of overall score)
    if (!result.checks.introLength || !result.checks.descLength) {
      parsed = await callAI(buildPrompt(result.failures.join('\n')));
      result = evaluate(parsed);
    }

    if (!result.checks.introLength || !result.checks.descLength) {
      parsed = await callAI(buildPrompt(result.failures.join('\n')));
      result = evaluate(parsed);
    }

    const qualityScore = result.checks;
    const score = result.score;

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
