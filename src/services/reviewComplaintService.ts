// REVIEW COMPLAINT SERVICE
// Extract complaint patterns from reviews

import { prisma } from '@/lib/db/client';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'she', 'him', 'her', 'his',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'how',
  'not', 'no', 'nor', 'very', 'just', 'so', 'too', 'also', 'than',
  'then', 'if', 'as', 'because', 'about', 'up', 'out', 'all', 'some',
  'any', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'there', 'here', 'when', 'where',
]);

// ── Rebuild Complaint Patterns ──────────────────────────────
export async function rebuildComplaintPatterns(modelId: string) {
  const now = new Date();
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days

  // Get approved reviews with low ratings (1-3)
  const reviews = await prisma.review.findMany({
    where: {
      modelId,
      status: 'approved',
      rating: { lte: 3 },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { text: true },
  });

  // Extract keywords
  const freqMap = new Map<string, number>();

  for (const review of reviews) {
    if (!review.text) continue;

    const words = review.text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !STOPWORDS.has(w));

    const unique = new Set(words); // count per review, not per occurrence
    for (const word of unique) {
      freqMap.set(word, (freqMap.get(word) || 0) + 1);
    }
  }

  // Filter: at least 2 mentions
  const significantKeywords = Array.from(freqMap.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30); // top 30

  // Delete old patterns for this model and period
  await prisma.reviewComplaintPattern.deleteMany({
    where: { modelId, periodStart, periodEnd },
  });

  // Create new patterns
  const patterns = [];
  for (const [keyword, count] of significantKeywords) {
    const pattern = await prisma.reviewComplaintPattern.create({
      data: { modelId, keyword: keyword as string, count: count as number, periodStart, periodEnd },
    });
    patterns.push(pattern);
  }

  return { modelId, patternsCreated: patterns.length, periodStart, periodEnd };
}
