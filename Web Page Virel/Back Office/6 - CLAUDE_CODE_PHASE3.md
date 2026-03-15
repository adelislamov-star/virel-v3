# Claude Code — Virel v3 Back Office Rebuild: PHASE 3

**Проект:** `C:\Virel`
**Контекст:** Phase 1 + Phase 2 завершены. Phase 3 — финальные модули: Dynamic Pricing, Membership, Owner Analytics, Unit Economics, SLA Monitoring, Data Governance, Reporting.

> ПЕРЕД НАЧАЛОМ: Запусти `npm run build`. Если есть ошибки от Phase 2 — исправь их сначала.

> СТИЛЬ: Dark theme, Tailwind, shadcn/ui (Card, Badge, Button). `'use client'`. Fetch к `/api/v1/...`. Ответ: `{ data: {...} }`.

---

## ЗАДАЧА 1: PRISMA SCHEMA — Phase 3 модели

**Файл:** `prisma/schema.prisma`

Добавить В КОНЕЦ файла все модели ниже одним блоком:

```prisma
// ============================================
// DYNAMIC PRICING
// ============================================

model PricingRule {
  id              String   @id @default(cuid())
  name            String
  status          String   @default("active") // active, disabled, testing
  priority        Int      @default(0)
  
  conditionType   String   // day_of_week, time_of_day, demand, season, advance_booking
  conditionConfig Json
  
  actionType      String   // multiply, add, set_minimum
  actionValue     Float
  
  appliesTo       String   @default("all") // all, location, model, service
  scopeEntityId   String?
  
  timesApplied    Int      @default(0)
  revenueImpact   Float    @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status, priority])
  @@map("pricing_rules")
}

// ============================================
// MEMBERSHIP & SUBSCRIPTIONS
// ============================================

model MembershipPlan {
  id                     String   @id @default(cuid())
  name                   String
  tier                   Int
  priceMonthly           Float
  currency               String   @default("GBP")
  bookingDiscountPercent Int      @default(0)
  prioritySupportLevel   Int      @default(0)
  perks                  Json?
  status                 String   @default("active") // active, archived
  
  memberships            ClientMembership[]
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  @@map("membership_plans")
}

model ClientMembership {
  id            String    @id @default(cuid())
  clientId      String    @unique
  client        Client    @relation(fields: [clientId], references: [id])
  planId        String
  plan          MembershipPlan @relation(fields: [planId], references: [id])
  
  status        String    @default("pending") // pending, active, past_due, suspended, cancelled, expired
  startedAt     DateTime  @default(now())
  expiresAt     DateTime?
  autoRenew     Boolean   @default(true)
  nextBillingAt DateTime?
  
  invoices      SubscriptionInvoice[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([status])
  @@index([nextBillingAt])
  @@map("client_memberships")
}

model SubscriptionInvoice {
  id                  String   @id @default(cuid())
  clientMembershipId  String
  membership          ClientMembership @relation(fields: [clientMembershipId], references: [id])
  
  amount              Float
  currency            String   @default("GBP")
  status              String   @default("draft") // draft, paid, failed, void
  periodStart         DateTime
  periodEnd           DateTime
  stripeInvoiceId     String?
  paidAt              DateTime?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([clientMembershipId])
  @@index([status])
  @@map("subscription_invoices")
}

// ============================================
// SLA TRACKING
// ============================================

model SLARecord {
  id              String    @id @default(cuid())
  policyId        String
  policy          SLAPolicy @relation(fields: [policyId], references: [id])
  
  entityType      String
  entityId        String
  
  startedAt       DateTime  @default(now())
  deadlineAt      DateTime
  completedAt     DateTime?
  breached        Boolean   @default(false)
  
  escalatedAt     DateTime?
  escalatedTo     String?
  
  @@index([breached, deadlineAt])
  @@index([entityType, entityId])
  @@map("sla_records")
}

// ============================================
// DATA GOVERNANCE
// ============================================

model DataQualityCheck {
  id              String    @id @default(cuid())
  checkType       String    // profile_completeness, outdated_profile, missing_photos, stale_availability, price_anomaly
  entityType      String
  entityId        String
  
  status          String    @default("open") // open, resolved, ignored
  severity        String    @default("warning") // info, warning, error
  details         Json
  
  resolvedAt      DateTime?
  resolvedBy      String?
  
  createdAt       DateTime  @default(now())
  
  @@index([status, severity])
  @@index([entityType, entityId])
  @@map("data_quality_checks")
}
```

