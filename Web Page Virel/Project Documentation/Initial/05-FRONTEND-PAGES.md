# 🎨 FRONTEND PAGES

## Документ: Структура страниц и компонентов
**Версия:** 2.0  
**Дата:** 27 февраля 2026

---

## 📚 ОГЛАВЛЕНИЕ

1. [Routing Structure](#routing-structure)
2. [Public Pages](#public-pages)
3. [Admin Pages](#admin-pages)
4. [Components](#components)
5. [SEO Implementation](#seo-implementation)

---

## 1. ROUTING STRUCTURE

### 📁 App Router (Next.js 14):

```
src/app/
├── layout.tsx                          # Root layout
├── page.tsx                            # Homepage
│
├── (public)/                           # Public pages group
│   ├── layout.tsx                      # Public layout
│   ├── london-escorts/
│   │   └── page.tsx                    # Main catalog
│   ├── escorts-in-[district]/
│   │   └── page.tsx                    # GEO pages (9)
│   ├── services/[slug]/
│   │   └── page.tsx                    # SERVICE pages (4)
│   ├── [attribute]-escorts-london/
│   │   └── page.tsx                    # ATTRIBUTE pages (4)
│   ├── catalog/[slug]/
│   │   └── page.tsx                    # Model profile
│   ├── about/
│   │   └── page.tsx                    # About us
│   └── contact/
│       └── page.tsx                    # Contact
│
└── (admin)/                            # Admin pages group
    ├── layout.tsx                      # Admin layout
    ├── admin/
    │   ├── page.tsx                    # Dashboard
    │   ├── models/
    │   │   ├── page.tsx                # Models list
    │   │   ├── [id]/
    │   │   │   └── page.tsx            # Edit model
    │   │   └── new/
    │   │       └── page.tsx            # Create model
    │   ├── bookings/
    │   │   ├── page.tsx                # Bookings list
    │   │   ├── [id]/
    │   │   │   └── page.tsx            # View booking
    │   │   └── new/
    │   │       └── page.tsx            # Create booking
    │   ├── seo-pages/
    │   │   ├── page.tsx                # SEO pages list
    │   │   └── [id]/
    │   │       └── page.tsx            # Edit SEO page
    │   ├── users/
    │   │   └── page.tsx                # Users management
    │   └── settings/
    │       └── page.tsx                # Settings
    │
    └── api/                            # API routes
        ├── models/
        │   └── route.ts
        ├── bookings/
        │   └── route.ts
        └── seo-pages/
            └── route.ts
```

---

## 2. PUBLIC PAGES

### 🏠 Homepage (/)

**File:** `src/app/page.tsx`

**Sections:**
1. Hero section с CTA
2. Featured models (6 карточек)
3. Services overview
4. Location districts (9 районов)
5. FAQ section
6. Footer

**SEO:**
```typescript
export const metadata = {
  title: "Virel | Premium London Escorts",
  description: "Discover elite companions in London's most exclusive districts...",
  openGraph: {
    title: "Virel | Premium London Escorts",
    description: "Elite companions...",
    images: ['/og-image.jpg'],
  },
};
```

**Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Virel",
  "url": "https://virel.com",
  "logo": "https://virel.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+44-20-1234-5678",
    "contactType": "customer service"
  }
}
```

---

### 📋 Main Catalog (/london-escorts)

**File:** `src/app/(public)/london-escorts/page.tsx`

**Features:**
- Filters sidebar (location, services, age, attributes)
- Models grid (12 per page)
- Pagination (SEO-friendly <a> links)
- Sort options (featured, newest, popular)
- SEO content section (800+ words)
- Links to 9 geo-pages

**Dynamic Meta:**
```typescript
export async function generateMetadata({ searchParams }) {
  const filters = searchParams;
  
  // Check if filter combination is whitelisted
  const isWhitelisted = await checkWhitelist(filters);
  
  if (isWhitelisted) {
    return {
      title: "London Escorts | Virel",
      robots: "index, follow",
    };
  } else {
    return {
      title: "London Escorts | Virel",
      robots: "noindex, follow",
      alternates: {
        canonical: "/london-escorts",
      },
    };
  }
}
```

**Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "London Escorts",
  "description": "Browse our exclusive selection...",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://virel.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "London Escorts",
        "item": "https://virel.com/london-escorts"
      }
    ]
  },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [...]
  }
}
```

---

### 📍 GEO Pages (/escorts-in-[district])

**File:** `src/app/(public)/escorts-in-[district]/page.tsx`

**Dynamic Routes:**
- /escorts-in-mayfair
- /escorts-in-kensington
- /escorts-in-knightsbridge
- /escorts-in-chelsea
- /escorts-in-belgravia
- /escorts-in-marylebone
- /escorts-in-westminster
- /escorts-in-soho
- /escorts-in-canary-wharf

**generateStaticParams:**
```typescript
export async function generateStaticParams() {
  const districts = [
    'mayfair', 'kensington', 'knightsbridge',
    'chelsea', 'belgravia', 'marylebone',
    'westminster', 'soho', 'canary-wharf'
  ];
  
  return districts.map(district => ({
    district: district
  }));
}
```

**SEO Logic:**
```typescript
export async function generateMetadata({ params }) {
  const { district } = params;
  
  // Fetch page from SEO whitelist
  const page = await prisma.seoWhitelist.findUnique({
    where: { slug: district, type: 'GEO' }
  });
  
  // Count models serving this district
  const modelCount = await prisma.model.count({
    where: {
      status: 'ACTIVE',
      servesDistricts: { has: district }
    }
  });
  
  // Index only if enough models
  if (modelCount >= page.minModels) {
    return {
      title: page.title,
      description: page.metaDesc,
      robots: "index, follow",
      alternates: {
        canonical: `/escorts-in-${district}`
      }
    };
  } else {
    return {
      title: page.title,
      description: page.metaDesc,
      robots: "noindex, follow",
      alternates: {
        canonical: "/london-escorts"
      }
    };
  }
}
```

**Content Structure:**
```tsx
export default async function DistrictPage({ params }) {
  const { district } = params;
  const page = await getPageContent(district);
  const models = await getModelsForDistrict(district);
  
  return (
    <>
      <h1>{page.h1}</h1>
      
      {/* SEO Content */}
      <article>
        <p>{page.content}</p>
      </article>
      
      {/* Models Grid */}
      <ModelsGrid models={models} />
      
      {/* FAQ Section */}
      <FAQ questions={page.faqJson} />
      
      {/* Related Districts */}
      <RelatedDistricts current={district} />
      
      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify(generateSchema(page, models))}
      </script>
    </>
  );
}
```

---

### 🛎️ SERVICE Pages (/services/[slug])

**File:** `src/app/(public)/services/[slug]/page.tsx`

**Routes:**
- /services/gfe (Girlfriend Experience)
- /services/dinner-date
- /services/travel-companion
- /services/vip

**Similar structure to GEO pages**

---

### 🏷️ ATTRIBUTE Pages

**Files:**
- `/blonde-escorts-london/page.tsx`
- `/brunette-escorts-london/page.tsx`
- `/petite-escorts-london/page.tsx`
- `/vip-escorts-london/page.tsx`

**Direct routes (not dynamic)**

---

### 👤 Model Profile (/catalog/[slug])

**File:** `src/app/(public)/catalog/[slug]/page.tsx`

**Sections:**
1. Profile header (name, location, stats)
2. Image gallery (lightbox)
3. About section (bio, interests)
4. Services & Pricing
5. Availability calendar
6. Booking form
7. Reviews section

**Dynamic Meta:**
```typescript
export async function generateMetadata({ params }) {
  const model = await getModel(params.slug);
  
  return {
    title: `${model.name} | ${model.baseLocation} Escort | Virel`,
    description: model.metaDescription || model.bio.slice(0, 155),
    openGraph: {
      images: [model.profileImage],
    },
    alternates: {
      canonical: `/catalog/${model.slug}`
    }
  };
}
```

**Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Sophia",
    "description": "Sophisticated companion...",
    "image": "https://virel.com/images/sophia.jpg",
    "offers": {
      "@type": "Offer",
      "price": "300",
      "priceCurrency": "GBP"
    }
  }
}
```

---

## 3. ADMIN PAGES

### 📊 Dashboard (/admin)

**File:** `src/app/(admin)/admin/page.tsx`

**Components:**
- Statistics cards (4)
  - Total bookings
  - Pending bookings
  - Total models
  - Today's revenue
- Recent bookings table
- Top performing models
- Action required section
- Quick actions buttons

**Code Example:**
```tsx
export default async function AdminDashboard() {
  const stats = await getStats();
  const recentBookings = await getRecentBookings(10);
  const topModels = await getTopModels(5);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <StatisticsCards stats={stats} />
      
      <div className="grid grid-cols-2 gap-6 mt-6">
        <RecentBookings bookings={recentBookings} />
        <TopPerformers models={topModels} />
      </div>
      
      <ActionRequired />
    </div>
  );
}
```

---

### 👥 Models Management (/admin/models)

**List View:**
- Table with columns: Photo, Name, Location, Status, Actions
- Filters: Status, Location, Featured
- Search by name
- Bulk actions (activate, archive)
- Pagination

**Create/Edit Form:**
- Basic info (name, age, nationality)
- Physical attributes
- Biography
- Services & pricing (JSON editor)
- Locations served (multi-select)
- Gallery upload
- SEO fields
- Status selector

---

### 📅 Bookings Management (/admin/bookings)

**List View:**
- Table columns: ID, Model, Client, Date, Time, Status, Actions
- Filters: Status, Model, Date range
- Quick status change
- Export to CSV
- Calendar view toggle

**Detail View:**
- Full booking information
- Model details
- Client details
- Status history
- Internal notes
- Action buttons (Confirm, Complete, Cancel)

---

## 4. COMPONENTS

### 🧩 Reusable Components:

**ModelCard.tsx:**
```tsx
interface ModelCardProps {
  model: {
    name: string;
    slug: string;
    age: number;
    location: string;
    profileImage: string;
    services: { incall: number };
    featured: boolean;
    verified: boolean;
  };
}

