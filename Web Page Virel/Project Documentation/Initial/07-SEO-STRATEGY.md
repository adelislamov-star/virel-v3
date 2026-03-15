# 🔍 SEO STRATEGY

## Документ: SEO стратегия и оптимизация
**Версия:** 2.0  
**Дата:** 27 февраля 2026

---

## 📚 ОГЛАВЛЕНИЕ

1. [SEO Whitelist System](#seo-whitelist-system)
2. [Schema Markup](#schema-markup)
3. [Content Strategy](#content-strategy)
4. [Technical SEO](#technical-seo)
5. [Keyword Strategy](#keyword-strategy)

---

## 1. SEO WHITELIST SYSTEM

### 🎯 Concept:

**Problem:** Фильтры создают тысячи комбинаций URL → duplicate content

**Solution:** Whitelist только important URL combinations для индексации

---

### 📋 Page Types:

**GEO Pages (9):**
- `/escorts-in-mayfair`
- `/escorts-in-kensington`
- `/escorts-in-knightsbridge`
- `/escorts-in-chelsea`
- `/escorts-in-belgravia`
- `/escorts-in-marylebone`
- `/escorts-in-westminster`
- `/escorts-in-soho`
- `/escorts-in-canary-wharf`

**SERVICE Pages (4):**
- `/services/gfe`
- `/services/dinner-date`
- `/services/travel-companion`
- `/services/vip`

**ATTRIBUTE Pages (4):**
- `/blonde-escorts-london`
- `/brunette-escorts-london`
- `/petite-escorts-london`
- `/vip-escorts-london`

**Total:** 17 whitelisted pages + main catalog

---

### 🔐 Indexation Logic:

```typescript
function shouldIndex(page: SeoWhitelist, modelCount: number): SEOConfig {
  // Rule 1: Must be published
  if (!page.isPublished) {
    return {
      robots: "noindex, follow",
      canonical: "/london-escorts"
    };
  }
  
  // Rule 2: Must meet minimum model count
  if (modelCount < page.minModels) {
    return {
      robots: "noindex, follow",
      canonical: "/london-escorts",
      reason: "Insufficient models"
    };
  }
  
  // Rule 3: Page must be whitelisted
  if (!page.isIndexable) {
    return {
      robots: "noindex, follow",
      canonical: page.url
    };
  }
  
  // All checks passed → Index
  return {
    robots: "index, follow",
    canonical: page.url
  };
}
```

---

### 🚫 Non-Whitelist Handling:

**Example:** `/london-escorts?location=mayfair&age=18-25&hair=blonde`

```html
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="https://virel.com/london-escorts">
```

**Result:**
- Not indexed by Google
- Users can still access
- Canonical prevents duplicate content penalty
- Follow allows crawling of links on page

---

## 2. SCHEMA MARKUP

### 📊 8 Schema Types Used:

1. **Organization** (Homepage)
2. **BreadcrumbList** (All pages)
3. **CollectionPage** (Catalog pages)
4. **ItemList** (Model listings)
5. **ProfilePage** (Model profiles)
6. **Person** (Model entity)
7. **Offer** (Service pricing)
8. **FAQPage** (FAQ sections)

---

### 🏢 Organization Schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Virel",
  "url": "https://virel.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://virel.com/logo.png",
    "width": "200",
    "height": "60"
  },
  "description": "Premium London escort agency",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "London",
    "addressRegion": "Greater London",
    "postalCode": "W1",
    "addressCountry": "GB"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+44-20-1234-5678",
    "contactType": "customer service",
    "availableLanguage": ["en", "fr", "es"]
  },
  "sameAs": [
    "https://twitter.com/virel",
    "https://instagram.com/virel"
  ]
}
```

---

### 🗺️ BreadcrumbList Schema:

```json
{
  "@context": "https://schema.org",
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
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Mayfair Escorts",
      "item": "https://virel.com/escorts-in-mayfair"
    }
  ]
}
```

---

### 📦 CollectionPage + ItemList:

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Mayfair Escorts",
  "description": "Premium escorts in Mayfair...",
  "url": "https://virel.com/escorts-in-mayfair",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 12,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Person",
          "name": "Sophia",
          "url": "https://virel.com/catalog/sophia-mayfair",
          "image": "https://virel.com/images/sophia.jpg"
        }
      }
      // ... more items
    ]
  }
}
```

---

### 👤 ProfilePage + Person + Offer:

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Sophia",
    "description": "Sophisticated London companion...",
    "image": {
      "@type": "ImageObject",
      "url": "https://virel.com/images/sophia.jpg",
      "width": "800",
      "height": "1200"
    },
    "offers": {
      "@type": "Offer",
      "price": "300",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock",
      "itemOffered": {
        "@type": "Service",
        "name": "Companion Services",
        "description": "Professional companionship..."
      }
    }
  }
}
```

---

### ❓ FAQPage Schema:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What areas do Mayfair escorts cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our Mayfair companions serve the entire W1 postcode..."
      }
    },
    {
      "@type": "Question",
      "name": "What is the booking process?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Simply browse our selection, choose your companion..."
      }
    }
    // ... 4 more questions (total 6)
  ]
}
```

---

## 3. CONTENT STRATEGY

### ✍️ Content Requirements:

**Minimum Standards:**
- Title: max 60 characters
- Meta Description: max 160 characters
- H1: Unique, includes target keyword
- Content: min 800 words
- FAQ: min 6 questions

