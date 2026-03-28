export interface ModelPhysicalStats {
  weight: number | null;
  bustSize: string | null;
  bustType: string | null;
  eyeColor: string | null;
  measurements: string | null;
  smokingStatus: string | null;
  tattooStatus: string | null;
  piercingDetails: string[] | null;
  orientation: string | null;
  languages: string[];
  education: string | null;
  travel: string | null;
}

export interface ModelMarketing {
  tagline: string | null;
  availability: string | null;
  publicTags: string[];
  duoPartnerIds: string[];
  responseTimeMin: number | null;
  isExclusive: boolean;
  isVerified: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AvailabilitySlot {
  id: string;
  modelId: string;
  startAt: string;
  endAt: string;
  status: string;
  source: string;
  notes?: string | null;
  city?: string | null;
  area?: string | null;
}

export type DurationType =
  | '30min' | '45min' | '1hour' | '90min'
  | '2hours' | '3hours' | '4hours' | '5hours'
  | '6hours' | '8hours' | 'overnight' | 'extra_hour';

export type CallType = 'incall' | 'outcall';

export interface ModelRateEntry {
  id: string;
  modelId: string;
  durationType: DurationType;
  callType: CallType;
  price: number;
  taxiFee: number | null;
  currency: string;
}

export interface ModelServiceEntry {
  modelId: string;
  serviceId: string;
  isEnabled: boolean;
  isExtra: boolean;
  extraPrice: number | null;
  service: {
    id: string;
    title: string;
    name: string | null;
    publicName: string | null;
    category: string;
    isPublic: boolean;
  };
}

export interface ModelLocationEntry {
  modelId: string;
  districtId: string;
  isPrimary: boolean;
  transportHubId: string | null;
  walkingMinutes: number | null;
  district: { id: string; name: string; slug: string; tier: number };
}

// CallRateMaster removed — model_rates is now the single source of truth

export interface DistrictOption {
  id: string;
  name: string;
  slug: string;
  tier: number;
  isActive: boolean;
}

export interface TransportHubOption {
  id: string;
  name: string;
  slug: string;
  districtId: string;
  walkingMinutes: number;
  isActive: boolean;
}

export interface ServiceCatalogItem {
  id: string;
  title: string;
  name: string | null;
  publicName: string | null;
  slug: string;
  category: string;
  isPublic: boolean;
  isPopular: boolean;
  hasExtraPrice: boolean;
}

export interface ModelBasic {
  id: string;
  name: string;
  slug: string;
  publicCode: string;
  status: string;
  coverPhotoUrl?: string | null;
}
