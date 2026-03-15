# Claude Code — Virel v3 Back Office Rebuild: PHASE 1

**Проект:** `C:\Virel`
**Стек:** Next.js 14, TypeScript, Prisma ORM, PostgreSQL (Neon), Tailwind CSS, Stripe, Vercel
**Цель:** Привести бэк-офис в соответствие с архитектурной спецификацией AuraEscort Back Office

> ВАЖНО: Не ломай то, что уже работает. Все изменения — аддитивные. Новые поля с default values. Существующие данные в БД должны остаться валидными после миграции.

---

## ОБЩИЙ КОНТЕКСТ

Virel v3 — operations platform для эскорт-агентства в Лондоне. Есть публичный сайт (virel-v3.vercel.app) и admin panel (/admin/). Нужно перестроить бэк-офис по спецификации, которая описывает 21 модуль. Текущий проект уже покрывает ~60% функциональности, но нужно:
1. Расширить модель данных (Prisma)
2. Обновить и добавить state machines
3. Добавить новые API endpoints
4. Добавить business logic (scoring, risk, short IDs)
5. Обновить RBAC
6. Обновить admin UI (sidebar + новые страницы)

---

## ЗАДАЧА 1: PRISMA SCHEMA UPDATE

**Файл:** `prisma/schema.prisma`

### 1.1 — Расширить модель Client

Найти модель `Client`. Добавить ПОСЛЕ поля `tags  String[]`:

```prisma
  // Risk & Finance
  riskStatus       String   @default("normal") // normal, monitoring, restricted, blocked
  totalSpent       Float    @default(0)
  bookingCount     Int      @default(0)
  chargebackCount  Int      @default(0)
  notes            String?  @db.Text
```

Добавить в relations блок Client (перед `createdAt`):
```prisma
  reviews          Review[]
  fraudSignals     FraudSignal[]
  incidents        Incident[]    @relation("ClientIncidents")
```

Добавить индекс (перед `@@map`):
```prisma
  @@index([riskStatus])
```

### 1.2 — Расширить модель Model

Заменить строку `status`:
```prisma
  status          String   @default("draft") // draft, review, published, hidden, archived
```

Добавить ПОСЛЕ `notesInternal`:
```prisma
  // Quality & Risk Scoring
  dataCompletenessScore  Int      @default(0)   // 0-100
  modelRiskIndex         String   @default("green") // green, yellow, red
```

Добавить в relations (перед `createdAt`):
```prisma
  reviews         Review[]
  incidents       Incident[]  @relation("ModelIncidents")
  fraudSignals    FraudSignal[]
```

### 1.3 — Расширить модель Booking

Добавить ПОСЛЕ `id`:
```prisma
  shortId           String?  @unique // BK-12345, human-readable
```

Обновить комментарий status:
```prisma
  status            String   @default("draft") // draft, pending, deposit_required, confirmed, in_progress, completed, cancelled, no_show, expired, disputed
```

Добавить в relations (перед `createdAt`):
```prisma
  reviews           Review[]
  incidents         Incident[]
  fraudSignals      FraudSignal[]
  lostRevenue       LostRevenueEntry[]
```

### 1.4 — Расширить модель User

Добавить ПОСЛЕ `telegramChatId`:
```prisma
  // Two-Factor Authentication
  twoFactorSecret  String?
  twoFactorEnabled Boolean  @default(false)
```

### 1.5 — Расширить модель Payment

Обновить комментарий status:
```prisma
  status            String   @default("pending") // pending, succeeded, failed, cancelled, refunded, disputed
```

Добавить ПОСЛЕ `currency`:
```prisma
  failureReason     String?
  refundedAmount    Float?
  refundedAt        DateTime?
```

### 1.6 — НОВЫЕ модели (добавить В КОНЕЦ schema.prisma, перед закрывающей скобкой если есть)

