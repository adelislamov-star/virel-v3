export interface ConciergePartner {
  id: string;
  type: string;
  name: string;
  districtId: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  priceRange: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}
