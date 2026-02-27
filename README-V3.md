# 🚀 VIREL v3 - OPERATIONS PLATFORM

**Version:** 3.0  
**Date:** 27 February 2026

---

## ✨ ЧТО ЭТО?

Virel v3 - это **не админка**, а **операционная платформа** для управления escort агентством.

### Ключевые отличия v3 от v2:

```
v2 (CRUD админка):          v3 (Operations Platform):
- 17 таблиц                 → 30+ таблиц
- Ручное управление         → Автоматизация + исключения
- Формы для редактирования  → Action Center + workflows
- Статусы меняются свободно → State machines
- Нет аудита                → Полный audit trail
- Нет SLA                   → SLA + таймеры + эскалации
```

---

## 📊 ЧТО ВНУТРИ

### Core Features:
- ✅ **RBAC** - 5 ролей, детальные права
- ✅ **State Machines** - строгие переходы статусов
- ✅ **Action Center** - единый экран оператора
- ✅ **Tasks & Exceptions** - с SLA и приоритетами
- ✅ **Automation Engine** - правила для всего
- ✅ **Queue System** - 3 очереди (critical/ops/heavy)
- ✅ **Realtime Updates** - WebSocket для Action Center
- ✅ **Audit Log** - всё логируется
- ✅ **Domain Events** - event sourcing

### Новые сущности:
- **Clients** - база клиентов
- **Inquiries** - лиды с matching
- **Tasks** - атомарные действия
- **Exceptions** - отклонения требующие внимания
- **Automation Rules** - IF/THEN правила
- **Domain Events** - события для автоматизации

---

## 🚀 БЫСТРЫЙ СТАРТ

### 1. Установка зависимостей:

```bash
npm install
```

### 2. Настройка .env:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database setup:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed demo data
npm run db:seed
```

### 4. Запуск:

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

### 5. Login:

```
Email: admin@virel.com
Password: password123
```

### 6. Action Center:

```
http://localhost:3000/admin/action-center
```

---

## 📦 TECH STACK

```yaml
Frontend:
  - Next.js 14 (App Router)
  - TypeScript 5
  - TailwindCSS 3.4
  - React Query
  - Zustand

Backend:
  - Next.js API Routes
  - Prisma 5
  - PostgreSQL

Realtime:
  - Socket.io

Queue:
  - BullMQ + Redis

Integrations:
  - Stripe (payments)
  - Telegram (bots)
  - Resend (email)
  - Twilio (SMS)
```

---

## 🗄️ DATABASE SCHEMA

**30+ таблиц:**

### Core:
- users, roles, permissions (RBAC)
- models, model_stats, model_media
- clients, inquiries, bookings
- tasks, exceptions
- availability_slots, availability_rules

### System:
- audit_log, domain_events
- automation_rules, automation_executions
- payments, integrations
- webhooks_in, webhooks_out

---

## 🎯 ACTION CENTER

**Главный экран оператора:**

```
Что показывает:
- Все tasks (подтверждения, follow-ups)
- Все exceptions (payment failed, no-show risk)
- Sorted by: SLA → Priority → Time
- Realtime updates (WebSocket)

Quick Actions:
- ✅ Confirm
- 📱 Contact
- 📝 Note
- 👤 Assign
```

---

## ⚙️ STATE MACHINES

**Inquiry Status Flow:**
```
new → qualified → awaiting_client → awaiting_deposit → converted
                                  ↘                   ↘
                                    lost                lost
```

**Booking Status Flow:**
```
draft → pending → deposit_required → confirmed → in_progress → completed
              ↘                    ↘         ↘
                cancelled            cancelled  no_show
```

**Всё через API:**
```typescript
POST /api/v1/inquiries/{id}/status
POST /api/v1/bookings/{id}/status
```

---

## 🤖 AUTOMATION ENGINE

**Создание правил:**

```typescript
{
  trigger: "payment.succeeded",
  conditions: [
    { field: "type", operator: "equals", value: "deposit" }
  ],
  actions: [
    { type: "update_status", params: { newStatus: "confirmed" } },
    { type: "create_task", params: { type: "notify_model" } }
  ]
}
```

**Примеры правил:**
- Auto-qualify web inquiries
- Send deposit reminder after 2h
- Detect no-show risk 30min before
- Escalate failed payments

---

## 📋 API ENDPOINTS

### Auth:
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
```