Также добавить relation в существующую модель **Client** (найти блок relations в Client, добавить):
```prisma
  membership      ClientMembership?
```

Добавить relation в существующую модель **SLAPolicy** (добавить в конец модели, перед `@@map`):
```prisma
  records         SLARecord[]
```

### Применить:
```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

---

## ЗАДАЧА 2: DYNAMIC PRICING ENGINE

### 2.1 — Создать `src/lib/pricing/engine.ts`

Движок расчёта динамических цен. Функция `calculateDynamicPrice(ctx)`:

Входные данные:
```typescript
type PricingContext = {
  modelId: string;
  locationId?: string;
  startAt: Date;
  durationHours: number;
  basePrice: number;
};
```

Логика:
1. Загрузить все активные PricingRule, отсортированные по priority DESC
2. Для каждого правила проверить scope (all/model/location)
3. Проверить condition:
   - `day_of_week`: ctx.startAt.getDay() входит в config.days[]
   - `time_of_day`: ctx.startAt.getHours() в диапазоне config.fromHour - config.toHour
   - `advance_booking`: часов до бронирования >= config.minHoursAhead
   - `season`: ctx.startAt.getMonth()+1 входит в config.months[]
   - `demand`: количество активных бронирований в это время >= config.threshold
4. Применить action:
   - `multiply`: price *= actionValue (1.2 = +20%)
   - `add`: price += actionValue
   - `set_minimum`: if price < actionValue then price = actionValue
5. Записать adjustment в массив
6. Обновить timesApplied и revenueImpact в PricingRule

Возвращает: `{ finalPrice, basePrice, adjustments: [{ ruleName, type, value, effect }] }`

### 2.2 — Создать `src/app/api/v1/pricing/rules/route.ts`

GET — список правил с фильтром по status, pagination
POST — создание нового правила

### 2.3 — Создать `src/app/api/v1/pricing/rules/[id]/route.ts`

PATCH — обновление правила
DELETE — деактивация (status = 'disabled')

### 2.4 — Создать `src/app/api/v1/pricing/calculate/route.ts`

POST — рассчитать цену для заданного контекста. Body: `{ modelId, locationId?, startAt, durationHours, basePrice }`. Вызывает calculateDynamicPrice.

### 2.5 — Создать `src/app/admin/pricing/page.tsx`

Страница управления ценообразованием:

**Summary cards (3 шт):** Active Rules count, Total Revenue Uplift (£), Total Times Applied

**Таблица правил:**
Колонки: Name, Condition (type as Badge), Action ("×1.2" / "+£50" / "min £300"), Scope, Status Badge, Applied count, Revenue Impact, Actions (Enable/Disable toggle, Edit, Delete)

**Кнопка "+ New Rule"** → форма в модальном окне:
- Name (text)
- Condition Type (select: day_of_week, time_of_day, advance_booking, season, demand)
- Condition Config (textarea — JSON для MVP)
- Action Type (select: multiply, add, set_minimum)
- Action Value (number)
- Applies To (select: all, model, location)
- Priority (number)

**Блок "Price Calculator" внизу страницы:**
Тестовая форма: Model (select), DateTime, Duration, Base Price → кнопка Calculate → показать result с breakdown.

---

## ЗАДАЧА 3: MEMBERSHIP & SUBSCRIPTIONS

### 3.1 — Создать `src/lib/state-machines/membership.ts`

```
Статусы: pending, active, past_due, suspended, cancelled, expired
Переходы:
  pending → active, cancelled
  active → past_due, cancelled
  past_due → active, suspended
  suspended → active, cancelled
  cancelled → [] (terminal)
  expired → [] (terminal)
