import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { experience, appearance, nationality, budget, district, duration, occasion } = body;

    // Build filters
    const where: Prisma.ModelWhereInput = {
      status: 'active',
      deletedAt: null,
    };

    if (appearance && appearance !== 'any') {
      where.stats = { hairColour: { contains: appearance, mode: 'insensitive' } };
    }
    if (nationality && nationality !== 'any') {
      where.stats = { ...where.stats as object, nationality };
    }
    if (district && district !== 'any') {
      where.modelLocations = { some: { districtId: district } };
    }

    const candidates = await prisma.model.findMany({
      where,
      include: {
        stats: true,
        modelRates: true,
        modelLocations: { include: { district: true } },
        services: { include: { service: true } },
      },
      take: 10,
    });

    // Filter by budget (with 30% margin)
    const filtered = budget
      ? candidates.filter((m) =>
          m.modelRates.some((r) => r.price > 0 && r.price <= budget * 1.3),
        )
      : candidates;

    if (filtered.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const profileSummaries = filtered.map((m) => ({
      id: m.id,
      name: m.name,
      nationality: m.stats?.nationality,
      age: m.stats?.age,
      hairColor: m.stats?.hairColour,
      tagline: m.tagline,
      services: m.services.map((ms) => ms.service.title).join(', '),
      districts: m.modelLocations.map((ml) => ml.district.name).join(', '),
      lowestPrice: m.modelRates.filter((r) => r.price > 0).length > 0 ? Math.min(...m.modelRates.filter((r) => r.price > 0).map((r) => r.price)) : 0,
    }));

    const prompt = `Given these companion profiles and client requirements: ${JSON.stringify({ experience, appearance, nationality, budget, duration, occasion })},
rank the top 3-5 matches and explain why each is perfect.
Profiles: ${JSON.stringify(profileSummaries)}
Return ONLY valid JSON: [{ "modelId": "string", "matchScore": 0-100, "reason": "string (2-3 sentences)" }]`;

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

    const aiData = await response.json();
    const text = aiData.content?.[0]?.text ?? '';

    let rankings;
    try {
      rankings = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Invalid AI response');
      rankings = JSON.parse(match[0]);
    }

    const results = (rankings as { modelId: string; matchScore: number; reason: string }[])
      .map((r) => {
        const model = filtered.find((m) => m.id === r.modelId);
        if (!model) return null;
        return { model, matchScore: r.matchScore, reason: r.reason };
      })
      .filter(Boolean)
      .sort((a, b) => b!.matchScore - a!.matchScore);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[smart-match]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
