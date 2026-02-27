# 🔌 API DOCUMENTATION

## Документ: REST API Reference
**Версия:** 2.0  
**Дата:** 27 февраля 2026  
**Base URL:** https://virel.com/api

---

## 📚 ОГЛАВЛЕНИЕ

1. [Общая информация](#общая-информация)
2. [Authentication](#authentication)
3. [Models API](#models-api)
4. [Bookings API](#bookings-api)
5. [SEO Pages API](#seo-pages-api)
6. [Users API](#users-api)
7. [Error Handling](#error-handling)

---

## 1. ОБЩАЯ ИНФОРМАЦИЯ

### 🌐 Base URL:

```
Development: http://localhost:3000/api
Production:  https://virel.com/api
```

### 📦 Response Format:

All responses are JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### ⚠️ Error Format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

### 🔑 Headers:

```http
Content-Type: application/json
Authorization: Bearer {token}
Idempotency-Key: {unique-key}  # Optional
```

---

## 2. AUTHENTICATION

### 🔐 POST /api/auth/login

**Request:**
```json
{
  "email": "admin@virel.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1a2b3c4",
      "email": "admin@virel.com",
      "name": "Adel",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 🔄 POST /api/auth/refresh

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 🚪 POST /api/auth/logout

**Headers:**
```http
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. MODELS API

### 📋 GET /api/models

**Description:** Get list of models with filtering

**Query Parameters:**
```
status?: ModelStatus       # DRAFT, ACTIVE, HOLIDAY, ARCHIVED
featured?: boolean         # true/false
location?: string          # "Mayfair"
hairColor?: string         # "Blonde"
age?: string              # "18-25" (range)
nationality?: string      # "British"
services?: string[]       # ["gfe", "massage"]
limit?: number            # Default: 12
offset?: number           # Default: 0
sortBy?: string           # "name", "age", "createdAt"
sortOrder?: string        # "asc", "desc"
```

**Example Request:**
```http
GET /api/models?status=ACTIVE&location=Mayfair&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "clx1a2b3c4",
        "name": "Sophia",
        "slug": "sophia-mayfair",
        "age": 25,
        "nationality": "British",
        "height": "168cm",
        "hairColor": "Blonde",
        "eyeColor": "Blue",
        "profileImage": "/images/models/sophia.jpg",
        "baseLocation": "Mayfair",
        "services": {
          "incall": 300,
          "outcall": 400
        },
        "status": "ACTIVE",
        "featured": true,
        "verified": true,
        "rating": 4.9
      }
      // ... more models
    ],
    "pagination": {
      "total": 42,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 🔍 GET /api/models/:slug

**Description:** Get single model by slug

**Example Request:**
```http
GET /api/models/sophia-mayfair
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "clx1a2b3c4",
      "name": "Sophia",
      "slug": "sophia-mayfair",
      "email": "sophia@virel.com",
      "phone": "+447700900001",
      "age": 25,
      "nationality": "British",
      "languages": ["English", "French"],
      "height": "168cm",
      "measurements": "34C-24-36",
      "hairColor": "Blonde",
      "eyeColor": "Blue",
      "bodyType": "Slim",
      "bio": "Sophisticated companion...",
      "interests": ["Travel", "Fine dining", "Art"],
      "services": {
        "incall": 300,
        "outcall": 400,
        "dinner": 500,
        "overnight": 2000,
        "available": ["gfe", "massage", "dinner-date"]
      },
      "baseLocation": "Mayfair",
      "servesDistricts": ["Mayfair", "Kensington", "Knightsbridge"],
      "profileImage": "/images/models/sophia.jpg",
      "galleryImages": [
        "/images/models/sophia-1.jpg",
        "/images/models/sophia-2.jpg"
      ],
      "status": "ACTIVE",
      "featured": true,
      "verified": true,
      "viewCount": 1542,
      "bookingCount": 87,
      "rating": 4.9,
      "publishedAt": "2026-01-15T10:00:00Z",
      "createdAt": "2026-01-10T08:30:00Z",
      "updatedAt": "2026-02-20T14:22:00Z"
    }
  }
}
```

---

### ✏️ POST /api/models

**Description:** Create new model

**Authorization:** Required (ADMIN, MANAGER)

**Request:**
```json
{
  "name": "Isabella",
  "email": "isabella@virel.com",
  "phone": "+447700900002",
  "age": 26,
  "nationality": "Italian",
  "languages": ["English", "Italian"],
  "height": "172cm",
  "measurements": "36D-26-38",
  "hairColor": "Brunette",
  "eyeColor": "Brown",
  "bodyType": "Athletic",
  "bio": "Elegant Italian companion...",
  "interests": ["Fashion", "Music"],
  "services": {
    "incall": 350,
    "outcall": 450,
    "available": ["gfe", "travel"]
  },
  "baseLocation": "Kensington",
  "servesDistricts": ["Kensington", "Chelsea"],
  "status": "DRAFT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "clx2b3c4d5",
      "name": "Isabella",
      "slug": "isabella-kensington",
      "status": "DRAFT",
      "createdAt": "2026-02-27T15:30:00Z"
    }
  },
  "message": "Model created successfully"
}
```

**Notes:**
- Slug is auto-generated from name
- metaTitle and metaDescription auto-generated if not provided
- Status defaults to DRAFT
- Audit log entry created

---

### 🔄 PUT /api/models/:id

**Description:** Update model

**Authorization:** Required (ADMIN, MANAGER)

**Request:**
```json
{
  "status": "ACTIVE",
  "services": {
    "incall": 400,
    "outcall": 500
  },
  "featured": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "clx2b3c4d5",
      "name": "Isabella",
      "slug": "isabella-kensington",
      "status": "ACTIVE",
      "featured": true,
      "publishedAt": "2026-02-27T16:00:00Z",
      "updatedAt": "2026-02-27T16:00:00Z"
    }
  },
  "message": "Model updated successfully"
}
```

**Notes:**
- If slug changed → creates 301 redirect
- If status changed to ACTIVE → sets publishedAt
- Audit log entry created

---

### 🗑️ DELETE /api/models/:id

**Description:** Delete model (soft delete)

**Authorization:** Required (ADMIN)

**Response:**
```json
{
  "success": true,
  "message": "Model archived successfully"
}
```

**Notes:**
- Soft delete: sets status to ARCHIVED
- Does not remove from database
- Audit log entry created

---

## 4. BOOKINGS API

### 📅 GET /api/bookings

**Description:** Get list of bookings

**Authorization:** Required

**Query Parameters:**
```
status?: BookingStatus     # PENDING, CONFIRMED, etc.
modelId?: string          # Filter by model
clientEmail?: string      # Filter by client
dateFrom?: string         # ISO date
dateTo?: string          # ISO date
limit?: number           # Default: 20
offset?: number          # Default: 0
```

**Example:**
```http
GET /api/bookings?status=PENDING&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "clx9z8y7x6",
        "confirmationCode": "VRL-A3B9C7",
        "model": {
          "id": "clx1a2b3c4",
          "name": "Sophia",
          "profileImage": "/images/models/sophia.jpg"
        },
        "clientName": "Alan",
        "clientEmail": "alan@example.com",
        "clientPhone": "+447958457775",
        "bookingDate": "2026-12-23",
        "bookingTime": "14:00",
        "duration": 180,
        "location": "Mayfair",
        "locationType": "OUTCALL",
        "totalAmount": 500,
        "status": "PENDING",
        "createdAt": "2026-12-20T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 47,
      "limit": 10,
      "offset": 0
    }
  }
}
```

---

### 🔍 GET /api/bookings/:id

**Description:** Get single booking with full details

**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clx9z8y7x6",
      "requestId": "idp_abc123",
      "confirmationCode": "VRL-A3B9C7",
      "model": {
        "id": "clx1a2b3c4",
        "name": "Sophia",
        "slug": "sophia-mayfair",
        "profileImage": "/images/models/sophia.jpg",
        "phone": "+447700900001"
      },
      "clientName": "Alan",
      "clientEmail": "alan@example.com",
      "clientPhone": "+447958457775",
      "bookingDate": "2026-12-23",
      "bookingTime": "14:00",
      "duration": 180,
      "endTime": "17:00",
      "location": "Mayfair",
      "locationType": "OUTCALL",
      "address": "Grosvenor House, Park Lane",
      "postcode": "W1K 7TN",
      "baseService": "outcall",
      "extraServices": ["dinner"],
      "baseRate": 400,
      "extrasCost": 100,
      "totalAmount": 500,
      "currency": "GBP",
      "status": "CONFIRMED",
      "clientNotes": "Room 505",
      "internalNotes": "VIP client",
      "confirmedBy": "clxuser123",
      "confirmedAt": "2026-12-20T11:00:00Z",
      "createdAt": "2026-12-20T10:30:00Z",
      "updatedAt": "2026-12-20T11:00:00Z"
    }
  }
}
```