```

Класс `MembershipStateMachine` — такой же паттерн как остальные state machines.

### 3.2 — Создать API endpoints:

**`src/app/api/v1/membership/plans/route.ts`**
- GET — список планов (Receptionist+)
- POST — создание плана (Owner)

**`src/app/api/v1/membership/plans/[id]/route.ts`**
- PATCH — обновление плана (Owner)
- DELETE — архивация: status = 'archived' (Owner)

**`src/app/api/v1/membership/clients/[clientId]/subscription/route.ts`**
- GET — получить подписку клиента (Receptionist+)
- POST — оформить подписку. Body: `{ planId }`. Создаёт ClientMembership со статусом pending → active. (Receptionist+)
- DELETE — отмена подписки. Body: `{ reasonCode }`. Переводит в cancelled. (Manager+)

**`src/app/api/v1/membership/invoices/route.ts`**
- GET — список счетов с фильтрами (status, clientMembershipId). (Accountant+)

**`src/app/api/v1/membership/stats/route.ts`**
- GET — агрегированные метрики:
  - MRR = SUM(plan.priceMonthly) WHERE membership.status = 'active'
  - Active Subscribers = COUNT WHERE status = 'active'
  - Churn Rate = cancelled_this_month / active_at_month_start * 100
  - ARPU = MRR / active subscribers

### 3.3 — Создать `src/app/admin/membership/page.tsx`

**Layout:** Заголовок "Membership & Subscriptions"

**Summary Cards (4 шт):**
- MRR (Monthly Recurring Revenue) — £ сумма
- Active Subscribers — количество
- Churn Rate — %
- ARPU — £

Данные из: `GET /api/v1/membership/stats`

**Секция 1: Plans**
Таблица планов:
- Name, Tier, Price/month, Discount %, Support Level, Status Badge, Subscribers count
- Actions: Edit, Archive

Кнопка "+ New Plan" → форма: name, tier, priceMonthly, bookingDiscountPercent, prioritySupportLevel, perks (textarea JSON)

**Секция 2: Active Memberships**
Таблица подписок со статусом != cancelled/expired:
- Client name, Plan name, Status Badge, Started, Next Billing, Auto-Renew
- Actions: Cancel (для Manager+)

**Секция 3: Invoices**
Таблица последних 20 инвойсов:
- Client, Plan, Amount, Period, Status Badge (draft=gray, paid=green, failed=red, void=gray), Paid At

---

## ЗАДАЧА 4: OWNER ANALYTICS + UNIT ECONOMICS

### 4.1 — Создать `src/app/api/v1/analytics/owner/route.ts`

Один endpoint, возвращает ВСЕ 21 метрику из спецификации:

```typescript
// GET /api/v1/analytics/owner?period=month (month, week, quarter)
// Returns:
{
  revenue: {
    total: number,            // #1 Revenue
    netMargin: number,        // #2 Net Margin %
    commission: number,       // #3 Commission
    payout: number,           // #4 Payout
  },
  leads: {
    conversionRate: number,   // #5 Lead Conversion Rate %
    avgResponseTime: number,  // #6 Avg Lead Response Time (minutes)
    sourceROI: Record<string, number>, // #13 Lead Source ROI
  },
  operations: {
    slaBreachRate: number,    // #7 SLA Breach Rate %
    cancellationRate: number, // #8 Cancellation Rate %
    bookingVelocity: number,  // #14 Booking Velocity (per day)
    avgOnboardingTime: number, // #15 Avg Onboarding Time (hours)
  },
  risk: {
    chargebackRate: number,   // #9 Chargeback Rate %
    fraudCases: number,       // #10 Fraud Cases
    avgModelRating: number,   // #11 Avg Model Rating
    riskDistribution: { green: number, yellow: number, red: number }, // #12
  },
  system: {
    apiErrorRate: number,     // #16 API 5xx Error Rate %
  },
  membership: {
    mrr: number,              // #17 MRR
    churnRate: number,        // #18 Churn Rate %
    arpu: number,             // #19 ARPU
    ltvCacRatio: number,      // #20 LTV/CAC Ratio
  },
  dataQuality: {
    avgCompletenessScore: number, // #21 DataCompletenessScore
  },
}
```

Каждую метрику рассчитывай из реальных данных в БД по формулам из спеки:
- Revenue = SUM(Payment.amount) WHERE status = 'succeeded' за период
- Net Margin = (Revenue - SUM(payout) - fees) / Revenue
- Lead Conversion = COUNT(converted) / COUNT(all leads) * 100
- Avg Response Time = AVG(firstResponseAt - createdAt) в inquiries
- Cancellation Rate = COUNT(cancelled bookings) / COUNT(all bookings) * 100
- Chargeback Rate = COUNT(disputed payments) / COUNT(succeeded payments) * 100
- И так далее по спеке (секция 6 "Метрики и формулы")

Для метрик, по которым пока нет данных — возвращай 0 или null.

### 4.2 — Создать `src/app/api/v1/analytics/unit-economics/route.ts`

```typescript
// GET /api/v1/analytics/unit-economics?period=month
// Returns:
{
  profitPerBooking: number,    // Revenue per booking - Payout per booking
  avgBookingValue: number,     // AVG booking total
  avgCommission: number,       // AVG commission per booking
  avgPayout: number,           // AVG payout per booking
  ltvEstimate: number,         // ARPU * (1 / churnRate) if membership exists, else ARPU * 12
  cacEstimate: number,         // Placeholder — manual input or 0
  ltvCacRatio: number,         // LTV / CAC
  paybackPeriodMonths: number, // CAC / ARPU
  bySource: [                  // Unit economics per lead source
    { source: string, leads: number, bookings: number, revenue: number, cost: number, roi: number }
  ],
  byModel: [                   // Top 10 models by profit
    { modelId: string, modelName: string, bookings: number, revenue: number, payout: number, profit: number }
  ],
}
```

### 4.3 — Создать `src/app/admin/analytics/owner/page.tsx`

Полный дашборд владельца с 21 метрикой.

**Layout:** Заголовок "Owner Analytics" + период selector (This Week, This Month, This Quarter) + метрики.

**Ряд 1: Revenue (4 карточки)**
- Revenue (£), Net Margin (%), Commission (£), Payout (£)

**Ряд 2: Lead & Operations (4 карточки)**
- Lead Conversion (%), Avg Response Time (min), SLA Breach Rate (%), Cancellation Rate (%)

**Ряд 3: Risk & Quality (4 карточки)**
- Chargeback Rate (%), Fraud Cases, Avg Model Rating (★), Data Completeness (%)

**Ряд 4: Membership (4 карточки)**
- MRR (£), Churn Rate (%), ARPU (£), LTV/CAC Ratio

**Ряд 5: System**
- API Error Rate (%), Booking Velocity (/day), Avg Onboarding Time (hrs)

**Каждая карточка:**
- Большое число (значение метрики)
- Подпись (название метрики)
- Цвет: зелёный если в нормальном диапазоне, красный если вне (по спеке: chargeback > 0.5% = красный, SLA breach > 2% = красный, etc.)

Загрузка: `GET /api/v1/analytics/owner?period={selected}`

### 4.4 — Создать `src/app/admin/analytics/unit-economics/page.tsx`

**Layout:** Заголовок "Unit Economics"

**Summary Cards:**
- Profit per Booking, Avg Booking Value, LTV, CAC, LTV/CAC Ratio, Payback Period

**Таблица: "By Lead Source"**
Source, Leads, Bookings, Revenue, Cost, ROI

**Таблица: "Top Models by Profit"**
Model, Bookings, Revenue, Payout, Profit

Загрузка: `GET /api/v1/analytics/unit-economics?period=month`

---

## ЗАДАЧА 5: SLA MONITORING

### 5.1 — Создать `src/lib/sla/tracker.ts`

```typescript
// SLA Tracker — creates and monitors SLA records

