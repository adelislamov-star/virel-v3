# Claude Code — Virel v3 Back Office Rebuild: PHASE 2

**Проект:** `C:\Virel`
**Контекст:** Phase 1 завершена — Prisma schema, state machines, API routes, RBAC, business logic на месте. Теперь строим фронтенд admin-панели для всех новых модулей.

> СТИЛЬ UI: Как в существующих страницах — dark theme, Tailwind CSS, shadcn/ui компоненты (Card, CardContent, CardHeader, CardTitle из `@/components/ui/card`, Badge из `@/components/ui/badge`, Button из `@/components/ui/button`). Все страницы — `'use client'`. Данные загружаются через `fetch('/api/v1/...')`. Формат ответа API: `{ data: { ... } }`.

> ВАЖНО: Посмотри существующие страницы (`src/app/admin/bookings/page.tsx`, `src/app/admin/inquiries/page.tsx`) чтобы повторить стиль, паттерны загрузки данных и компоновку. Делай новые страницы в таком же стиле.

---

## ЗАДАЧА 1: СТРАНИЦА REVIEWS

### Создать `src/app/admin/reviews/page.tsx`

Страница модерации отзывов.

**Layout:** Заголовок "Reviews & Reputation" + фильтры + таблица.

**Фильтры (горизонтальная полоса вверху):**
- Status: кнопки-табы "All | Pending | Approved | Flagged | Escalated | Rejected"
- Счётчик: показывать total рядом с заголовком

**Таблица (колонки):**
- Model — имя модели (ссылка на `/admin/models/{id}`)
- Client — имя клиента
- Rating — звёзды (отображать как ★★★★☆ с числом)
- Review — текст отзыва, обрезанный до 100 символов
- Flags — если toxicityFlag или suspiciousFlag — показать красный/оранжевый Badge
- Status — Badge с цветом: pending=yellow, approved=green, rejected=red, flagged=orange, escalated=purple
- Date — относительная дата (date-fns `formatDistanceToNow`)
- Actions — кнопки в зависимости от текущего статуса:
  - pending → Approve (green), Reject (red), Flag (orange)
  - flagged → Approve, Reject, Escalate (purple)
  - escalated → Approve, Reject
  - approved → Escalate

**Логика:**
- Загрузка: `GET /api/v1/reviews?status={filter}&page={page}&limit=20`
- Смена статуса: `PATCH /api/v1/reviews/{id}/status` с body `{ status: "approved" }`
- После смены статуса — перезагрузка данных (вызвать loadReviews())
- Пагинация: Previous / Next кнопки внизу

**Дополнительно:**
- При клике на строку — раскрывается блок с полным текстом отзыва, ответами (replyByModel, replyByManager), и формой для ответа менеджера
- Форма ответа: textarea + кнопка "Reply as Manager" → `POST /api/v1/reviews/{id}/reply` с body `{ text, authorRole: "manager" }`

---

## ЗАДАЧА 2: СТРАНИЦА INCIDENTS

### Создать `src/app/admin/incidents/page.tsx`

Список инцидентов с возможностью создания новых.

**Layout:** Заголовок "Incident Management" + кнопка "+ New Incident" + фильтры + таблица.

**Фильтры:**
- Status: кнопки-табы "All | Reported | Investigating | Resolved | Closed"
- Severity: dropdown "All | Critical | High | Medium | Low"

**Таблица (колонки):**
- # — порядковый номер (или первые 8 символов ID)
- Booking — shortId если есть, иначе "—"
- Reporter — тип (client/model/staff) как Badge
- Severity — Badge: critical=red, high=orange, medium=yellow, low=gray
- Status — Badge: reported=red, investigating=yellow, resolved=green, closed=gray
- Description — обрезанная до 80 символов
- Compensation — сумма если есть, иначе "—"
- Date — относительная дата
- Actions — кнопки переходов:
  - reported → Investigate
  - investigating → Resolve, Close
  - resolved → Close

**Кнопка "+ New Incident":**
Открывает модальное окно (или inline форму) с полями:
- Booking ID (text input, optional)
- Reporter Type (select: client, model, staff)
- Severity (select: low, medium, high, critical)
- Description (textarea, required)
- Submit → `POST /api/v1/incidents`

**Логика:**
- Загрузка: `GET /api/v1/incidents?status={}&severity={}&page={}&limit=20`
- Смена статуса: `PATCH /api/v1/incidents/{id}/status` с body `{ status, resolutionDetails?, compensationAmount? }`
- При переходе в "Resolve" — показать доп. поля: resolution details (textarea), compensation amount (number input)

---

## ЗАДАЧА 3: СТРАНИЦА FRAUD MONITOR

### Создать `src/app/admin/fraud/page.tsx`

Dashboard мониторинга фрода.

**Layout:** Заголовок "Fraud Monitor" + summary cards + две таблицы.

**Summary Cards (4 карточки в ряд, как в dashboard):**

Для получения данных — сделай запросы к существующим API или создай один новый endpoint.