```prisma
// ============================================
// REVIEWS & REPUTATION
// ============================================

model Review {
  id                String   @id @default(cuid())
  bookingId         String
  booking           Booking  @relation(fields: [bookingId], references: [id])
  clientId          String
  client            Client   @relation(fields: [clientId], references: [id])
  modelId           String
  model             Model    @relation(fields: [modelId], references: [id])
  
  rating            Int      // 1-5
  text              String?  @db.Text
  status            String   @default("pending") // pending, approved, rejected, flagged, escalated
  isVerifiedBooking Boolean  @default(true)
  
  sentimentScore    Float?   // -1 to 1
  toxicityFlag      Boolean  @default(false)
  suspiciousFlag    Boolean  @default(false)
  
  replyByModel      String?  @db.Text
  replyByManager    String?  @db.Text
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([modelId, status])
  @@index([clientId])
  @@index([status])
  @@index([createdAt])
  @@map("reviews")
}

// ============================================
// FRAUD DETECTION
// ============================================

model FraudSignal {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  bookingId       String?
  booking         Booking? @relation(fields: [bookingId], references: [id])
  modelId         String?
  model           Model?   @relation(fields: [modelId], references: [id])
  
  signalType      String   // high_velocity, chargeback, ip_mismatch, suspicious_pattern, manual_flag
  riskScoreImpact Int
  metadata        Json?
  
  createdAt       DateTime @default(now())
  
  @@index([clientId])
  @@index([signalType])
  @@index([createdAt])
  @@map("fraud_signals")
}

// ============================================
// INCIDENT MANAGEMENT
// ============================================

model Incident {
  id                  String    @id @default(cuid())
  bookingId           String?
  booking             Booking?  @relation(fields: [bookingId], references: [id])
  
  reporterType        String    // client, model, staff
  reporterClientId    String?
  reporterClient      Client?   @relation("ClientIncidents", fields: [reporterClientId], references: [id])
  reporterModelId     String?
  reporterModel       Model?    @relation("ModelIncidents", fields: [reporterModelId], references: [id])
  reporterUserId      String?
  
  status              String    @default("reported") // reported, investigating, resolved, closed
  severity            String    @default("medium")   // low, medium, high, critical
  
  description         String    @db.Text
  resolutionDetails   String?   @db.Text
  compensationAmount  Float?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([status])
  @@index([severity])
  @@index([bookingId])
  @@index([createdAt])
  @@map("incidents")
}

// ============================================
// REVENUE LEAKAGE CONTROL
// ============================================

model LostRevenueEntry {
  id              String    @id @default(cuid())
  type            String    // missed_booking, unpaid_cancellation, receptionist_error, no_show_loss, system_error
  amount          Float
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id])
  leadId          String?
  rootCause       String
  responsibleRole String    // client, model, receptionist, system
  status          String    @default("open") // open, resolved
  resolvedAt      DateTime?
  resolvedBy      String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([type, status])
  @@index([createdAt])
  @@map("lost_revenue_registry")
}

// ============================================
// SEO & CONTENT CONTROL
// ============================================

model SEOPage {
  id              String    @id @default(cuid())
  pageType        String    // model_profile, geo_page, blog_post, service_page
  path            String    @unique
  title           String
  metaDescription String
  indexStatus     String    @default("indexed") // indexed, not_indexed, blocked
  canonicalUrl    String?
  schemaMarkup    Json?
  lastCrawledAt   DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([pageType])
  @@index([indexStatus])
  @@map("seo_pages")
}

// ============================================
// SYSTEM SETTINGS
// ============================================

model SystemSetting {
  key             String   @id
  value           Json
  description     String?
  isEditableByUI  Boolean  @default(true)
  
  updatedAt       DateTime @updatedAt
  
  @@map("system_settings")
}
```

### После ВСЕХ изменений в schema.prisma:

```bash
npx prisma migrate dev --name backoffice-spec-phase1
npx prisma generate
```

---

## ЗАДАЧА 2: STATE MACHINES

### 2.1 — Обновить `src/lib/state-machines/booking.ts`