export function ModelCard({ model }: ModelCardProps) {
  return (
    <Link href={`/catalog/${model.slug}`}>
      <div className="group relative overflow-hidden rounded-lg">
        <Image
          src={model.profileImage}
          alt={model.name}
          width={400}
          height={600}
          className="group-hover:scale-105 transition"
        />
        
        {model.featured && (
          <Badge className="absolute top-2 right-2">Featured</Badge>
        )}
        
        <div className="p-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            {model.name}
            {model.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
          </h3>
          <p className="text-gray-600">{model.location}</p>
          <p className="text-sm">Age: {model.age}</p>
          <p className="font-semibold mt-2">From £{model.services.incall}/hr</p>
        </div>
      </div>
    </Link>
  );
}
```

---

**BookingForm.tsx:**
```tsx
export function BookingForm({ modelId }: { modelId: string }) {
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(data: BookingData) {
    setLoading(true);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateUniqueId()
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        toast.success('Booking created! Confirmation code sent.');
      }
    } catch (error) {
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

**FilterSidebar.tsx:**
```tsx
export function FilterSidebar() {
  const [filters, setFilters] = useState({
    location: [],
    services: [],
    age: [18, 45],
    hairColor: []
  });
  
  function applyFilters() {
    const params = new URLSearchParams();
    // Build URL params
    router.push(`/london-escorts?${params.toString()}`);
  }
  
  return (
    <aside className="w-64 space-y-6">
      <LocationFilter
        value={filters.location}
        onChange={(v) => setFilters({ ...filters, location: v })}
      />
      
      <ServicesFilter
        value={filters.services}
        onChange={(v) => setFilters({ ...filters, services: v })}
      />
      
      <Button onClick={applyFilters}>Apply Filters</Button>
    </aside>
  );
}
```

---

## 5. SEO IMPLEMENTATION

### 🔍 Meta Tags:

```typescript
// app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://virel.com'),
  title: {
    default: 'Virel | Premium London Escorts',
    template: '%s | Virel'
  },
  description: 'Elite companions...',
  keywords: ['london escorts', 'mayfair', 'premium'],
  authors: [{ name: 'Virel' }],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://virel.com',
    siteName: 'Virel',
    images: ['/og-image.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    site: '@virel'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    }
  }
};
```

---

### 🗺️ Sitemap:

**app/sitemap.ts:**
```typescript
export default async function sitemap() {
  const models = await prisma.model.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true }
  });
  
  const seoPages = await prisma.seoWhitelist.findMany({
    where: { isPublished: true },
    select: { url: true, updatedAt: true }
  });
  
  return [
    {
      url: 'https://virel.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://virel.com/london-escorts',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...models.map(model => ({
      url: `https://virel.com/catalog/${model.slug}`,
      lastModified: model.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...seoPages.map(page => ({
      url: `https://virel.com${page.url}`,
      lastModified: page.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  ];
}
```

---

### 🤖 Robots.txt:

**app/robots.ts:**
```typescript
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      }
    ],
    sitemap: 'https://virel.com/sitemap.xml',
  };
}
```

---

**Последнее обновление:** 27 февраля 2026  
**Framework:** Next.js 14
