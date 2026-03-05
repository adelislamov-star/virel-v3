const SPECIAL_TYPES = ['extra_hour', 'extra', 'overnight', 'overnight_9h'];

export function sortRates<T extends { duration_type: string }>(rates: T[]): T[] {
  return [...rates].sort((a, b) => {
    const aIsSpecial = SPECIAL_TYPES.includes(a.duration_type);
    const bIsSpecial = SPECIAL_TYPES.includes(b.duration_type);

    if (aIsSpecial && !bIsSpecial) return 1;
    if (!aIsSpecial && bIsSpecial) return -1;
    if (aIsSpecial && bIsSpecial) return 0;

    return durationMinutes(a.duration_type) - durationMinutes(b.duration_type);
  });
}

function durationMinutes(d: string): number {
  const n = parseInt(d, 10);
  if (!isNaN(n)) return n;
  const map: Record<string, number> = {
    '30min': 30, '45min': 45, '1hour': 60, '90min': 90,
    '2hours': 120, '3hours': 180, '4hours': 240,
    '5hours': 300, '6hours': 360, '8hours': 480,
  };
  return map[d] ?? 9999;
}