---

### ✏️ POST /api/bookings

**Description:** Create new booking

**Headers:**
```http
Idempotency-Key: unique-request-id-123
```

**Request:**
```json
{
  "modelId": "clx1a2b3c4",
  "clientName": "James Smith",
  "clientEmail": "james@example.com",
  "clientPhone": "+447700900123",
  "bookingDate": "2026-12-25",
  "bookingTime": "19:00",
  "duration": 120,
  "location": "Knightsbridge",
  "locationType": "INCALL",
  "address": "123 Brompton Road",
  "postcode": "SW3 1DE",
  "extraServices": ["massage"],
  "clientNotes": "First time booking"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxnewbook",
      "confirmationCode": "VRL-X7Y2Z9",
      "status": "PENDING",
      "totalAmount": 350,
      "createdAt": "2026-12-23T12:00:00Z"
    }
  },
  "message": "Booking created successfully. Confirmation code: VRL-X7Y2Z9"
}
```

**Flow:**
1. Validate inputs
2. Check idempotency (if key exists → return existing)
3. Verify model availability
4. Calculate pricing
5. Create booking (status: PENDING)
6. Queue notification (TELEGRAM_DIVA)
7. Queue AppSheet sync
8. Create audit log
9. Return booking

**Errors:**
- `MODEL_NOT_FOUND` - Model doesn't exist
- `MODEL_NOT_AVAILABLE` - Model not ACTIVE
- `TIME_SLOT_TAKEN` - Time already booked
- `INVALID_DATE` - Date in the past

