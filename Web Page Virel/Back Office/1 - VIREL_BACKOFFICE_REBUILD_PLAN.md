# Virel v3 → Back Office AuraEscort: План перестройки

**Дата:** 3 марта 2026
**Стек:** Next.js 14 · TypeScript · PostgreSQL (Neon) · Prisma · Tailwind · Stripe · Vercel
**Источник:** backoffice_specification.pdf (AuraEscort)

---

## 1. Текущее состояние vs Спецификация

### Что уже есть и работает

| Модуль спеки | Текущая реализация в Virel v3 | Статус |
|---|---|---|
| Lead Management | Inquiry модель, state machine (7 статусов), API v1/inquiries | ✅ Работает |
| Booking Management | Booking + BookingService + BookingTimeline, state machine (9 статусов), API v1/bookings | ✅ Работает |
| Payment & Finance | Payment модель, Stripe client, webhook, deposit intent | ✅ Базовая |
| Model Control | Model + ModelStats + ModelMedia + Services + Attributes | ✅ Работает |
| RBAC | User + Role + Permission + UserRole, 7 ролей, permission-based | ✅ Работает |
| Audit Trail | AuditLog + DomainEvent, append-only | ✅ Работает |
| Integrations Hub | Integration + WebhookIn/Out, Telegram, email/sms уведомления | ✅ Базовая |
| SEO | sitemap.ts, robots.ts, Category SEO-поля, geo-pages | ✅ Частично |
| Onboarding | ModelApplication + parse-anketa + quick-upload | ✅ Частично |
| SLA & Tasks | Task + Exception + SLAPolicy | ✅ Базовая |

### Критические GAP-ы (чего нет)

| # | Чего не хватает | Приоритет | Фаза |
|---|---|---|---|
| 1 | **Client risk management** — risk_status, total_spent, chargeback_count | Высокий | 1 |
| 2 | **Booking short_id** — человеко-читаемый ID (BK-12345) | Высокий | 1 |
| 3 | **Model status alignment** — спека: draft→review→published→hidden→archived | Высокий | 1 |
| 4 | **DataCompletenessScore + ModelRiskIndex** | Средний | 1 |
| 5 | **2FA для Owner** — two_factor_secret в User | Высокий | 1 |
| 6 | **Reviews & Reputation** — Review модель, модерация | Высокий | 2 |
| 7 | **Fraud Detection** — FraudSignal модель, risk engine | Средний | 2 |
| 8 | **Incident Management** — Incident модель + state machine | Средний | 2 |
| 9 | **Revenue Leakage Control** — LostRevenueRegistry | Средний | 2 |
| 10 | **System Health Monitor** — /health, /metrics endpoints | Средний | 2 |
| 11 | **Dynamic Pricing Engine** | Низкий | 3 |
| 12 | **Membership & Subscriptions** — MembershipPlan, ClientMembership | Низкий | 3 |
| 13 | **Owner Analytics / Unit Economics** — 21 метрика | Средний | 3 |
| 14 | **Reporting & Exports** — асинхронная генерация | Низкий | 3 |

### Расхождения в State Machines

**Lead (Inquiry):**
- Virel: `new → qualified → awaiting_client → awaiting_deposit → converted | lost | spam`
- Спека: `new → in_progress → converted | rejected | spam`
- **Решение:** Virel v3 детальнее и лучше для операционки. Оставляем Virel + добавляем `rejected` как алиас `lost`. Маппинг: `qualified + awaiting_client + awaiting_deposit` = `in_progress` для аналитики.

**Booking:**
- Virel: `draft → pending → deposit_required → confirmed → in_progress → completed | cancelled | no_show | expired`
- Спека: `pending_confirmation → confirmed → in_progress → completed | cancelled | disputed`
- **Решение:** Virel v3 полнее (есть deposit_required, no_show, expired). Добавляем `disputed` в Virel. Маппинг: `draft + pending` = `pending_confirmation` для отчётности.

**Payment:**
- Virel: `pending → succeeded | failed | cancelled`
- Спека: `pending → succeeded → refunded | failed | disputed`
- **Решение:** Добавить `refunded` и `disputed` в Virel.