Вариант: Загрузить данные несколькими fetch-запросами:
- Clients at risk: `GET /api/v1/fraud/clients?riskStatus=monitoring,restricted,blocked` (нужно создать новый endpoint — см. ниже)
- Fraud signals: `GET /api/v1/fraud/signals`

Карточки:
1. "Clients Monitored" — количество клиентов с riskStatus != normal
2. "Blocked" — количество клиентов с riskStatus = blocked (красный цвет)
3. "Signals This Week" — количество fraud signals за 7 дней
4. "Chargebacks" — сумма chargebackCount по всем клиентам

**Таблица 1: "Clients at Risk"**
Клиенты с riskStatus != 'normal':
- Name, Phone, Email
- Risk Status — Badge: monitoring=yellow, restricted=orange, blocked=red
- Total Spent, Bookings, Chargebacks
- Actions: кнопка для смены статуса (dropdown: normal, monitoring, restricted, blocked)

Загрузка: Нужен новый API endpoint.

**Таблица 2: "Recent Fraud Signals"**
Последние 20 сигналов:
- Client name
- Signal Type — Badge
- Risk Score Impact — число
- Booking (shortId если привязан)
- Date

Загрузка: `GET /api/v1/fraud/signals?limit=20`

### Создать новый API: `src/app/api/v1/fraud/clients/route.ts`

```typescript
// GET /api/v1/fraud/clients — list clients with risk status filter
// Query params: riskStatus (comma-separated), page, limit
// Returns clients with riskStatus != 'normal' by default
```

### Создать новый API: `src/app/api/v1/fraud/stats/route.ts`

```typescript
// GET /api/v1/fraud/stats — aggregated fraud statistics
// Returns: { clientsMonitored, clientsBlocked, signalsThisWeek, totalChargebacks }
```

---

## ЗАДАЧА 4: СТРАНИЦА SEO HEALTH

### Создать `src/app/admin/seo/page.tsx`

Dashboard здоровья SEO.

**Layout:** Заголовок "SEO Health" + summary cards + таблица страниц.

**Summary Cards:**
1. "Total Pages" — общее количество SEO страниц
2. "Indexed" — количество со статусом indexed (зелёный)
3. "Not Indexed" — количество not_indexed (жёлтый)
4. "Blocked" — количество blocked (красный)

**Таблица SEO Pages:**
- Path — URL путь
- Title — заголовок страницы
- Type — page_type как Badge (model_profile=blue, geo_page=green, blog_post=purple, service_page=orange)
- Index Status — Badge: indexed=green, not_indexed=yellow, blocked=red
- Last Crawled — дата или "Never"
- Actions — Edit (открывает inline форму для правки title и metaDescription)

**Фильтры:**
- Page Type: All | Model Profile | Geo Page | Blog Post | Service Page
- Index Status: All | Indexed | Not Indexed | Blocked

**Логика:**
- Загрузка: `GET /api/v1/seo/pages?pageType={}&indexStatus={}&page={}&limit=50`
- Редактирование: `PATCH /api/v1/seo/pages/{id}` с body `{ title, metaDescription, indexStatus }`

### Автоматическое заполнение SEO Pages

Создать скрипт `scripts/seed-seo-pages.ts` который:
1. Находит все published модели и создаёт SEO записи для их профильных страниц
2. Находит все locations (districts) и создаёт SEO записи для гео-страниц
3. Пропускает уже существующие (по path)

```typescript
// npx tsx scripts/seed-seo-pages.ts
// Создаёт SEOPage записи для:
// - /companions/{slug} — для каждой published модели
// - /escorts-in/{slug} — для каждой активной локации
// - /services/{slug} — для каждого активного сервиса
```

---

## ЗАДАЧА 5: СТРАНИЦА REPORTS

### Создать `src/app/admin/reports/page.tsx`

Простая страница с генерацией отчётов (placeholder для Phase 3, но функциональная).

**Layout:** Заголовок "Reports & Exports" + карточки с типами отчётов.

**Карточки отчётов (по одной на тип):**

1. **Revenue Report**
   - Описание: "Revenue, commission, and payout summary"
   - Date range picker (from/to)
   - Кнопка "Generate" → загружает данные и показывает таблицу

2. **Bookings Report**
   - Описание: "Booking statistics by status, model, and period"
   - Date range picker
   - Кнопка "Generate"

3. **Model Performance**
   - Описание: "Rating, booking count, and completeness per model"
   - Кнопка "Generate"

4. **Lost Revenue**
   - Описание: "Revenue leakage incidents and root causes"
   - Date range picker
   - Кнопка "Generate"

Для MVP: при нажатии Generate — делать fetch к соответствующему API и показывать результаты в таблице прямо на странице. Не нужно асинхронной генерации.

### Создать API: `src/app/api/v1/reports/revenue/route.ts`