### Inquiries:
```
GET    /api/v1/inquiries
POST   /api/v1/inquiries
POST   /api/v1/inquiries/{id}/status
POST   /api/v1/inquiries/{id}/match
POST   /api/v1/inquiries/{id}/convert-to-booking
```

### Bookings:
```
GET    /api/v1/bookings
POST   /api/v1/bookings
POST   /api/v1/bookings/{id}/status
GET    /api/v1/bookings/{id}/timeline
```

### Tasks:
```
GET    /api/v1/tasks
POST   /api/v1/tasks
POST   /api/v1/tasks/{id}/status
POST   /api/v1/tasks/{id}/assign
```

### Exceptions:
```
GET    /api/v1/exceptions
POST   /api/v1/exceptions/{id}/resolve
```

---

## 👥 РОЛИ

**5 ролей с разными правами:**

### OWNER (Adel)
- Полный доступ ко всему

### OPS_MANAGER (Tommy)
- Операции + просмотр финансов

### OPERATOR (Lukas, Sasha, Adam, Donald)
- Action Center
- Только assigned задачи
- PII замаскировано

### CONTENT_MANAGER
- Контент (models, SEO)

### FINANCE
- Только финансы

---

## 🔔 NOTIFICATIONS

**Типы:**
- TELEGRAM_DIVA (DivaReceptionBot)
- TELEGRAM_KESHA (KeshaZeroGapBot)
- EMAIL (Resend)
- SMS (Twilio)

**Retry logic:**
- 3 attempts
- Exponential backoff
- Queue system

---

## 📊 MONITORING

### Health Check:
```
GET /api/v1/health
```

### Metrics:
```
GET /api/v1/system/metrics
GET /api/v1/system/queue
```

### Audit Log:
```
GET /api/v1/audit?entity_type=booking&entity_id=xxx
```

---

## 📚 DOCUMENTATION

Полная документация в `/docs`:

1. **00-INDEX.md** - Оглавление
2. **01-PROJECT-OVERVIEW.md** - История проекта
3. **02-TECHNICAL-SPECS.md** - Требования
4. **03-DATABASE-SCHEMA.md** - Схема БД
5. **04-API-DOCUMENTATION.md** - API Reference
6. **05-FRONTEND-PAGES.md** - Структура страниц
7. **06-INTEGRATIONS.md** - Интеграции
8. **07-SEO-STRATEGY.md** - SEO
9. **08-DEPLOYMENT.md** - Деплой
10. **09-MUSE-ANALYSIS.md** - Анализ конкурента
11. **10-OPERATIONS-PLATFORM.md** - Операционная платформа
12. **11-IMPLEMENTATION-ROADMAP.md** - Roadmap

---

## 🚧 RELEASE PLAN

### Release 1 (Done): Foundation
- ✅ Database Schema v3
- ✅ RBAC система
- ✅ State Machines
- ✅ Inquiries API
- ✅ Bookings API
- ✅ Tasks & Exceptions
- ✅ Action Center UI
- ✅ Automation Engine
- ✅ Queue System
- ✅ Seed data

### Release 2 (Next): Operations
- ⏳ Stripe integration
- ⏳ Availability management
- ⏳ Notifications (Email/SMS/Telegram)
- ⏳ WebSocket realtime
- ⏳ SLA enforcement

### Release 3 (Future): Advanced
- ⏳ Partner API
- ⏳ Analytics & Reports
- ⏳ Advanced search
- ⏳ Performance optimization

---

## 🤝 КОМАНДА

- **Adel** (Owner) - admin@virel.com
- **Tommy** (Ops Manager) - tommy@virel.com
- **Lukas** (Operator) - lukas@virel.com
- **Sasha** (Operator) - sasha@virel.com
- **Adam** (Operator) - adam@virel.com
- **Donald** (Operator) - donald@virel.com

---

## 📞 SUPPORT

Вопросы? Проблемы?

1. Проверь docs в `/docs`
2. Проверь API endpoints
3. Проверь logs
4. Открой issue на GitHub

---

**Built with ❤️ by Adel**  
**Version:** 3.0  
**Date:** 27 February 2026