**Model:**
- Virel: `active | inactive | suspended` + `public | private | unlisted`
- Спека: `draft → review → published → hidden → archived`
- **Решение:** Заменить на спеку. Маппинг: `active + public` → `published`, `inactive` → `hidden`, `suspended` → `archived`.

---

## 2. Фаза 1 — Укрепление ядра (2-3 недели)

### 1.1 Prisma Schema — расширение Client

**Файл:** `prisma/schema.prisma`

```prisma
model Client {
  // --- Существующие поля ---
  id              String   @id @default(cuid())
  fullName        String?
  email           String?
  phone           String?
  preferredChannel String?
  tags            String[]

  // --- НОВЫЕ ПОЛЯ (спека) ---
  riskStatus      String   @default("normal") // normal, monitoring, restricted, blocked
  totalSpent      Float    @default(0)
  bookingCount    Int      @default(0)
  chargebackCount Int      @default(0)
  notes           String?  @db.Text

  // Relations
  inquiries       Inquiry[]
  bookings        Booking[]
  reviews         Review[]          // NEW
  fraudSignals    FraudSignal[]     // NEW
  membership      ClientMembership? // Phase 3

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([email])
  @@index([phone])
  @@index([riskStatus])
  @@map("clients")
}
```

### 1.2 Prisma Schema — Booking short_id + disputed

**Файл:** `prisma/schema.prisma`

Добавить в Booking:
```prisma
  shortId         String   @unique @default("") // BK-12345, генерируется при создании
```

Обновить status comment: `// draft, pending, deposit_required, confirmed, in_progress, completed, cancelled, no_show, expired, disputed`

### 1.3 Prisma Schema — Model status alignment

**Файл:** `prisma/schema.prisma`

Изменить Model:
```prisma
  status          String   @default("draft") // draft, review, published, hidden, archived
  // Убрать: visibility (заменяется status: published = видимый)

  // НОВЫЕ ПОЛЯ
  dataCompletenessScore Int    @default(0) // 0-100
  modelRiskIndex        String @default("green") // green, yellow, red
```

### 1.4 Prisma Schema — User 2FA

**Файл:** `prisma/schema.prisma`

Добавить в User:
```prisma
  twoFactorSecret  String?
  twoFactorEnabled Boolean  @default(false)
```

### 1.5 State Machines — обновление

**Файл:** `src/lib/state-machines/booking.ts`
- Добавить `disputed` в BookingStatus type
- Добавить переход: `in_progress → disputed`
- Добавить переход: `disputed → completed | cancelled`

**Файл:** `src/lib/state-machines/inquiry.ts`
- Добавить `rejected` как синоним `lost` или отдельный статус

**Новый файл:** `src/lib/state-machines/model-profile.ts`
```typescript
// draft → review → published → hidden → archived
const MODEL_TRANSITIONS = {
  draft: ['review'],
  review: ['published', 'draft'],
  published: ['hidden', 'archived'],
  hidden: ['published', 'archived'],
  archived: [] // terminal
};
```

**Новый файл:** `src/lib/state-machines/payment.ts`
```typescript
// pending → succeeded | failed
// succeeded → refunded | disputed
const PAYMENT_TRANSITIONS = {
  pending: ['succeeded', 'failed'],
  succeeded: ['refunded', 'disputed'],
  failed: [],
  refunded: [],
  disputed: []
};
```

### 1.6 RBAC — alignment с спекой

**Файл:** `src/lib/rbac/index.ts`

Текущие роли Virel v3 (7 шт) богаче чем спека (4 шт). Оставляем Virel, но добавляем маппинг:
- `OWNER` = спека `owner`
- `OPS_MANAGER` = спека `manager`
- `OPERATOR` = спека `receptionist`
- `FINANCE` = спека `accountant`

Добавить новые permissions:
```typescript
  // Reviews (NEW)
  | 'reviews.read'
  | 'reviews.moderate'
  | 'reviews.reply'
  // Fraud (NEW)
  | 'fraud.read'
  | 'fraud.update'
  // Incidents (NEW)
  | 'incidents.read'
  | 'incidents.create'
  | 'incidents.update'
  // Reports (NEW)
  | 'reports.read'
  | 'reports.generate'
  // Membership (Phase 3)
  | 'membership.read'
  | 'membership.manage'
```