**GEO Pages (9):**
- 1000+ words each
- District history and characteristics
- Services available in area
- Transportation and access
- Recommended venues
- 6 FAQs

**SERVICE Pages (4):**
- 1200+ words each
- Service description
- What to expect
- Pricing information
- Booking process
- 6 FAQs

**ATTRIBUTE Pages (4):**
- 800+ words each
- Attribute description
- Why choose this attribute
- Selection of models
- 6 FAQs

**Total:** ~15,000 words of unique content

---

### 📝 Content Template (GEO):

```markdown
# Elite {District} Escorts

{District}, one of London's most exclusive areas...

## About {District}

Located in the heart of {area description}...

## Our {District} Companions

Our carefully selected {district} escorts...

## Services in {District}

We offer a comprehensive range of services:
- Incall appointments at luxury locations
- Outcall to your hotel or residence
- Dinner dates at prestigious restaurants
- Extended overnight bookings

## Why Choose {District}?

{District} offers unparalleled luxury...

## Booking Your {District} Escort

The process is simple and discreet:
1. Browse our selection
2. Contact us via phone or form
3. Confirm your booking
4. Meet your companion

## FAQ

### What areas do {district} escorts cover?
Our companions serve...

### What is the typical rate?
Rates start from £300 per hour...

[4 more questions]
```

---

## 4. TECHNICAL SEO

### ⚡ Performance:

**Target Metrics:**
- Lighthouse Score: ≥ 90
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Cumulative Layout Shift: < 0.1

**Optimizations:**
```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
  },
  compress: true,
};
```

---

### 🖼️ Image Optimization:

**Strategy:**
1. WebP/AVIF format
2. Responsive sizes
3. Lazy loading
4. Proper dimensions
5. Alt text

**Implementation:**
```tsx
<Image
  src="/images/model.jpg"
  alt="Sophia - Elite Mayfair Escort"
  width={800}
  height={1200}
  quality={85}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

### 🔗 Internal Linking:

**Structure:**
```
Homepage
  └─ London Escorts (main catalog)
      ├─ Mayfair Escorts (GEO)
      │   └─ Sophia Profile
      ├─ GFE Service (SERVICE)
      └─ Blonde Escorts (ATTRIBUTE)
```

**Cross-linking:**
- GEO pages link to related districts
- SERVICE pages link to relevant models
- ATTRIBUTE pages link to GEO pages
- Model profiles link to GEO + SERVICE pages

---

### 📱 Mobile Optimization:

**Responsive Design:**
- Mobile-first approach
- Touch-friendly buttons (min 44x44px)
- Readable font sizes (16px minimum)
- Proper viewport meta tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

---

### 🌐 Internationalization (Future):

**Multi-language Support:**
```html
<link rel="alternate" hreflang="en-GB" href="https://virel.com/london-escorts">
<link rel="alternate" hreflang="fr-FR" href="https://virel.com/fr/london-escorts">
<link rel="alternate" hreflang="es-ES" href="https://virel.com/es/london-escorts">
```

---

## 5. KEYWORD STRATEGY

### 🎯 Primary Keywords:

**High Volume (10K+ searches/month):**
- london escorts
- escorts london
- escorts in london

**Medium Volume (1K-10K searches/month):**
- mayfair escorts
- kensington escorts
- knightsbridge escorts
- central london escorts

**Long-tail (100-1K searches/month):**
- elite escorts mayfair
- luxury companions london
- vip escorts kensington
- gfe london escorts

---

### 📊 Keyword Mapping:

| Page Type | Primary Keyword | Secondary Keywords |
|-----------|----------------|-------------------|
| Homepage | london escorts | elite, premium, luxury |
| Main Catalog | escorts london | companions, courtesans |
| Mayfair GEO | mayfair escorts | elite mayfair, luxury mayfair |
| GFE SERVICE | gfe escorts | girlfriend experience |
| Blonde ATTR | blonde escorts london | blonde companions |

---

### 🔍 On-Page Optimization:

**Title Format:**
```
{Primary Keyword} | {Brand} - {USP}

Examples:
- Mayfair Escorts | Virel - Elite London Companions
- GFE Escorts | Virel - Authentic Girlfriend Experience
- Blonde Escorts London | Virel - Premium Selection
```

**H1 Format:**
```
Elite {Primary Keyword}

Examples:
- Elite Mayfair Escorts
- Authentic GFE Companions
- Premium Blonde Escorts in London
```

**URL Structure:**
```
/{type}/{slug}

Examples:
- /escorts-in-mayfair
- /services/gfe
- /blonde-escorts-london
```

---

### 📈 Expected Results:

**Month 1-3:**
- Indexation of 17 whitelisted pages
- Position 50-100 for primary keywords
- 100-500 organic visits/month

**Month 4-6:**
- Position 20-50 for primary keywords
- Position 10-20 for long-tail keywords
- 500-2000 organic visits/month

**Month 7-12:**
- Position 5-20 for primary keywords
- Position 1-10 for long-tail keywords
- 2000-5000 organic visits/month

**Key factors:**
- Content quality
- Backlink profile
- User engagement metrics
- Brand signals

---

### 🔗 Link Building Strategy:

**Future Tactics:**
1. Guest posts on lifestyle blogs
2. PR in London magazines
3. Directory listings (high-quality only)
4. Social media presence
5. Influencer partnerships
6. Event sponsorships

---

**Последнее обновление:** 27 февраля 2026  
**SEO Status:** Foundation Ready ✅