---

### 🔄 PATCH /api/bookings/:id/status

**Description:** Update booking status

**Authorization:** Required

**Request:**
```json
{
  "status": "CONFIRMED",
  "internalNotes": "Confirmed via phone call"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clx9z8y7x6",
      "status": "CONFIRMED",
      "confirmedAt": "2026-12-23T13:00:00Z"
    }
  },
  "message": "Booking confirmed successfully"
}
```

**Notes:**
- PENDING → CONFIRMED: sets confirmedAt
- Any → COMPLETED: sets completedAt
- Any → CANCELLED: sets cancelledAt
- Queues notification on status change
- Syncs with AppSheet

---

### 🗑️ DELETE /api/bookings/:id

**Description:** Cancel booking

**Authorization:** Required

**Request:**
```json
{
  "cancellationReason": "Client requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

---

## 5. SEO PAGES API

### 📋 GET /api/seo-pages

**Query Parameters:**
```
type?: PageType           # GEO, SERVICE, ATTRIBUTE
isPublished?: boolean
limit?: number
offset?: number
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "id": "clxseo1",
        "type": "GEO",
        "slug": "mayfair",
        "url": "/escorts-in-mayfair",
        "title": "Mayfair Escorts | Elite Companions",
        "metaDesc": "Premium escorts in Mayfair...",
        "h1": "Elite Mayfair Escorts",
        "isIndexable": true,
        "isPublished": true,
        "publishedAt": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 17,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