### 1.7 API Routes — новые endpoints для MVP

**Новые файлы:**

| Эндпоинт | Файл | Auth |
|---|---|---|
| `GET /api/v1/system/health` | `src/app/api/v1/system/health/route.ts` | None |
| `GET /api/v1/system/metrics` | `src/app/api/v1/system/metrics/route.ts` | Owner |
| `PATCH /api/v1/models/[id]/status` | `src/app/api/v1/models/[id]/status/route.ts` | Manager+ |
| `GET /api/v1/models/[id]/history` | `src/app/api/v1/models/[id]/history/route.ts` | Manager+ |
| `POST /api/v1/auth/request-2fa` | `src/app/api/v1/auth/request-2fa/route.ts` | User |
| `POST /api/v1/auth/confirm-2fa` | `src/app/api/v1/auth/confirm-2fa/route.ts` | User |

### 1.8 DataCompletenessScore — автоматический расчёт

**Новый файл:** `src/lib/models/completeness.ts`

Формула: проверка заполненности ключевых полей модели. Каждое поле имеет вес. Score = sum(заполненных весов) / sum(всех весов) * 100.

Поля и веса:
- name (10), photos ≥ 5 (15), age (5), height (5), nationality (5), languages (5), services ≥ 3 (10), rates (10), location (10), description (10), availability (15)

### 1.9 Admin UI — обновление sidebar

**Файл:** `src/app/admin/layout.tsx`

Добавить новые разделы в навигацию:
- Reviews (после Models)
- Incidents (Phase 2)
- Reports (Phase 2)
- System Health (после Settings)

---

## 3. Фаза 2 — Новые модули MVP (3-4 недели)

### 2.1 Reviews & Reputation

**Prisma:**
```prisma
model Review {
  id              String   @id @default(cuid())
  bookingId       String   @unique
  booking         Booking  @relation(fields: [bookingId], references: [id])
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  modelId         String
  model           Model    @relation(fields: [modelId], references: [id])
  rating          Int      // 1-5
  text            String?  @db.Text
  status          String   @default("pending") // pending, approved, rejected, flagged, escalated
  isVerifiedBooking Boolean @default(true)
  sentimentScore  Float?   // -1 to 1
  toxicityFlag    Boolean  @default(false)
  suspiciousFlag  Boolean  @default(false)
  replyByModel    String?  @db.Text
  replyByManager  String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([modelId, status])
  @@index([status])
  @@map("reviews")
}
```

**State Machine:** `src/lib/state-machines/review.ts`
- pending → approved | rejected | flagged
- flagged → approved | rejected | escalated
- approved → escalated
- escalated → approved | rejected

**API:** `src/app/api/v1/reviews/`
- `GET /` — список с фильтрами (Manager+)
- `PATCH /[id]/status` — модерация (Manager+)
- `POST /[id]/reply` — ответ (Manager+)

**UI:** `src/app/admin/reviews/page.tsx`

### 2.2 Fraud Detection

**Prisma:**
```prisma
model FraudSignal {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  bookingId       String?
  booking         Booking? @relation(fields: [bookingId], references: [id])
  signalType      String   // high_velocity, chargeback, ip_mismatch
  riskScoreImpact Int
  metadata        Json?
  createdAt       DateTime @default(now())

  @@index([clientId])
  @@index([signalType])
  @@map("fraud_signals")
}
```

**API:** `src/app/api/v1/fraud/`
- `GET /clients/[id]/status` — риск-статус (Receptionist+)
- `PATCH /clients/[id]/status` — ручное изменение (Manager+)
- `GET /signals` — список сигналов (Manager+)

### 2.3 Incident Management

**Prisma:**
```prisma
model Incident {
  id              String    @id @default(cuid())
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id])
  reporterId      String
  accusedId       String
  status          String    @default("reported") // reported, investigating, resolved, closed
  description     String    @db.Text
  resolutionDetails String? @db.Text
  compensationAmount Float?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([status])
  @@index([bookingId])
  @@map("incidents")
}
```

**State Machine:** `src/lib/state-machines/incident.ts`
- reported → investigating
- investigating → resolved | closed
- resolved → closed

### 2.4 Revenue Leakage Control