Добавить `'disputed'` в тип `BookingStatus`.

Добавить в `BOOKING_TRANSITIONS`:
- `in_progress` массив: добавить `'disputed'`
- Новый ключ: `disputed: ['completed', 'cancelled']`

Добавить массив `REQUIRES_REASON`:
```typescript
const REQUIRES_REASON: BookingStatus[] = ['cancelled', 'disputed', 'no_show'];
```

Добавить метод `requiresReason(to)` который проверяет нужен ли reason_code.

В `transition()` добавить проверку: если `requiresReason(to) && !reasonCode` — вернуть ошибку.

Добавить `disputed` в `getStatusLabel` ('Disputed') и `getStatusColor` ('purple').

### 2.2 — Создать `src/lib/state-machines/model-profile.ts`

```
Статусы: draft, review, published, hidden, archived
Переходы:
  draft → review
  review → published, draft
  published → hidden, archived
  hidden → published, archived
  archived → [] (terminal)
Reason required для: archived
```

Класс `ModelProfileStateMachine` с методами: `canTransition`, `getAvailableTransitions`, `requiresReason`, `isTerminal`, `getStatusLabel`, `getStatusColor`.

### 2.3 — Создать `src/lib/state-machines/payment.ts`

```
Статусы: pending, succeeded, failed, cancelled, refunded, disputed
Переходы:
  pending → succeeded, failed, cancelled
  succeeded → refunded, disputed
  failed → [] (terminal)
  cancelled → [] (terminal)
  refunded → [] (terminal)
  disputed → [] (terminal)
```

Класс `PaymentStateMachine`.

### 2.4 — Создать `src/lib/state-machines/review.ts`

```
Статусы: pending, approved, rejected, flagged, escalated
Переходы:
  pending → approved, rejected, flagged
  flagged → approved, rejected, escalated
  approved → escalated
  escalated → approved, rejected
  rejected → [] (terminal)
```

Класс `ReviewStateMachine`.

### 2.5 — Создать `src/lib/state-machines/incident.ts`

```
Статусы: reported, investigating, resolved, closed
Переходы:
  reported → investigating
  investigating → resolved, closed
  resolved → closed
  closed → [] (terminal)
```

Класс `IncidentStateMachine`.

---

## ЗАДАЧА 3: BUSINESS LOGIC

### 3.1 — Создать `src/lib/bookings/short-id.ts`

Генерация human-readable ID для бронирований: `BK-{число}`. Считать текущее количество bookings + 10001.

### 3.2 — Создать `src/lib/models/completeness.ts`

Функция `calculateCompletenessScore(model)` → число 0-100.
Проверяет заполненность полей с весами:
- name (5), photos >= 3 (15), primary photo (5), age (5), height (3), nationality (5), languages (5), hair (3), eye (2), bust (2), services >= 3 (15), categories (5), location (10), availability (10), description (10)

Функция `getMissingFields(model)` → список незаполненных полей.

### 3.3 — Создать `src/lib/models/risk-index.ts`

Функция `calculateModelRiskIndex(modelId)` → 'green' | 'yellow' | 'red'.
- RED: >= 3 no-shows ИЛИ >= 2 incidents ИЛИ avg rating < 3.0
- YELLOW: >= 1 no-show ИЛИ >= 1 incident ИЛИ >= 3 cancellations ИЛИ avg rating < 4.0
- GREEN: всё остальное

---

## ЗАДАЧА 4: НОВЫЕ API ROUTES

### 4.1 — `src/app/api/v1/reviews/route.ts`
GET — список отзывов с фильтрами (status, model_id, page, limit)

### 4.2 — `src/app/api/v1/reviews/[id]/status/route.ts`
PATCH — модерация отзыва (смена статуса через ReviewStateMachine + audit log)

### 4.3 — `src/app/api/v1/reviews/[id]/reply/route.ts`
POST — ответ на отзыв (replyByModel или replyByManager)