// createSLARecord(policyId, entityType, entityId) — создаёт запись с deadlineAt = now + policy.deadlineMinutes
// completeSLA(entityType, entityId) — находит open SLA record и помечает completedAt = now
// checkBreaches() — находит все records где deadlineAt < now AND completedAt IS NULL, помечает breached = true
// getBreachedRecords(limit) — возвращает breached records для алертов
```

### 5.2 — Создать `src/app/api/v1/sla/records/route.ts`

GET — список SLA records с фильтрами: breached (true/false), entityType, page, limit
Возвращает records с join на policy name.

### 5.3 — Создать `src/app/api/v1/sla/stats/route.ts`

GET — агрегированные SLA метрики:
- Total SLA records (period)
- Breach Rate = breached / total * 100
- Avg Response Time (completed - started)
- By Type breakdown

### 5.4 — Создать `src/app/api/v1/sla/check-breaches/route.ts`

POST — запуск проверки нарушений (для вызова через cron):
- Находит все records где deadlineAt < now AND completedAt IS NULL AND breached = false
- Помечает breached = true
- Возвращает количество новых нарушений

### 5.5 — Создать `src/app/admin/sla/page.tsx`

Заменить placeholder на полноценную страницу.

**Summary Cards:**
- SLA Breach Rate (%)
- Avg First Response Time
- Active SLA Tracking — количество открытых записей
- Breached Today — количество нарушений за сегодня

**Таблица: "Breached SLAs" (последние 50)**
- Entity Type + ID (ссылка)
- Policy Name
- Deadline
- Overdue By (time since deadline)
- Escalated To

**Таблица: "All SLA Records" с фильтрами**
- Entity, Policy, Started, Deadline, Completed, Breached (Badge), Duration

---

## ЗАДАЧА 6: DATA GOVERNANCE

### 6.1 — Создать `src/lib/data-governance/checker.ts`

Функция `runDataQualityChecks()` которая:

1. **Profile Completeness** — для каждой published модели с dataCompletenessScore < 80:
   - Создать DataQualityCheck: checkType = 'profile_completeness', severity = score < 50 ? 'error' : 'warning'

2. **Outdated Profiles** — модели с updatedAt > 30 дней назад:
   - checkType = 'outdated_profile', severity = 'warning'

3. **Missing Photos** — модели с < 3 публичных фото:
   - checkType = 'missing_photos', severity = 'error'

4. **Stale Availability** — модели без availability slots в следующие 7 дней:
   - checkType = 'stale_availability', severity = 'warning'

Пропускает уже существующие open checks для того же entity (чтобы не дублировать).

### 6.2 — Создать `src/app/api/v1/data-governance/checks/route.ts`

GET — список checks с фильтрами: status, checkType, severity, entityType. Pagination.

### 6.3 — Создать `src/app/api/v1/data-governance/checks/[id]/route.ts`

PATCH — обновить статус: resolve (status = 'resolved', resolvedAt, resolvedBy) или ignore (status = 'ignored')

### 6.4 — Создать `src/app/api/v1/data-governance/run/route.ts`

POST — запустить runDataQualityChecks(). Для вызова через cron или вручную.
Возвращает: { newChecks: N, existing: N }

### 6.5 — Создать `src/app/admin/data-governance/page.tsx`

**Summary Cards:**
- Open Issues — COUNT status = 'open'
- Errors — COUNT severity = 'error' AND status = 'open' (красный)
- Warnings — COUNT severity = 'warning' AND status = 'open' (жёлтый)
- Avg Completeness Score

**Кнопка "Run Checks Now"** → POST /api/v1/data-governance/run → refresh

**Таблица:**
- Check Type Badge
- Entity (link to model/client)
- Severity Badge (error=red, warning=yellow, info=blue)
- Status Badge (open=red, resolved=green, ignored=gray)
- Details (short summary from JSON)
- Created
- Actions: Resolve / Ignore

---

## ЗАДАЧА 7: REPORTING & EXPORTS (улучшение)

### 7.1 — Создать `src/app/api/v1/reports/lost-revenue/route.ts`

```typescript
// GET /api/v1/reports/lost-revenue?from=...&to=...
// Returns: {
//   totalLost: number,
//   byType: [{ type, count, amount }],
//   byResponsible: [{ role, count, amount }],
//   entries: [{ id, type, amount, rootCause, responsibleRole, status, createdAt }]
// }
```

### 7.2 — Создать `src/app/api/v1/reports/export/route.ts`

```typescript
// POST /api/v1/reports/export
// Body: { reportType: 'revenue'|'bookings'|'models'|'lost_revenue', from, to, format: 'csv' }
// Returns: CSV file as download
// Генерирует CSV из данных соответствующего отчёта и возвращает как blob
```

### 7.3 — Обновить `src/app/admin/reports/page.tsx`

Добавить к каждому типу отчёта:
- Кнопка "Export CSV" рядом с "Generate"
- При клике → POST /api/v1/reports/export → скачивание файла

---

## ЗАДАЧА 8: ОБНОВИТЬ ADMIN SIDEBAR

**Файл:** `src/app/admin/layout.tsx`

Добавить новые ссылки (после существующих):
- 💰 Pricing → /admin/pricing
- 👑 Membership → /admin/membership
- ⏱️ SLA Monitor → /admin/sla (заменить placeholder)
- 🔎 Data Quality → /admin/data-governance

В секции Analytics добавить:
- 📈 Owner Analytics → /admin/analytics/owner
- 💹 Unit Economics → /admin/analytics/unit-economics

---

## ЗАДАЧА 9: CRON JOBS (Vercel Cron)

### Создать `src/app/api/cron/sla-check/route.ts`

```typescript
// Вызывается Vercel Cron каждые 5 минут
// Проверяет SLA breaches и отправляет алерты
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check breaches
  // POST to /api/v1/sla/check-breaches logic
  // Return results
}
```

### Создать `src/app/api/cron/data-quality/route.ts`

```typescript
// Вызывается Vercel Cron раз в день (00:00 UTC)
// Запускает data quality checks
```

### Создать/обновить `vercel.json` — добавить cron config:

```json
{
  "crons": [
    { "path": "/api/cron/sla-check", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/data-quality", "schedule": "0 0 * * *" }
  ]
}
```

Учти что vercel.json уже может существовать — в этом случае ДОБАВЬ секцию crons, не перезаписывай весь файл.

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. `npm run build` — проверить что Phase 2 чистая
2. Prisma schema — Задача 1
3. `npx prisma db push --accept-data-loss` + `npx prisma generate`
4. Dynamic Pricing (engine + API + page) — Задача 2
5. Membership (state machine + API + page) — Задача 3
6. Owner Analytics + Unit Economics (API + pages) — Задача 4
7. SLA Monitoring (tracker + API + page) — Задача 5
8. Data Governance (checker + API + page) — Задача 6
9. Reporting improvements — Задача 7
10. Sidebar update — Задача 8
11. Cron jobs — Задача 9
12. `npm run build` — финальная проверка

---

## ОГРАНИЧЕНИЯ

- **НЕ** трогать публичный фронтенд
- **НЕ** ломать существующие Phase 1 + Phase 2 файлы
- Все новые Prisma поля с default values
- `@@map()` для snake_case имён таблиц
- Формат API: `{ data: {...} }` / `{ error: { code, message } }`
- Все admin страницы: loading state, error handling, dark theme
- Для CSV export: используй simple string concatenation (не нужна библиотека)
- vercel.json — merge с существующим, не перезаписывать