**Prisma:**
```prisma
model LostRevenueEntry {
  id              String   @id @default(cuid())
  type            String   // missed_booking, unpaid_cancellation, receptionist_error
  amount          Float
  bookingId       String?
  leadId          String?
  rootCause       String
  responsibleRole String   // client, model, receptionist, system
  status          String   @default("open") // open, resolved
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([type, status])
  @@map("lost_revenue_registry")
}
```

### 2.5 System Health Monitor

**API:**
- `GET /api/v1/system/health` — uptime check (public)
- `GET /api/v1/system/metrics` — Prometheus-compatible metrics (Owner)

**Метрики:**
- API response time (p95)
- 5xx error rate
- Active sessions count
- Queue length (if using BullMQ)
- DB connection pool status

### 2.6 SEO — дополнения

**Prisma:**
```prisma
model SEOPage {
  id              String   @id @default(cuid())
  pageType        String   // model_profile, geo_page, blog_post
  path            String   @unique
  title           String
  metaDescription String
  indexStatus     String   @default("indexed") // indexed, not_indexed, blocked
  canonicalUrl    String?
  schemaMarkup    Json?
  lastCrawledAt   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("seo_pages")
}
```

---

## 4. Фаза 3 — Phase 2 модули (4-6 недель)

### Модули:
1. **Dynamic Pricing Engine** — правила ценообразования на основе спроса/времени
2. **Membership & Subscriptions** — MembershipPlan + ClientMembership + SubscriptionInvoice + биллинг
3. **Owner Analytics** — дашборд с 21 метрикой из спеки
4. **Unit Economics** — Profit per Booking, LTV/CAC, Payback Period
5. **Reporting & Exports** — асинхронная генерация отчётов
6. **Data Governance Layer** — автоматические проверки качества данных
7. **SLA Monitoring** — автоматический трекинг + эскалации

---

## 5. Порядок действий для немедленного старта

```
Шаг 1: Prisma migration
  └─ Расширить Client, Booking, Model, User, Payment
  └─ Добавить Review, FraudSignal, Incident, LostRevenueEntry, SEOPage
  └─ npx prisma migrate dev --name backoffice-spec-alignment

Шаг 2: State Machines
  └─ Обновить booking.ts (+ disputed)
  └─ Создать model-profile.ts, payment.ts, review.ts, incident.ts

Шаг 3: API routes
  └─ Новые endpoints по спеке
  └─ Обновить существующие с новыми полями

Шаг 4: RBAC
  └─ Новые permissions
  └─ 2FA для Owner

Шаг 5: Admin UI
  └─ Sidebar обновление
  └─ Новые страницы: Reviews, Incidents, Reports
  └─ DataCompletenessScore виджет в Model profile

Шаг 6: Business Logic
  └─ short_id генерация (BK-XXXXX)
  └─ DataCompletenessScore автоматический расчёт
  └─ ModelRiskIndex правила
  └─ Client risk aggregation
```

---

## 6. Технические решения

| Вопрос | Решение |
|---|---|
| **short_id генерация** | При создании Booking: `BK-${String(count + 10000).slice(1)}` или nanoid |
| **2FA** | TOTP через `otplib` npm пакет, QR через `qrcode` |
| **DataCompletenessScore** | Computed field, пересчитывается при UPDATE модели |
| **ModelRiskIndex** | Правила: Red = >3 no-shows OR >2 incidents; Yellow = 1-3 no-shows; Green = default |
| **Fraud detection** | Rule-based: high_velocity (>5 bookings/hour), chargeback_count > 0, IP mismatch |
| **Review sentiment** | Phase 2: AI scoring через Anthropic API (уже подключен) |
| **System Health** | Next.js API route + cron через Vercel Cron Jobs |
| **Metrics storage** | Vercel Analytics + custom metrics в PostgreSQL |

---

## 7. Риски и митигация

| Риск | Митигация |
|---|---|
| Миграция сломает текущие данные | Все новые поля с default values, nullable где возможно |
| Model status change breaks frontend | Маппинг старых статусов → новые в migration скрипте |
| Vercel limits (serverless) | Тяжёлые операции через Edge Functions или Vercel Cron |
| Neon DB performance | Добавить индексы на новые поля (уже указаны в схеме) |