### 4.4 — `src/app/api/v1/fraud/clients/[id]/status/route.ts`
GET — получить risk status клиента + последние fraud signals
PATCH — ручное изменение risk status (с audit log)

### 4.5 — `src/app/api/v1/fraud/signals/route.ts`
GET — список fraud signals с фильтрами (client_id, signal_type)

### 4.6 — `src/app/api/v1/incidents/route.ts`
GET — список инцидентов с фильтрами
POST — создание инцидента

### 4.7 — `src/app/api/v1/incidents/[id]/status/route.ts`
PATCH — смена статуса инцидента (через IncidentStateMachine + audit log)

### 4.8 — `src/app/api/v1/models/[id]/status/route.ts`
PATCH — смена статуса модели (через ModelProfileStateMachine + audit log, reason_code для archived)

### 4.9 — `src/app/api/v1/system/health/route.ts`
GET — public health check (DB ping, uptime, latency)

### 4.10 — `src/app/api/v1/seo/pages/route.ts`
GET — список SEO страниц с фильтрами (page_type, index_status)

### 4.11 — `src/app/api/v1/seo/pages/[id]/route.ts`
PATCH — обновление мета-данных SEO страницы

Все API возвращают формат: `{ data: {...} }` при успехе, `{ error: { code, message } }` при ошибке.
Все API, изменяющие состояние, пишут в AuditLog.

---

## ЗАДАЧА 5: RBAC — Новые permissions

**Файл:** `src/lib/rbac/index.ts`

Добавить в тип Permission:
```
'reviews.read', 'reviews.moderate', 'reviews.reply',
'fraud.read', 'fraud.update',
'incidents.read', 'incidents.create', 'incidents.update',
'reports.read', 'reports.generate',
'seo.read', 'seo.update',
'system.health', 'system.metrics'
```

Распределить по ролям:
- OWNER: все новые permissions
- OPS_MANAGER: все кроме system.metrics
- OPERATOR: reviews.read, fraud.read, incidents.read, incidents.create
- FINANCE: reports.read
- CONTENT_MANAGER: seo.read, seo.update, reviews.read

---

## ЗАДАЧА 6: DATA MIGRATION SCRIPT

**Создать файл:** `scripts/migrate-model-statuses.ts`

Скрипт конвертирует старые статусы моделей в новые:
- `active` + `public` → `published`
- `active` + `private/unlisted` → `hidden`
- `inactive` → `hidden`
- `suspended` → `archived`

Запуск: `npx tsx scripts/migrate-model-statuses.ts`

---

## ЗАДАЧА 7: ОБНОВИТЬ ADMIN SIDEBAR

**Файл:** `src/app/admin/layout.tsx`

Добавить в навигацию новые ссылки:
- ⭐ Reviews → /admin/reviews
- ⚠️ Incidents → /admin/incidents
- 🛡️ Fraud Monitor → /admin/fraud
- 🔍 SEO Health → /admin/seo
- 📋 Reports → /admin/reports

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. `prisma/schema.prisma` — все изменения из Задачи 1
2. `npx prisma migrate dev --name backoffice-spec-phase1`
3. `npx prisma generate`
4. State machines — Задача 2 (5 файлов)
5. Business logic — Задача 3 (3 файла)
6. API routes — Задача 4 (11+ файлов)
7. RBAC — Задача 5
8. Migration script — Задача 6
9. Admin sidebar — Задача 7
10. `npm run build` — проверка

---

## ОГРАНИЧЕНИЯ

- **НЕ** трогать публичный фронтенд (app/page.tsx, companions/, escorts-in/, blog/, etc.)
- **НЕ** менять существующие API если они работают — только расширять
- **НЕ** удалять поле `visibility` из Model — оставить для обратной совместимости
- Все новые поля с default values
- `@@map()` для snake_case имён таблиц в PostgreSQL
- Формат ответов API: `{ data: {...} }` / `{ error: { code, message } }`
