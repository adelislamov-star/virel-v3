# 🗺️ IMPLEMENTATION ROADMAP

## Документ: План реализации Operations Platform
**Дата:** 27 февраля 2026  
**Версия:** 3.0

---

## 📚 ОГЛАВЛЕНИЕ

1. [Overview](#overview)
2. [Release 1: Foundation](#release-1-foundation)
3. [Release 2: Operations](#release-2-operations)
4. [Release 3: Advanced](#release-3-advanced)
5. [Technical Stack](#technical-stack)
6. [Development Workflow](#development-workflow)

---

## 1. OVERVIEW

### 🎯 Цель:

Построить **Operations Platform** в 3 релиза:

```
Release 1 (2-3 weeks): Foundation
├─ Auth + RBAC
├─ Models CRUD
├─ Inquiries + Bookings
├─ Tasks + Exceptions
└─ Basic Action Center

Release 2 (2-3 weeks): Operations
├─ Payments (Stripe)
├─ Availability Management
├─ Automation Engine v1
└─ Notifications

Release 3 (2-3 weeks): Advanced
├─ Partner Integrations
├─ Analytics & Reports
├─ SLA + Escalations
└─ Advanced Search
```

---

### 📊 Current Status:

```yaml
Virel v2 (существующий):
  Status: ✅ MVP готов
  Database: 17 tables (v2)
  Features:
    - Models CRUD
    - Basic Bookings
    - SEO Whitelist (17 pages)
    - Admin Dashboard (basic)
  Location: C:\Virel
  
Operations Platform v3 (новый):
  Status: 🚧 Planning
  Database: 30+ tables (v3)
  Features: See Release 1, 2, 3
  Location: C:\Virel (будем расширять v2)
```

---

## 2. RELEASE 1: FOUNDATION

### ⏱️ Timeline: 2-3 weeks

### 🎯 Goals:

- ✅ Базовая инфраструктура
- ✅ Auth + RBAC система
- ✅ Core entities (Models, Inquiries, Bookings)
- ✅ Tasks + Exceptions
- ✅ Basic Action Center UI
- ✅ Audit Log

---

### 📦 Features:

#### **Week 1: Database + Auth**

**Day 1-2: Database Migration v2 → v3**
```sql
Tasks:
1. Создать новые таблицы:
   - users (уже есть)
   - roles, permissions, role_permissions, user_roles
   - clients (новая)
   - inquiries (новая)
   - tasks (новая)
   - exceptions (новая)
   - audit_log (новая)

2. Расширить существующие:
   - models: добавить public_code, rating_internal, notes_internal
   - bookings: добавить inquiry_id, deposit_required, deposit_status

3. Seed data:
   - Roles: OWNER, OPS_MANAGER, OPERATOR, CONTENT_MANAGER, FINANCE
   - Permissions: bookings.read, bookings.update, etc.
   - Users: обновить существующих + добавить роли

Status: 🚧 TODO
```

**Day 3-5: Authentication System**
```typescript
Tasks:
1. Установить NextAuth.js
2. JWT + Refresh tokens
3. RBAC middleware
4. Entity-level policies
5. Session management

Files to create:
- src/lib/auth.ts
- src/middleware.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/lib/rbac.ts

Status: 🚧 TODO
```

---

#### **Week 2: Core Entities**

**Day 1-2: Clients + Inquiries**
```typescript
Tasks:
1. Prisma models
2. API endpoints:
   - POST /api/v1/clients
   - GET  /api/v1/clients/:id
   - POST /api/v1/inquiries
   - GET  /api/v1/inquiries
   - GET  /api/v1/inquiries/:id
   - POST /api/v1/inquiries/:id/status (state machine)
   - POST /api/v1/inquiries/:id/match
   - POST /api/v1/inquiries/:id/convert-to-booking

3. State machine для Inquiry
4. Basic matching algorithm

Files:
- src/app/api/v1/clients/route.ts
- src/app/api/v1/inquiries/route.ts
- src/lib/state-machines/inquiry.ts
- src/lib/matching/simple-matcher.ts

Status: 🚧 TODO
```

**Day 3-5: Bookings Enhancement**
```typescript
Tasks:
1. Расширить Booking API:
   - POST /api/v1/bookings/:id/status (state machine)
   - GET  /api/v1/bookings/:id/timeline
   - POST /api/v1/bookings/:id/services

2. State machine для Booking
3. Timeline tracking
4. Link Inquiry → Booking

Files:
- src/app/api/v1/bookings/[id]/status/route.ts
- src/app/api/v1/bookings/[id]/timeline/route.ts
- src/lib/state-machines/booking.ts

Status: 🚧 TODO
```

---

#### **Week 3: Tasks, Exceptions, Action Center**

**Day 1-2: Tasks + Exceptions**
```typescript
Tasks:
1. API endpoints:
   - GET  /api/v1/tasks
   - POST /api/v1/tasks
   - POST /api/v1/tasks/:id/status
   - POST /api/v1/tasks/:id/assign
   - GET  /api/v1/exceptions
   - POST /api/v1/exceptions/:id/resolve

2. Auto-create tasks при событиях
3. SLA tracking (basic)

Files:
- src/app/api/v1/tasks/route.ts
- src/app/api/v1/exceptions/route.ts
- src/lib/tasks/auto-create.ts

Status: 🚧 TODO
```

**Day 3-5: Action Center UI**
```typescript
Tasks:
1. Action Center page:
   - Список tasks + exceptions
   - Sorting по priority + SLA
   - Quick actions (Confirm, Assign, Resolve)
   - Card sidebar pattern

2. WebSocket connection (basic)
3. Realtime updates

Files:
- src/app/(admin)/action-center/page.tsx
- src/components/action-center/ActionList.tsx
- src/components/action-center/ActionCard.tsx
- src/lib/websocket/client.ts

Status: 🚧 TODO
```

**Day 6-7: Audit Log**
```typescript
Tasks:
1. Audit middleware
2. Записывать все изменения
3. API endpoint:
   - GET /api/v1/audit?entity_type=&entity_id=

Files:
- src/lib/audit/middleware.ts
- src/app/api/v1/audit/route.ts

Status: 🚧 TODO
```

---

### ✅ Release 1 Acceptance Criteria:

```yaml
Auth:
  ✓ Operator может залогиниться
  ✓ Видит только свои задачи
  ✓ Не видит финансы

Models:
  ✓ CRUD работает
  ✓ Media upload
  ✓ Status transitions через state machine

Inquiries:
  ✓ Создание из web form
  ✓ Status transitions
  ✓ Basic matching
  ✓ Convert to Booking

Bookings:
  ✓ CRUD работает
  ✓ Status transitions
  ✓ Timeline tracking
  ✓ Link с Inquiry

Action Center:
  ✓ Operator видит свои tasks
  ✓ Может подтвердить booking
  ✓ Может resolve exception
  ✓ Realtime updates работают

Audit:
  ✓ Все изменения логируются
  ✓ Можно посмотреть историю
```

---

## 3. RELEASE 2: OPERATIONS

### ⏱️ Timeline: 2-3 weeks

### 🎯 Goals:

- ✅ Payments (Stripe)
- ✅ Availability Management
- ✅ Automation Engine v1
- ✅ Notifications (Email, SMS, Telegram)

---

### 📦 Features:

#### **Week 1: Payments**

**Day 1-3: Stripe Integration**
```typescript
Tasks:
1. Setup Stripe:
   - API keys
   - Webhooks
   - Payment Intents

2. API endpoints:
   - POST /api/v1/bookings/:id/payments/deposit-intent
   - POST /api/v1/payments/webhook/stripe
   - POST /api/v1/payments/:id/retry
   - POST /api/v1/payments/:id/refund

3. Payment flow:
   - Client pays deposit
   - Webhook обрабатывается
   - Booking status → confirmed
   - Task создаётся автоматически

Files:
- src/lib/stripe/client.ts
- src/app/api/v1/payments/webhook/stripe/route.ts
- src/app/api/v1/bookings/[id]/payments/deposit-intent/route.ts

Status: 🚧 TODO
```

**Day 4-5: Payment UI**
```typescript
Tasks:
1. Payment form на booking page
2. Payment status tracking
3. Retry failed payments

Files:
- src/components/payments/DepositForm.tsx
- src/app/(admin)/bookings/[id]/payments/page.tsx

Status: 🚧 TODO
```

---

#### **Week 2: Availability**

**Day 1-3: Availability Slots**
```typescript
Tasks:
1. API endpoints:
   - GET  /api/v1/availability/slots?model_id=&from=&to=
   - POST /api/v1/availability/slots
   - PATCH /api/v1/availability/slots/:id

2. Rules engine (basic)
3. Mismatch detection

Files:
- src/app/api/v1/availability/slots/route.ts
- src/lib/availability/rules.ts
- src/lib/availability/detect-mismatches.ts

Status: 🚧 TODO
```

**Day 4-5: Calendar UI**
```typescript
Tasks:
1. Calendar component
2. Drag-and-drop slots
3. Conflict detection

Files:
- src/components/availability/Calendar.tsx
- src/app/(admin)/availability/page.tsx

Status: 🚧 TODO
```

---

#### **Week 3: Automation + Notifications**

**Day 1-3: Automation Engine v1**
```typescript
Tasks:
1. API endpoints:
   - GET  /api/v1/automation/rules
   - POST /api/v1/automation/rules
   - POST /api/v1/automation/rules/:id/test

2. Rule execution engine
3. Basic triggers:
   - inquiry.created
   - booking.status_changed
   - payment.succeeded

4. Basic actions:
   - create_task
   - update_status
   - send_notification

Files:
- src/app/api/v1/automation/rules/route.ts
- src/lib/automation/engine.ts
- src/lib/automation/triggers.ts
- src/lib/automation/actions.ts

Status: 🚧 TODO
```

**Day 4-5: Notifications**
```typescript
Tasks:
1. Setup providers:
   - Email (Resend)
   - SMS (Twilio)
   - Telegram

2. Notification queue
3. Templates

Files:
- src/lib/notifications/email.ts
- src/lib/notifications/sms.ts
- src/lib/notifications/telegram.ts
- src/lib/notifications/queue.ts

Status: 🚧 TODO
```

---

### ✅ Release 2 Acceptance Criteria:

```yaml
Payments:
  ✓ Stripe работает
  ✓ Deposit payment flow
  ✓ Webhook обрабатывается
  ✓ Booking auto-confirms после payment
  ✓ Failed payments создают exception

Availability:
  ✓ Можно создать slots
  ✓ Calendar UI работает
  ✓ Conflicts обнаруживаются
  ✓ Mismatches создают exception

Automation:
  ✓ Можно создать rule
  ✓ Rules срабатывают на события
  ✓ Actions выполняются
  ✓ Logs сохраняются

Notifications:
  ✓ Email отправляются
  ✓ SMS работает
  ✓ Telegram notifications
```

---

## 4. RELEASE 3: ADVANCED

### ⏱️ Timeline: 2-3 weeks

### 🎯 Goals:

- ✅ Partner Integrations (API)
- ✅ Analytics & Reports
- ✅ SLA + Escalations
- ✅ Advanced Search
- ✅ Performance Optimization

---

### 📦 Features:

#### **Week 1: Partner Integrations**

```typescript
Tasks:
1. Partner API:
   - POST /api/v1/partner/inquiries (create от партнёра)
   - GET  /api/v1/partner/bookings
   - POST /api/v1/partner/webhook (receive от партнёра)

2. Partner credentials management
3. Webhooks out to partners

Files:
- src/app/api/v1/partner/route.ts
- src/lib/partners/api.ts

Status: 🚧 TODO
```

---

#### **Week 2: Analytics + Reports**

```typescript
Tasks:
1. Analytics endpoints:
   - GET /api/v1/analytics/funnel
   - GET /api/v1/analytics/revenue
   - GET /api/v1/analytics/models-performance

2. Reports generation
3. Export to Excel

Files:
- src/app/api/v1/analytics/route.ts
- src/lib/analytics/funnel.ts
- src/app/(admin)/analytics/page.tsx

Status: 🚧 TODO
```

---

#### **Week 3: SLA + Search + Optimization**

```typescript
Tasks:
1. SLA enforcement:
   - Auto-escalate breached tasks
   - Notifications
   - Metrics

2. Advanced search:
   - Global search (bookings, inquiries, models, clients)
   - Filters
   - Saved searches

3. Performance:
   - Query optimization
   - Caching (Redis)
   - Database indexes

Files:
- src/lib/sla/enforcer.ts
- src/app/api/v1/search/route.ts
- src/lib/cache/redis.ts

Status: 🚧 TODO
```

---

### ✅ Release 3 Acceptance Criteria:

```yaml
Partners:
  ✓ Partner может создать inquiry через API
  ✓ Webhooks работают
  ✓ Auth через API keys

Analytics:
  ✓ Funnel visualization
  ✓ Revenue reports
  ✓ Model performance metrics
  ✓ Export to Excel

SLA:
  ✓ Breached tasks эскалируются
  ✓ Notifications отправляются
  ✓ Metrics tracking

Search:
  ✓ Global search работает
  ✓ Filters сохраняются
  ✓ Fast (<200ms)

Performance:
  ✓ Page load <2s
  ✓ API response <200ms
  ✓ Action Center updates <1s
```

---

## 5. TECHNICAL STACK

### 🛠️ Technologies:

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  Language: TypeScript 5
  Styling: TailwindCSS 3.4
  UI Library: Shadcn/ui
  State: Zustand + React Query
  Forms: React Hook Form + Zod
  Realtime: Socket.io client

Backend:
  Runtime: Node.js 20
  Framework: Next.js API Routes
  ORM: Prisma 5
  Database: PostgreSQL (Neon)
  Queue: BullMQ + Redis
  Cache: Redis
  
Integrations:
  Payments: Stripe
  Email: Resend
  SMS: Twilio
  Telegram: Bot API
  Calendar: (future)

DevOps:
  Hosting: Railway / Vercel
  Database: Neon.tech
  Redis: Upstash
  Monitoring: Sentry
  Analytics: Vercel Analytics

Testing:
  Unit: Vitest
  Integration: Playwright
  E2E: Playwright
```

---

### 📦 Dependencies:

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "@prisma/client": "5.x",
    "prisma": "5.x",
    "next-auth": "5.x",
    "zod": "3.x",
    "react-hook-form": "7.x",
    "@tanstack/react-query": "5.x",
    "zustand": "4.x",
    "tailwindcss": "3.4.x",
    "@radix-ui/react-*": "latest",
    "socket.io": "4.x",
    "socket.io-client": "4.x",
    "bullmq": "5.x",
    "ioredis": "5.x",
    "stripe": "14.x",
    "resend": "3.x",
    "twilio": "5.x",
    "node-telegram-bot-api": "0.x",
    "@sentry/nextjs": "7.x"
  },
  "devDependencies": {
    "@types/node": "20.x",
    "@types/react": "18.x",
    "vitest": "1.x",
    "playwright": "1.x",
    "eslint": "8.x",
    "prettier": "3.x"
  }
}
```

---

## 6. DEVELOPMENT WORKFLOW

### 🔄 Git Workflow:

```bash
main ──────────────────────────────────────► Production
  │
  ├─ develop ──────────────────────────────► Staging
  │     │
  │     ├─ feature/auth-rbac
  │     ├─ feature/action-center
  │     ├─ feature/payments-stripe
  │     └─ fix/booking-timeline
  │
  └─ hotfix/critical-bug ───────────────────► Production (emergency)
```

---

### 📋 Development Process:

```
1. Создать feature branch от develop
   git checkout develop
   git pull
   git checkout -b feature/auth-rbac

2. Разработка
   - Писать код
   - Писать тесты
   - Проверять локально

3. Commit
   git add .
   git commit -m "feat: implement RBAC middleware"

4. Push + PR
   git push origin feature/auth-rbac
   Create Pull Request → develop

5. Code Review
   - Пройти ревью
   - Пофиксить комментарии
   - Merge в develop

6. Deploy to Staging
   develop → auto-deploy to Railway staging

7. QA Testing
   - Тестировать на staging
   - Если OK → merge develop → main

8. Deploy to Production
   main → auto-deploy to Railway production
```

---

### ✅ Code Quality Checklist:

```yaml
Before Commit:
  ✓ ESLint errors fixed
  ✓ Prettier formatted
  ✓ TypeScript compiles
  ✓ Tests pass (vitest)
  ✓ No console.log left

Before PR:
  ✓ Feature works locally
  ✓ Tests written
  ✓ Documentation updated
  ✓ Migrations tested

Before Merge:
  ✓ Code reviewed
  ✓ CI passes
  ✓ No conflicts
  ✓ Approved by 1+ reviewer

Before Deploy:
  ✓ Staging tested
  ✓ QA approved
  ✓ Changelog updated
  ✓ Migration plan ready
```

---

### 📊 Progress Tracking:

```
GitHub Projects:
- Release 1: Foundation
  - [x] Database schema v3
  - [x] Auth + RBAC
  - [ ] Inquiries API
  - [ ] Bookings enhancement
  - [ ] Tasks + Exceptions
  - [ ] Action Center UI
  - [ ] Audit log

- Release 2: Operations
  - [ ] Stripe integration
  - [ ] Availability
  - [ ] Automation engine
  - [ ] Notifications

- Release 3: Advanced
  - [ ] Partner API
  - [ ] Analytics
  - [ ] SLA enforcement
  - [ ] Advanced search
```

---

### 🚀 Launch Checklist:

```yaml
Pre-Launch (1 week before):
  ✓ All features complete
  ✓ QA testing done
  ✓ Performance testing
  ✓ Security audit
  ✓ Backup strategy tested
  ✓ Rollback plan ready
  ✓ Monitoring configured
  ✓ Alerts setup
  ✓ Documentation complete
  ✓ Team trained

Launch Day:
  ✓ Deploy to production
  ✓ Run smoke tests
  ✓ Monitor errors
  ✓ Monitor performance
  ✓ Monitor logs
  ✓ Team on standby

Post-Launch (1 week after):
  ✓ Monitor metrics
  ✓ Gather feedback
  ✓ Fix critical bugs
  ✓ Performance tuning
  ✓ Documentation updates
```

---

## ЗАКЛЮЧЕНИЕ

### 📅 Total Timeline: 6-9 weeks

```
Week 1-3:  Release 1 (Foundation)
Week 4-6:  Release 2 (Operations)
Week 7-9:  Release 3 (Advanced)
```

### 🎯 Success Metrics:

```yaml
Release 1:
  - Action Center works
  - Operators can manage bookings
  - State machines enforce rules
  - Audit log tracks everything

Release 2:
  - Payments fully automated
  - Availability managed
  - Automation rules working
  - Notifications sent

Release 3:
  - Partner integrations live
  - Analytics available
  - SLA enforced
  - Search fast
```

### 🚀 Next Steps:

1. ✅ Read `10-OPERATIONS-PLATFORM.md`
2. 🚧 Start Release 1 development
3. 🚧 Setup development environment
4. 🚧 Create feature branches
5. 🚧 Begin coding!

---

**Дата:** 27 февраля 2026  
**Status:** ✅ Ready to implement  
**Let's build!** 🎉
