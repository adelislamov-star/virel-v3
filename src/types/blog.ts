export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  authorName: string | null;
  relatedDistricts: string[];
  relatedServices: string[];
  createdAt: string;
  updatedAt: string;
}
