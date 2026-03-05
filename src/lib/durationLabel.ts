const LABEL_MAP: Record<string, string> = {
  '30': '30 minutes',
  '45': '45 minutes',
  '60': '1 hour',
  '90': '1.5 hours',
  '120': '2 hours',
  '150': '2.5 hours',
  '180': '3 hours',
  '240': '4 hours',
  '300': '5 hours',
  '360': '6 hours',
  '480': '8 hours',
  '540': 'Overnight',
  '30min': '30 minutes',
  '45min': '45 minutes',
  '1hour': '1 hour',
  '90min': '1.5 hours',
  '2hours': '2 hours',
  '3hours': '3 hours',
  '4hours': '4 hours',
  '5hours': '5 hours',
  '6hours': '6 hours',
  '8hours': '8 hours',
  'overnight': 'Overnight',
  'overnight_9h': 'Overnight',
  'extra_hour': 'Extra hour',
  'extra': 'Extra hour',
};

export function durationLabel(duration: number | string): string {
  return LABEL_MAP[String(duration)] ?? String(duration);
}