```typescript
// GET /api/v1/reports/revenue?from=2026-01-01&to=2026-03-01
// Returns: { totalRevenue, totalCommission, totalPayout, bookingCount, avgBookingValue }
// Считает из таблиц Payment (succeeded) и Booking (completed)
```

### Создать API: `src/app/api/v1/reports/bookings/route.ts`

```typescript
// GET /api/v1/reports/bookings?from=...&to=...
// Returns: { byStatus: { completed: N, cancelled: N, ... }, byModel: [...], total }
```

### Создать API: `src/app/api/v1/reports/models/route.ts`

```typescript
// GET /api/v1/reports/models
// Returns: [{ id, name, avgRating, bookingCount, completenessScore, riskIndex }]
```

---

## ЗАДАЧА 6: ОБНОВИТЬ DASHBOARD

### Обновить `src/app/admin/dashboard/page.tsx`

Добавить ключевые метрики из спецификации. Dashboard должен показывать:

**Ряд 1: Revenue Metrics (4 карточки)**
- Revenue (this month) — SUM payments WHERE succeeded
- Commission — SUM booking.commission_amount WHERE completed
- Avg Booking Value — AVG booking.priceTotal WHERE completed
- MRR — пока 0 (Phase 3: membership)

**Ряд 2: Operations Metrics (4 карточки)**
- Active Bookings — COUNT bookings WHERE status IN (confirmed, in_progress)
- Cancellation Rate — cancelled / total bookings * 100
- Open Incidents — COUNT incidents WHERE status NOT IN (closed)
- Pending Reviews — COUNT reviews WHERE status = pending

**Ряд 3: Model Metrics (3 карточки)**
- Published Models — COUNT models WHERE status = published
- Avg Completeness Score — AVG model.dataCompletenessScore
- Risk Distribution — Green: N, Yellow: N, Red: N

**Ряд 4: Quick Links**
- Карточки-ссылки: "Review Queue ({pending count})", "Open Incidents ({count})", "Fraud Alerts ({count})"

### Создать API: `src/app/api/v1/analytics/dashboard/route.ts`

Один endpoint который возвращает все метрики для dashboard:

```typescript
// GET /api/v1/analytics/dashboard
// Returns: {
//   revenue: { total, commission, avgBookingValue, mrr },
//   operations: { activeBookings, cancellationRate, openIncidents, pendingReviews },
//   models: { published, avgCompleteness, riskDistribution: { green, yellow, red } },
//   quickLinks: { pendingReviews, openIncidents, fraudAlerts }
// }
```

---

## ЗАДАЧА 7: ОБНОВИТЬ ACTION CENTER

### Обновить `src/app/admin/action-center/page.tsx`

Добавить в Action Center новые типы элементов:

- Pending Reviews (тип: review, ссылка на /admin/reviews)
- Open Incidents (тип: incident, ссылка на /admin/incidents/{id})
- Fraud Alerts (тип: fraud_alert, ссылка на /admin/fraud)

Загружать дополнительно:
- `GET /api/v1/reviews?status=pending&limit=5`
- `GET /api/v1/incidents?status=reported,investigating&limit=5`
- `GET /api/v1/fraud/signals?limit=5`

Добавить эти элементы в общий список action items, отсортированный по приоритету.

---

## ЗАДАЧА 8: СОЗДАТЬ PLACEHOLDER СТРАНИЦЫ

Для страниц которые будут полноценно реализованы в Phase 3, создать минимальные placeholder'ы:

### Создать `src/app/admin/revenue-leakage/page.tsx`

Placeholder: заголовок "Revenue Leakage Control", текст "Coming in Phase 3", ссылка на /admin/reports.

### Создать `src/app/admin/sla/page.tsx`

Placeholder: заголовок "SLA Monitoring", текст "Coming in Phase 3".

---

## ЗАДАЧА 9: ПОЧИНИТЬ service_categories REFERENCE

В файле `src/app/api/v1/services/route.ts` — найти и убрать reference на таблицу `service_categories` (она была удалена). Заменить на прямой запрос к таблице `services`.

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. Новые API endpoints (dashboard, fraud stats/clients, reports) — Задачи 3, 5, 6
2. Reviews page — Задача 1
3. Incidents page — Задача 2
4. Fraud Monitor page — Задача 3
5. SEO Health page — Задача 4
6. Reports page — Задача 5
7. Dashboard update — Задача 6
8. Action Center update — Задача 7
9. Placeholder pages — Задача 8
10. Fix service_categories — Задача 9
11. SEO seed script — Задача 4
12. `npm run build` — финальная проверка

---

## ОГРАНИЧЕНИЯ

- **НЕ** трогать публичный фронтенд
- **НЕ** менять существующие рабочие страницы (bookings, inquiries, models, applications, availability)
- Стиль — как в существующих admin страницах (dark theme, Card/Badge/Button из shadcn/ui)
- Все fetch запросы с error handling (try/catch, loading state, error state)
- Каждая страница показывает loading skeleton пока данные грузятся
- Используй `date-fns` для форматирования дат (уже в dependencies)
