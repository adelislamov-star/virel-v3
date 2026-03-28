import type { DurationType } from '@/types/model';

export interface DurationOption {
  key: DurationType;
  label: string;
  sortOrder: number;
  durationMin: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { key: '30min',      label: '30 Minutes',      sortOrder: 1,  durationMin: 30 },
  { key: '45min',      label: '45 Minutes',      sortOrder: 2,  durationMin: 45 },
  { key: '1hour',      label: '1 Hour',           sortOrder: 3,  durationMin: 60 },
  { key: '90min',      label: '90 Minutes',      sortOrder: 4,  durationMin: 90 },
  { key: '2hours',     label: '2 Hours',          sortOrder: 5,  durationMin: 120 },
  { key: '3hours',     label: '3 Hours',          sortOrder: 6,  durationMin: 180 },
  { key: '4hours',     label: '4 Hours',          sortOrder: 7,  durationMin: 240 },
  { key: '5hours',     label: '5 Hours',          sortOrder: 8,  durationMin: 300 },
  { key: '6hours',     label: '6 Hours',          sortOrder: 9,  durationMin: 360 },
  { key: '8hours',     label: '8 Hours',          sortOrder: 10, durationMin: 480 },
  { key: 'overnight',  label: 'Overnight (9 hrs)', sortOrder: 11, durationMin: 540 },
  { key: 'extra_hour', label: 'Extra Hour',       sortOrder: 12, durationMin: 60 },
];

export const DURATION_MAP = new Map(DURATION_OPTIONS.map(d => [d.key, d]));

export function getDurationLabel(key: string): string {
  return DURATION_MAP.get(key as DurationType)?.label ?? key;
}

export function getDurationSortOrder(key: string): number {
  return DURATION_MAP.get(key as DurationType)?.sortOrder ?? 99;
}

export function getDurationMin(key: string): number {
  return DURATION_MAP.get(key as DurationType)?.durationMin ?? 60;
}
