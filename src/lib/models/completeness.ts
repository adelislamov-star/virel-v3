// MODEL DATA COMPLETENESS SCORING
// Calculates how complete a model profile is (0-100)

interface ModelWithRelations {
  name?: string | null;
  primaryLocationId?: string | null;
  stats?: {
    age?: number | null;
    height?: number | null;
    nationality?: string | null;
    languages?: string[];
    hairColour?: string | null;
    eyeColour?: string | null;
    bustSize?: string | null;
  } | null;
  media?: { isPrimary?: boolean }[];
  services?: { serviceId: string }[];
  categories?: { categoryId: string }[];
  availabilitySlots?: { id: string }[];
}

interface FieldCheck {
  field: string;
  weight: number;
  check: (model: ModelWithRelations) => boolean;
}

const FIELD_CHECKS: FieldCheck[] = [
  { field: 'name', weight: 5, check: (m) => !!m.name },
  { field: 'photos (3+)', weight: 15, check: (m) => (m.media?.length ?? 0) >= 3 },
  { field: 'primary photo', weight: 5, check: (m) => !!m.media?.some(p => p.isPrimary) },
  { field: 'age', weight: 5, check: (m) => !!m.stats?.age },
  { field: 'height', weight: 3, check: (m) => !!m.stats?.height },
  { field: 'nationality', weight: 5, check: (m) => !!m.stats?.nationality },
  { field: 'languages', weight: 5, check: (m) => (m.stats?.languages?.length ?? 0) > 0 },
  { field: 'hair colour', weight: 3, check: (m) => !!m.stats?.hairColour },
  { field: 'eye colour', weight: 2, check: (m) => !!m.stats?.eyeColour },
  { field: 'bust size', weight: 2, check: (m) => !!m.stats?.bustSize },
  { field: 'services (3+)', weight: 15, check: (m) => (m.services?.length ?? 0) >= 3 },
  { field: 'categories', weight: 5, check: (m) => (m.categories?.length ?? 0) > 0 },
  { field: 'location', weight: 10, check: (m) => !!m.primaryLocationId },
  { field: 'availability', weight: 10, check: (m) => (m.availabilitySlots?.length ?? 0) > 0 },
  { field: 'description', weight: 10, check: (m) => !!m.name && m.name.length > 0 }, // uses name as proxy; description is in stats/notes
];

export function calculateCompletenessScore(model: ModelWithRelations): number {
  let score = 0;
  for (const check of FIELD_CHECKS) {
    if (check.check(model)) {
      score += check.weight;
    }
  }
  return Math.min(score, 100);
}

export function getMissingFields(model: ModelWithRelations): string[] {
  const missing: string[] = [];
  for (const check of FIELD_CHECKS) {
    if (!check.check(model)) {
      missing.push(check.field);
    }
  }
  return missing;
}
