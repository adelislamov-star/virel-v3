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

export interface ModelRateEntry {
  id: string;
  modelId: string;
  callRateMasterId: string;
  callRateMaster: { label: string; durationMin: number; sortOrder: number };
  incallPrice: number | null;
  outcallPrice: number | null;
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

export interface CallRateMaster {
  id: string;
  label: string;
  durationMin: number;
  sortOrder: number;
  isActive: boolean;
}

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
  visibility: string;
  coverPhotoUrl?: string | null;
}