### 🔍 GET /api/seo-pages/:slug

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": "clxseo1",
      "type": "GEO",
      "slug": "mayfair",
      "url": "/escorts-in-mayfair",
      "title": "Mayfair Escorts | Elite Companions",
      "metaDesc": "Premium escorts in Mayfair...",
      "h1": "Elite Mayfair Escorts",
      "content": "In the heart of London's most exclusive...",
      "faqJson": [
        {
          "question": "What areas do Mayfair escorts cover?",
          "answer": "Our Mayfair companions serve..."
        }
      ],
      "minModels": 8,
      "isIndexable": true,
      "isPublished": true,
      "pageViews": 1523,
      "publishedAt": "2026-01-15T10:00:00Z"
    }
  }
}
```

---

### ✏️ POST /api/seo-pages

**Authorization:** Required (ADMIN)

**Request:**
```json
{
  "type": "GEO",
  "slug": "chelsea",
  "url": "/escorts-in-chelsea",
  "title": "Chelsea Escorts | Exclusive Companions",
  "metaDesc": "Discover elite Chelsea escorts...",
  "h1": "Exclusive Chelsea Escorts",
  "content": "Chelsea, one of London's most prestigious...",
  "faqJson": [
    {
      "question": "How to book a Chelsea escort?",
      "answer": "Booking is simple..."
    }
  ],
  "minModels": 8,
  "isPublished": true
}
```

**Validation:**
- title.length ≤ 60
- metaDesc.length ≤ 160
- content.length ≥ 800
- faqJson.length ≥ 6

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": "clxseonew",
      "slug": "chelsea",
      "isPublished": true
    }
  },
  "message": "SEO page created successfully"
}
```

---

## 6. USERS API

### 📋 GET /api/users

**Authorization:** Required (ADMIN)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clxuser1",
        "email": "admin@virel.com",
        "name": "Adel",
        "role": "ADMIN",
        "isActive": true,
        "lastLoginAt": "2026-02-27T10:00:00Z",
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### ✏️ POST /api/users

**Authorization:** Required (ADMIN)

**Request:**
```json
{
  "email": "newuser@virel.com",
  "name": "New User",
  "role": "RECEPTION",
  "password": "temp-password-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxusernew",
      "email": "newuser@virel.com",
      "name": "New User",
      "role": "RECEPTION"
    }
  },
  "message": "User created successfully"
}
```

---

## 7. ERROR HANDLING

### ❌ Error Codes:

```typescript
// Authentication
AUTH_REQUIRED          // 401
AUTH_INVALID_TOKEN     // 401
AUTH_EXPIRED_TOKEN     // 401
AUTH_INSUFFICIENT_PERMISSIONS // 403

// Validation
VALIDATION_ERROR       // 400
INVALID_INPUT          // 400
MISSING_REQUIRED_FIELD // 400

// Resources
RESOURCE_NOT_FOUND     // 404
RESOURCE_ALREADY_EXISTS // 409

// Business Logic
MODEL_NOT_AVAILABLE    // 409
TIME_SLOT_TAKEN        // 409
INSUFFICIENT_BALANCE   // 402

// Server
INTERNAL_SERVER_ERROR  // 500
DATABASE_ERROR         // 500
EXTERNAL_API_ERROR     // 502
```

### Example Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "age": "Must be between 18 and 65"
    }
  },
  "timestamp": "2026-02-27T15:30:00Z"
}
```

---

### 🔄 Rate Limiting:

```
Endpoint: /api/*
Limit: 100 requests per minute per IP
Header: X-RateLimit-Remaining: 95
```

If exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

**Последнее обновление:** 27 февраля 2026  
**API Version:** 2.0
