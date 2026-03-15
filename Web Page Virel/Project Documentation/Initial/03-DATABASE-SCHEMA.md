# 🗄️ DATABASE SCHEMA

## Документ: Структура базы данных
**Версия:** 2.0  
**Дата:** 27 февраля 2026  
**СУБД:** PostgreSQL 15 (Neon.tech)

---

## 📚 ОГЛАВЛЕНИЕ

1. [Обзор](#обзор)
2. [Core Tables](#core-tables)
3. [SEO Tables](#seo-tables)
4. [System Tables](#system-tables)
5. [Отношения](#отношения)
6. [Индексы](#индексы)
7. [Миграции](#миграции)

---

## 1. ОБЗОР

### 📊 Статистика схемы v2:

```yaml
Таблиц: 17
Отношений: 32
Индексов: 45+
Enums: 6
```

### 🏗️ Группы таблиц:

**Core (5):**
- Model, Booking, User, Availability, Review

**SEO (3):**
- SeoWhitelist, Redirect, Page

**System (4):**
- AuditLog, Notification, Session, Media

**Reference (5):**
- Service, Location, Attribute, TelegramLog, AppSheetSync

---

## 2. CORE TABLES

### 📋 Model

**Описание:** Профили escort моделей

```prisma
model Model {
  id              String   @id @default(cuid())
  
  // Basic Info
  name            String
  slug            String   @unique
  email           String?  @unique
  phone           String?
  
  // Personal Details
  age             Int?
  dateOfBirth     DateTime?
  nationality     String?
  languages       String[]  // ["English", "Spanish"]
  
  // Physical Attributes
  height          String?   // "170cm"
  measurements    String?   // "34-24-36"
  hairColor       String?   // "Blonde", "Brunette"
  eyeColor        String?
  bodyType        String?   // "Slim", "Athletic"
  tattoos         Boolean?
  piercings       Boolean?
  
  // Biography
  bio             String?   @db.Text
  interests       String[]
  
  // Services & Pricing (JSON)
  services        Json?
  // Example:
  // {
  //   "incall": 300,
  //   "outcall": 400,
  //   "dinner": 500,
  //   "overnight": 2000,
  //   "available": ["gfe", "massage", "dinner-date"]
  // }
  
  // Location
  baseLocation    String?   // "Mayfair"
  servesDistricts String[]  // ["Mayfair", "Kensington"]
  
  // Media
  profileImage    String?
  galleryImages   String[]
  videoUrl        String?
  
  // SEO
  metaTitle       String?
  metaDescription String?
  
  // Status
  status          ModelStatus @default(DRAFT)
  featured        Boolean     @default(false)
  verified        Boolean     @default(false)
  
  // Stats
  viewCount       Int         @default(0)
  bookingCount    Int         @default(0)
  rating          Float?
  
  // Timestamps
  publishedAt     DateTime?
  lastActiveAt    DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  bookings        Booking[]
  availability    Availability[]
  reviews         Review[]
  
  @@index([slug])
  @@index([status])
  @@index([featured])
  @@index([baseLocation])
  @@map("models")
}

enum ModelStatus {
  DRAFT      // Черновик (не видна)
  ACTIVE     // Активна (доступна)
  HOLIDAY    // В отпуске
  ARCHIVED   // В архиве
}
```

**Примеры данных:**

```json
{
  "id": "clx1a2b3c4d5e6f7g8h9",
  "name": "Sophia",
  "slug": "sophia-mayfair",
  "age": 25,
  "nationality": "British",
  "languages": ["English", "French"],
  "height": "168cm",
  "measurements": "34C-24-36",
  "hairColor": "Blonde",
  "eyeColor": "Blue",
  "bodyType": "Slim",
  "services": {
    "incall": 300,
    "outcall": 400,
    "available": ["gfe", "massage", "dinner-date"]
  },
  "baseLocation": "Mayfair",
  "servesDistricts": ["Mayfair", "Kensington", "Knightsbridge"],
  "status": "ACTIVE",
  "featured": true,
  "verified": true
}
```

---

### 📅 Booking

**Описание:** Бронирования клиентов

```prisma
model Booking {
  id              String   @id @default(cuid())
  requestId       String?  @unique  // Idempotency key
  
  // Model
  modelId         String
  model           Model    @relation(fields: [modelId], references: [id])
  
  // Client Info
  clientName      String
  clientEmail     String
  clientPhone     String
  clientId        String?  // For registered users
  
  // Booking Details
  bookingDate     DateTime
  bookingTime     String   // "14:00"
  duration        Int      // minutes
  endTime         String?  // calculated "16:00"
  
  // Location
  location        String
  locationType    LocationType
  address         String?
  postcode        String?
  
  // Services
  baseService     String   // "incall", "outcall"
  extraServices   Json?    // ["massage", "dinner"]
  
  // Pricing
  baseRate        Float
  extrasCost      Float    @default(0)
  totalAmount     Float
  currency        String   @default("GBP")
  
  // Status
  status          BookingStatus @default(PENDING)
  
  // Notes
  clientNotes     String?  @db.Text
  internalNotes   String?  @db.Text
  
  // Confirmation
  confirmationCode String?  @unique
  confirmedBy     String?  // userId
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  confirmedAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  
  // Cancellation
  cancellationReason String?
  cancelledBy        String?
  
  // Relations
  notifications   Notification[]
  auditLogs       AuditLog[]
  
  @@index([modelId])
  @@index([status])
  @@index([bookingDate])
  @@index([clientEmail])
  @@index([requestId])
  @@map("bookings")
}

enum BookingStatus {
  PENDING      // Ожидает подтверждения
  CONFIRMED    // Подтверждено
  IN_PROGRESS  // В процессе
  COMPLETED    // Завершено
  CANCELLED    // Отменено
  NO_SHOW      // Клиент не пришёл
}

enum LocationType {
  INCALL   // У модели
  OUTCALL  // У клиента/отель
}
```

**Примеры:**

```json
{
  "id": "clx9z8y7x6w5v4u3t2",
  "requestId": "idp_abc123def456",
  "modelId": "clx1a2b3c4d5e6f7g8h9",
  "clientName": "Alan",
  "clientEmail": "alan@example.com",
  "clientPhone": "+447958457775",
  "bookingDate": "2026-12-23T00:00:00Z",
  "bookingTime": "14:00",
  "duration": 180,
  "location": "Mayfair",
  "locationType": "OUTCALL",
  "address": "Grosvenor House, Park Lane",
  "baseService": "outcall",
  "extraServices": ["dinner"],
  "baseRate": 400,
  "extrasCost": 100,
  "totalAmount": 500,
  "status": "CONFIRMED",
  "confirmationCode": "VRL-A3B9C7"
}
```

---

### 👤 User

**Описание:** Пользователи системы (админы, менеджеры, ресепшн)

```prisma
model User {
  id            String   @id @default(cuid())
  
  // Credentials
  email         String   @unique
  password      String   // bcrypt hashed
  
  // Profile
  name          String
  role          UserRole
  
  // Contact
  phone         String?
  telegramChatId String?  // For notifications
  
  // Settings
  emailVerified Boolean  @default(false)
  twoFactorEnabled Boolean @default(false)
  
  // Status
  isActive      Boolean  @default(true)
  
  // Timestamps
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  sessions      Session[]
  auditLogs     AuditLog[]
  
  @@index([email])
  @@index([role])
  @@map("users")
}

enum UserRole {
  ADMIN      // Полный доступ
  MANAGER    // Управление, отчёты
  RECEPTION  // Только бронирования
}
```

**Seed данные:**

```javascript
// admin@virel.com (ADMIN)
// tommy@virel.com (MANAGER)
// lukas@virel.com (RECEPTION)
// sasha@virel.com (RECEPTION)
// adam@virel.com (RECEPTION)
// donald@virel.com (RECEPTION)
```

---

### 📆 Availability

**Описание:** Календарь доступности моделей

```prisma
model Availability {
  id          String   @id @default(cuid())
  
  // Model
  modelId     String
  model       Model    @relation(fields: [modelId], references: [id])
  
  // Schedule
  dayOfWeek   Int?     // 0-6 (Sunday-Saturday), null for specific dates
  date        DateTime? // Specific date
  
  // Time Slots
  startTime   String   // "09:00"
  endTime     String   // "22:00"
  
  // Status
  isAvailable Boolean  @default(true)
  isBlocked   Boolean  @default(false)
  blockReason String?
  
  // Recurrence
  isRecurring Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([modelId])
  @@index([date])
  @@index([dayOfWeek])
  @@map("availability")
}
```

---

### ⭐ Review

**Описание:** Отзывы клиентов

```prisma
model Review {
  id          String   @id @default(cuid())
  
  // Model
  modelId     String
  model       Model    @relation(fields: [modelId], references: [id])
  
  // Client
  clientName  String
  clientEmail String
  
  // Rating
  rating      Int      // 1-5 stars
  
  // Content
  title       String?
  comment     String   @db.Text
  
  // Verification
  isVerified  Boolean  @default(false)
  bookingId   String?  // Link to booking
  
  // Moderation
  status      ReviewStatus @default(PENDING)
  moderatedBy String?
  moderatedAt DateTime?
  
  // Response
  response    String?  @db.Text
  respondedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([modelId])
  @@index([status])
  @@map("reviews")
}

enum ReviewStatus {
  PENDING    // Ожидает модерации
  APPROVED   // Одобрен
  REJECTED   // Отклонён
}
```

---

## 3. SEO TABLES

### 🔍 SeoWhitelist

**Описание:** Контроль индексируемых страниц

```prisma
model SeoWhitelist {
  id            String   @id @default(cuid())
  
  // Type & Identification
  type          PageType
  slug          String   @unique
  url           String   @unique
  
  // SEO Meta
  title         String   // max 60 chars
  metaDesc      String   // max 160 chars
  h1            String
  content       String   @db.Text // min 800 words
  
  // Structured Data
  faqJson       Json?    // [{question, answer}]
  schemaJson    Json?    // Additional schema
  
  // Requirements
  minModels     Int      @default(8)
  
  // Status
  isIndexable   Boolean  @default(true)
  isPublished   Boolean  @default(false)
  publishedAt   DateTime?
  
  // Stats
  pageViews     Int      @default(0)
  lastCrawled   DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([type])
  @@index([slug])
  @@index([isPublished])
  @@map("seo_whitelist")
}

enum PageType {
  GEO        // escorts-in-{district}
  SERVICE    // services/{slug}
  ATTRIBUTE  // {attribute}-escorts-london
}
```

**Примеры:**

```json
{
  "type": "GEO",
  "slug": "mayfair",
  "url": "/escorts-in-mayfair",
  "title": "Mayfair Escorts | Elite Companions | Virel",
  "metaDesc": "Premium Mayfair escorts offering exceptional companionship...",
  "h1": "Elite Mayfair Escorts",
  "content": "In the heart of London's most exclusive district...",
  "faqJson": [
    {
      "question": "What areas do Mayfair escorts cover?",
      "answer": "Our Mayfair companions serve the entire W1 postcode..."
    }
  ],
  "minModels": 8,
  "isIndexable": true,
  "isPublished": true
}
```

---

### 🔀 Redirect

**Описание:** 301 redirects для SEO

```prisma
model Redirect {
  id            String   @id @default(cuid())
  
  // Paths
  fromPath      String   @unique
  toPath        String
  
  // HTTP
  statusCode    Int      @default(301)
  
  // Stats
  hitCount      Int      @default(0)
  lastHitAt     DateTime?
  
  // Status
  isActive      Boolean  @default(true)
  
  // Metadata
  reason        String?  // "slug_change", "consolidation"
  createdBy     String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([fromPath])
  @@index([isActive])
  @@map("redirects")
}
```

**Use case:** When model slug changes from "sophia-london" to "sophia-mayfair"
```json
{
  "fromPath": "/catalog/sophia-london",
  "toPath": "/catalog/sophia-mayfair",
  "statusCode": 301,
  "reason": "slug_change"
}
```

---

### 📄 Page

**Описание:** Статические страницы

```prisma
model Page {
  id            String   @id @default(cuid())
  
  // Identification
  slug          String   @unique
  title         String
  
  // Content
  content       String   @db.Text
  excerpt       String?
  
  // SEO
  metaTitle     String?
  metaDescription String?
  
  // Template
  template      String   @default("default")
  
  // Status
  status        PageStatus @default(DRAFT)
  publishedAt   DateTime?
  
  // Order
  order         Int      @default(0)
  parentId      String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([slug])
  @@index([status])
  @@map("pages")
}

enum PageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## 4. SYSTEM TABLES

### 📝 AuditLog

**Описание:** Логирование всех действий

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  
  // User
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // Action
  action        String   // CREATE, UPDATE, DELETE, LOGIN
  entityType    String   // MODEL, BOOKING, USER
  entityId      String?
  
  // Changes
  changes       Json?
  // Example:
  // {
  //   "before": {"status": "PENDING"},
  //   "after": {"status": "CONFIRMED"}
  // }
  
  // Context
  ipAddress     String?
  userAgent     String?
  
  // Relations
  bookingId     String?
  booking       Booking? @relation(fields: [bookingId], references: [id])
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

### 🔔 Notification

**Описание:** Очередь уведомлений

```prisma
model Notification {
  id            String   @id @default(cuid())
  requestId     String?  @unique  // Idempotency
  
  // Type & Recipient
  type          NotificationType
  recipient     String   // chat_id or email
  
  // Content
  payload       Json
  // Example for TELEGRAM_DIVA:
  // {
  //   "bookingId": "...",
  //   "modelName": "Sophia",
  //   "clientName": "Alan",
  //   "date": "2026-12-23",
  //   "time": "14:00"
  // }
  
  // Status
  status        NotificationStatus @default(PENDING)
  attempts      Int      @default(0)
  maxAttempts   Int      @default(3)
  
  // Retry
  lastAttempt   DateTime?
  nextAttempt   DateTime?
  
  // Result
  sentAt        DateTime?
  failedAt      DateTime?
  error         String?  @db.Text
  
  // Relations
  bookingId     String?
  booking       Booking? @relation(fields: [bookingId], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([status])
  @@index([type])
  @@index([nextAttempt])
  @@map("notifications")
}

enum NotificationType {
  TELEGRAM_DIVA   // DivaReceptionBot
  TELEGRAM_KESHA  // KeshaZeroGapBot
  EMAIL           // Email notifications
  SMS             // SMS notifications
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}
```

---

### 🔐 Session

**Описание:** Пользовательские сессии

```prisma
model Session {
  id            String   @id @default(cuid())
  
  // User
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // Token
  token         String   @unique
  refreshToken  String?  @unique
  
  // Device
  ipAddress     String?
  userAgent     String?
  
  // Expiry
  expiresAt     DateTime
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}
```

---

### 🖼️ Media

**Описание:** Загруженные файлы

```prisma
model Media {
  id            String   @id @default(cuid())
  
  // File
  filename      String
  originalName  String
  mimeType      String
  size          Int      // bytes
  
  // URLs
  url           String   // Original
  urlWebP       String?  // Optimized WebP
  urlAVIF       String?  // Optimized AVIF
  thumbnail     String?
  
  // Dimensions (for images)
  width         Int?
  height        Int?
  
  // Association
  entityType    String?  // MODEL, BOOKING
  entityId      String?
  
  // Metadata
  alt           String?
  caption       String?
  
  // Visibility
  isPublic      Boolean  @default(true)
  
  // Upload info
  uploadedBy    String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([entityType, entityId])
  @@map("media")
}
```

---

## 5. REFERENCE TABLES

### 🛎️ Service

```prisma
model Service {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  description   String?  @db.Text
  icon          String?
  order         Int      @default(0)
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("services")
}
```

### 📍 Location

```prisma
model Location {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  area          String?
  postcode      String?
  coordinates   Json?    // {lat, lng}
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("locations")
}
```

### 🏷️ Attribute

```prisma
model Attribute {
  id            String   @id @default(cuid())
  type          String   // "hair", "body", "ethnicity"
  value         String
  slug          String   @unique
  order         Int      @default(0)
  isActive      Boolean  @default(true)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("attributes")
}
```

### 💬 TelegramLog

```prisma
model TelegramLog {
  id            String   @id @default(cuid())
  botType       String   // "DIVA", "KESHA"
  chatId        String
  messageId     String?
  direction     String   // "OUTGOING", "INCOMING"
  payload       Json
  response      Json?
  error         String?
  
  createdAt     DateTime @default(now())
  
  @@index([botType])
  @@index([chatId])
  @@map("telegram_logs")
}
```

### 📊 AppSheetSync

```prisma
model AppSheetSync {
  id            String   @id @default(cuid())
  entityType    String   // "BOOKING"
  entityId      String
  action        String   // "CREATE", "UPDATE"
  status        String   // "PENDING", "SUCCESS", "FAILED"
  payload       Json
  response      Json?
  error         String?
  attempts      Int      @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([status])
  @@map("appsheet_sync")
}
```

---

## 6. ОТНОШЕНИЯ

### 📊 Relationship Diagram:

```
User
 ├─ has many → Session
 └─ has many → AuditLog

Model
 ├─ has many → Booking
 ├─ has many → Availability
 └─ has many → Review

Booking
 ├─ belongs to → Model
 ├─ has many → Notification
 └─ has many → AuditLog

Notification
 └─ belongs to → Booking (optional)

AuditLog
 ├─ belongs to → User
 └─ belongs to → Booking (optional)
```

---

## 7. ИНДЕКСЫ

### 🔍 Performance Indexes:

```sql
-- Models
CREATE INDEX idx_models_slug ON models(slug);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_featured ON models(featured);
CREATE INDEX idx_models_location ON models(base_location);

-- Bookings
CREATE INDEX idx_bookings_model ON bookings(model_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_email ON bookings(client_email);

-- SEO
CREATE INDEX idx_seo_slug ON seo_whitelist(slug);
CREATE INDEX idx_seo_type ON seo_whitelist(type);
CREATE INDEX idx_redirects_from ON redirects(from_path);

-- System
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_notifications_status ON notifications(status);
```

---

## 8. МИГРАЦИИ

### 📦 Version History:

**v1.0 → v2.0 (27 Feb 2026):**
- Added: 12 new tables
- Modified: Model (added services JSON, SEO fields)
- Modified: Booking (added idempotency, pricing)
- Added: All SEO tables
- Added: All system tables

---

**Последнее обновление:** 27 февраля 2026  
**Database:** Neon.tech (PostgreSQL 15)  
**ORM:** Prisma 5
