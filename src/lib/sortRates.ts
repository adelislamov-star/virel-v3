import { durationLabel } from './durationLabel';

// Order value for special types — extra_hour before overnight
const SPECIAL_ORDER: Record<string, number> = {
  'extra_hour': 9000,
  'extra': 9000,
  'overnight': 9500,
  'overnight_9h': 9500,
};

export function sortRates<T extends { duration_type: string }>(rates: T[]): T[] {
  return [...rates].sort((a, b) => {
    return durationMinutes(a.duration_type) - durationMinutes(b.duration_type);
  });
}

/**
 * Deduplicate rates that map to the same display label.
 * When overnight + overnight_9h both exist, keeps the higher-priced one.
 * Works on the sorted unique-duration list used for table rows / dropdown options.
 */
export function deduplicateByLabel<T extends { duration_type: string }>(
  items: T[],
  getPrice?: (item: T) => number,
): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const label = durationLabel(item.duration_type);
    const existing = seen.get(label);
    if (!existing) {
      seen.set(label, item);
    } else if (getPrice) {
      // Keep the one with higher price
      if (getPrice(item) > getPrice(existing)) {
        seen.set(label, item);
      }
    }
    // If no getPrice, keep first (already sorted)
  }
  return Array.from(seen.values());
}

function durationMinutes(d: string): number {
  if (SPECIAL_ORDER[d] !== undefined) return SPECIAL_ORDER[d];
  const n = parseInt(d, 10);
  if (!isNaN(n)) return n;
  const map: Record<string, number> = {
    '30min': 30, '45min': 45, '1hour': 60, '90min': 90,
    '2hours': 120, '3hours': 180, '4hours': 240,
    '5hours': 300, '6hours': 360, '8hours': 480,
  };
  return map[d] ?? 9999;
}
