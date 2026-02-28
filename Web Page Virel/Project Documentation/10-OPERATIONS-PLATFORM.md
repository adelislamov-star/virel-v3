# ⚙️ OPERATIONS PLATFORM

## Документ: Операционная платформа v3
**Дата:** 27 февраля 2026  
**Концепция:** От CRUD админки к операционной платформе

---

## 📚 ОГЛАВЛЕНИЕ

1. [Философия](#философия)
2. [Роли и права](#роли-и-права)
3. [Основные домены](#основные-домены)
4. [State Machines](#state-machines)
5. [Action Center](#action-center)
6. [Database Schema v3](#database-schema-v3)
7. [API Architecture](#api-architecture)
8. [Automation Engine](#automation-engine)
9. [Queue System](#queue-system)
10. [Realtime Updates](#realtime-updates)

---

## 1. ФИЛОСОФИЯ

### 🎯 Не "админка", а операционная платформа:

**❌ Что НЕ делаем:**
- Формы для CRUD
- Ручное управление всем
- Списки с refresh
- Статусы меняются напрямую в БД

**✅ Что ДЕЛАЕМ:**
- **Автопроцессинг** лидов и бронирований
- **Строгие state machines** для всех переходов
- **Action Center** - единственный рабочий экран
- **Automation rules** - правила для всего
- **SLA, таймеры, эскалации**
- **Полный audit trail**
- **Realtime updates** (WebSocket)
- **Интеграции**: payments, messaging, calendar, CRM

---

### 💡 Сравнение подходов:

```
ОБЫЧНАЯ АДМИНКА:
User → открывает список bookings
     → находит нужный
     → кликает Edit
     → меняет Status в dropdown
     → Save
     → ❌ Нет проверок
     → ❌ Нет истории
     → ❌ Нет автоматики

OPERATIONS PLATFORM:
System → обнаруживает событие (payment success)
       → запускает automation rule
       → проверяет conditions
       → меняет booking.status через state machine
       → создаёт audit log
       → триггерит webhooks
       → обновляет Action Center в realtime
       → отправляет notifications
       → если нужно внимание → создаёт Task
       → Operator видит в Action Center
       → ✅ Всё автоматически
       → ✅ Полная история
       → ✅ SLA tracking
```

---

## 2. РОЛИ И ПРАВА

### 👥 Роли:

#### **Owner** (Adel)
```yaml
Доступ: ВСЁ
Может:
  - Настройки системы
  - Финансы (полный доступ)
  - Интеграции
  - Управление пользователями
  - Automation rules
  - Audit log
```

#### **Ops Manager** (Tommy)
```yaml
Доступ: Операции + Просмотр финансов
Может:
  - Настройки процессов
  - Automation rules
  - Просмотр всех bookings/inquiries
  - Просмотр финансов (read-only)
  - Управление операторами
  - Эскалации
Не может:
  - Изменять финансы
  - Настройки интеграций
  - Удалять пользователей
```

#### **Operator** (Lukas, Sasha, Adam, Donald)
```yaml
Доступ: Action Center + Назначенное
Может:
  - Видеть Action Center (свои задачи)
  - Подтверждать bookings
  - Обрабатывать exceptions
  - Видеть назначенные inquiries/bookings
  - Оставлять комментарии
Не может:
  - Видеть чужие задачи (если не assigned)
  - Видеть финансы
  - Менять настройки
  - Видеть PII (маскирование телефонов/email в списках)
```

#### **Content Manager**
```yaml
Доступ: Контент
Может:
  - SEO страницы
  - Blog posts
  - Model profiles (контент)
  - Media upload
Не может:
  - Bookings
  - Финансы
  - Настройки
```

#### **Finance**
```yaml
Доступ: Финансы
Может:
  - Платежи
  - Выплаты
  - Отчёты
  - Reconciliation
Не может:
  - Изменять bookings
  - Automation rules
```

#### **Integrations Admin**
```yaml
Доступ: Интеграции
Может:
  - API ключи
  - Webhooks
  - Маппинги
  - Тестирование
  - Логи интеграций
Не может:
  - Bookings
  - Финансы
```

#### **Read Only**
```yaml
Доступ: Только просмотр
Может:
  - Видеть все данные (кроме PII)
Не может:
  - Изменять что-либо
```

---

### 🔐 Принцип прав (RBAC + Policy):

```typescript
// RBAC - Role Based Access Control
function canAccessEndpoint(user: User, endpoint: string): boolean {
  const userRoles = user.roles;
  const requiredPermissions = endpoint.requiredPermissions;
  
  return userRoles.some(role => 
    role.permissions.includes(...requiredPermissions)
  );
}

// Policy - Entity Level Access
function canAccessEntity(user: User, entity: any): boolean {
  // Operator видит только assigned или unassigned
  if (user.role === 'OPERATOR') {
    return entity.assigned_to === user.id || entity.assigned_to === null;
  }
  
  // Ops Manager и Owner видят всё
  if (['OPS_MANAGER', 'OWNER'].includes(user.role)) {
    return true;
  }
  
  return false;
}

// PII Masking
function maskPII(data: any, user: User): any {
  if (user.role === 'OPERATOR') {
    return {
      ...data,
      phone: data.phone?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
      email: data.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    };
  }
  return data;
}
```

---

## 3. ОСНОВНЫЕ ДОМЕНЫ

### 📦 Core Entities:

#### **Model**
```
Профиль escort модели
- Анкета (name, age, stats)
- Media (photos, videos)
- Tags (services, categories, attributes)
- Locations (базовая + served districts)
- Rates (pricing)
- Status (active, inactive, suspended)
- Internal notes и ratings
```

#### **Client**
```
Клиент
- Contact info (name, email, phone)
- Preferred channel
- Tags (vip, blacklist, etc)
- History (inquiries, bookings)
```

#### **Inquiry**
```
Входящий лид
- Source (web, telegram, whatsapp, phone, partner)
- External ref (ID из внешней системы)
- Client info
- Request details (location, services, time)
- Status (new → qualified → converted/lost)
- Priority (low, normal, high, critical)
- Assigned to (operator)
```

#### **Booking**
```
Подтверждённое бронирование
- Inquiry (optional link)
- Client + Model
- Time (start, end)
- Location
- Services
- Pricing (total, deposit, payment status)
- Status (draft → pending → confirmed → completed)
- Timeline (все события)
- Assigned to (operator)
```

#### **Availability**
```
Доступность модели
- Slots (start, end, status)
- Rules (расписание, ограничения)
- Mismatches (обнаруженные конфликты)
- Confidence score
```

#### **Task**
```
Атомарное действие с SLA
- Type (confirm_booking, request_deposit, follow_up)
- Subject
- Entity (inquiry, booking, model, payment)
- Assigned to (operator)
- Due at
- SLA deadline
- Status (open → in_progress → done/failed)
```

#### **Exception**
```
Отклонение, требующее внимания
- Type (payment_failed, no_show_risk, overbooking, policy_violation)
- Severity (low, medium, high, critical)
- Entity (что пошло не так)
- Summary + details
- Status (open → investigating → resolved/dismissed)
```

#### **Automation Rule**
```
Правило автоматизации
- Name
- Trigger (inquiry.created, payment.succeeded)
- Conditions (if location = Mayfair AND deposit_required)
- Actions (create_task, send_message, update_status)
- Schedule (optional cron)
- Rate limits
```

#### **Integration**
```
Внешняя система
- Code (stripe, telegram, whatsapp, partner_api)
- Type (payment, messaging, calendar, partner)
- Config (keys, urls, tokens)
- Status (active, disabled, testing)
```

---

## 4. STATE MACHINES

### 🔄 Inquiry Status Flow:

```
┌─────┐
│ new │ ← Inquiry создан
└──┬──┘
   │
   ├─→ qualified ← Operator проверил, клиент реальный
   │      │
   │      ├─→ awaiting_client ← Ждём ответа клиента
   │      │      │
   │      │      └─→ awaiting_deposit ← Клиент согласен, нужен депозит
   │      │             │
   │      │             └─→ converted ← ✅ Депозит получен, booking создан
   │      │
   │      └─→ lost ← ❌ Клиент отказался/не ответил
   │
   └─→ spam ← ❌ Спам/fake
```

**Transitions:**
```typescript
const inquiryTransitions = {
  new: ['qualified', 'spam'],
  qualified: ['awaiting_client', 'lost'],
  awaiting_client: ['awaiting_deposit', 'lost'],
  awaiting_deposit: ['converted', 'lost'],
  // Terminal states:
  converted: [],
  lost: [],
  spam: []
};
```

---

### 🔄 Booking Status Flow:

```
┌───────┐
│ draft │ ← Черновик (создаётся из inquiry или вручную)
└───┬───┘
    │
    └─→ pending ← Ждём подтверждения модели/клиента
           │
           ├─→ deposit_required ← Нужен депозит
           │      │
           │      └─→ confirmed ← ✅ Подтверждено (депозит получен)
           │             │
           │             ├─→ in_progress ← Встреча началась
           │             │      │
           │             │      └─→ completed ← ✅ Встреча завершена
           │             │
           │             ├─→ cancelled ← ❌ Отменено
           │             │
           │             ├─→ no_show ← ❌ Клиент не пришёл
           │             │
           │             └─→ expired ← ❌ Время прошло, не подтвердили
           │
           └─→ cancelled ← ❌ Отменено до подтверждения
```

**Transitions:**
```typescript
const bookingTransitions = {
  draft: ['pending', 'cancelled'],
  pending: ['deposit_required', 'confirmed', 'cancelled', 'expired'],
  deposit_required: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  // Terminal states:
  completed: [],
  cancelled: [],
  no_show: [],
  expired: []
};
```

---

### 🔄 Task Status Flow:

```
┌──────┐
│ open │ ← Task создана
└──┬───┘
   │
   └─→ in_progress ← Operator взял в работу
          │
          ├─→ done ← ✅ Выполнено
          │
          ├─→ failed ← ❌ Не удалось выполнить
          │
          └─→ cancelled ← ❌ Отменена
```

---

### 🔄 Exception Status Flow:

```
┌──────┐
│ open │ ← Exception обнаружен
└──┬───┘
   │
   └─→ investigating ← Разбираемся
          │
          ├─→ resolved ← ✅ Проблема решена
          │
          └─→ dismissed ← ❌ Ложное срабатывание/не критично
```

---

### ⚙️ Enforcement Rules:

```typescript
// 1. Все переходы только через сервисный слой
async function changeInquiryStatus(
  inquiryId: string, 
  newStatus: InquiryStatus, 
  reason: string,
  userId: string
) {
  const inquiry = await getInquiry(inquiryId);
  
  // Проверяем разрешён ли переход
  if (!inquiryTransitions[inquiry.status].includes(newStatus)) {
    throw new Error(`Invalid transition: ${inquiry.status} → ${newStatus}`);
  }
  
  // Проверяем conditions (если есть)
  if (newStatus === 'awaiting_deposit') {
    if (!inquiry.deposit_amount) {
      throw new Error('Deposit amount required');
    }
  }
  
  // Делаем переход
  await prisma.$transaction(async (tx) => {
    // Update status
    await tx.inquiry.update({
      where: { id: inquiryId },
      data: { 
        status: newStatus,
        updated_at: new Date()
      }
    });
    
    // Audit log
    await tx.auditLog.create({
      data: {
        actor_user_id: userId,
        action: 'STATUS_CHANGE',
        entity_type: 'INQUIRY',
        entity_id: inquiryId,
        before: { status: inquiry.status },
        after: { status: newStatus },
        metadata: { reason }
      }
    });
    
    // Trigger automation
    await triggerAutomation({
      event: 'inquiry.status_changed',
      entity: { ...inquiry, status: newStatus }
    });
  });
  
  return inquiry;
}

// 2. НИКОГДА не делаем напрямую:
// await prisma.inquiry.update({ data: { status: 'converted' } }); // ❌ WRONG
```

---

## 5. ACTION CENTER

### 🎯 Концепция:

**Action Center = единственный рабочий экран оператора**

Operator открывает систему → видит Action Center → работает только там

---

### 📊 Что показывает Action Center:

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 ACTION CENTER                          @lukas  [⚙️ 🔔 👤] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔍 [_______________ Search everything ______________]  [⚡]  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ URGENT (3) - Needs immediate attention                 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │ 🔴 Exception: Payment failed                    2m ago │ │
│  │    Booking #B-1234 • STRIPE_ERROR               [View] │ │
│  │                                                         │ │
│  │ 🟡 Task: Confirm booking • SLA: 15min left      5m ago │ │
│  │    Booking #B-1235 • Sophia @ Mayfair           [View] │ │
│  │                                                         │ │
│  │ 🟠 Exception: No-show risk detected            10m ago │ │
│  │    Booking #B-1236 • Starts in 30min            [View] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ HIGH PRIORITY (5)                                       │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [List of high priority tasks...]                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NORMAL (12)                                             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ [List of normal tasks...]                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Show completed (23)]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 📋 Sorting Logic:

```typescript
function sortActionItems(items: ActionItem[]): ActionItem[] {
  return items.sort((a, b) => {
    // 1. Severity/Priority
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (a.severity !== b.severity) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    
    // 2. SLA breached
    if (a.sla_breached && !b.sla_breached) return -1;
    if (!a.sla_breached && b.sla_breached) return 1;
    
    // 3. SLA deadline approaching
    if (a.sla_deadline && b.sla_deadline) {
      return a.sla_deadline.getTime() - b.sla_deadline.getTime();
    }
    
    // 4. Created time (oldest first)
    return a.created_at.getTime() - b.created_at.getTime();
  });
}
```

---

### ⚡ Quick Actions:

Каждый item в Action Center имеет быстрые действия:

```
┌──────────────────────────────────────────────────────────┐
│ 🟡 Task: Confirm booking • SLA: 15min left               │
│    Booking #B-1235 • Sophia @ Mayfair                    │
│    Client: James • +447700***123 • 2026-12-25 19:00     │
│                                                           │
│    [✅ Confirm]  [📱 Contact]  [📝 Note]  [👤 Assign]    │
└──────────────────────────────────────────────────────────┘
```

Клик на кнопку → action выполняется → item исчезает из списка

---

### 🔍 Unified Search:

Одна строка поиска по **всему**:

```
Search: "james"

Results:
  📋 3 Bookings
  📝 2 Inquiries
  👤 1 Client
  
Search: "#B-1235"

Results:
  📋 Booking B-1235
  
Search: "payment failed"

Results:
  🔴 5 Exceptions (payment_failed)
```

---

### 🎨 Card Sidebar Pattern:

**Список слева, карточка справа:**

```
┌─────────────────────────┬─────────────────────────────┐
│ ACTION CENTER           │ Booking #B-1235         [×] │
│                         ├─────────────────────────────┤
│ Items list...           │                             │
│ [Item 1]                │ Details...                  │
│ [Item 2] ← selected     │                             │
│ [Item 3]                │ Timeline...                 │
│                         │                             │
│                         │ Actions...                  │
│                         │                             │
│                         │ [Confirm] [Cancel]          │
└─────────────────────────┴─────────────────────────────┘
```

**Преимущества:**
- ✅ Не теряем контекст (список всегда виден)
- ✅ Меньше кликов
- ✅ Удобно на ноутбуке и планшете
- ✅ Быстрое переключение между items

---

### ⌨️ Keyboard Shortcuts:

```
/ ────── Focus search
g + a ── Go to Action Center
g + b ── Go to Bookings
g + i ── Go to Inquiries
e ────── Open entity sidebar
a ────── Assign to me
s ────── Change status
Esc ──── Close sidebar
↑/↓ ──── Navigate list
Enter ── Open selected
```

---

## 6. DATABASE SCHEMA V3

### 📊 30+ Tables:

#### **6.1 Users & Access:**

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- OWNER, OPS_MANAGER, OPERATOR
  name TEXT NOT NULL,
  description TEXT
);

-- permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- bookings.read, bookings.update
  description TEXT
);

-- role_permissions
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- user_roles
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

---

#### **6.2 Models & Profiles:**

```sql
-- models
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code TEXT UNIQUE NOT NULL, -- короткий код для внешних ссылок: "SOPHIA-MF"
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  primary_location_id UUID REFERENCES locations(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  visibility TEXT NOT NULL DEFAULT 'public', -- public, private, unlisted
  rating_internal NUMERIC(3,2), -- внутренний рейтинг 0-5
  notes_internal TEXT, -- внутренние заметки
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_models_slug ON models(slug);
CREATE INDEX idx_models_status_visibility ON models(status, visibility);
CREATE INDEX idx_models_location ON models(primary_location_id);

-- model_stats
CREATE TABLE model_stats (
  model_id UUID PRIMARY KEY REFERENCES models(id),
  age INT,
  height INT, -- cm
  weight INT, -- kg
  dress_size TEXT,
  bust_size TEXT,
  bust_type TEXT, -- natural, enhanced
  hair_colour TEXT,
  eye_colour TEXT,
  smoking_status TEXT, -- non-smoker, smoker, social
  tattoo_status TEXT, -- none, small, large
  piercing_status TEXT,
  orientation TEXT,
  nationality TEXT,
  languages TEXT[], -- ['English', 'French']
  uniforms TEXT[] -- ['secretary', 'nurse']
);

-- model_media
CREATE TABLE model_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id),
  type TEXT NOT NULL, -- photo, video, doc
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  checksum TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_model_media_model ON model_media(model_id);
CREATE INDEX idx_model_media_primary ON model_media(model_id, is_primary);

-- model_services (M:N)
CREATE TABLE model_services (
  model_id UUID NOT NULL REFERENCES models(id),
  service_id UUID NOT NULL REFERENCES services(id),
  is_enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (model_id, service_id)
);

-- model_categories (M:N)
CREATE TABLE model_categories (
  model_id UUID NOT NULL REFERENCES models(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  PRIMARY KEY (model_id, category_id)
);

-- model_attributes (M:N)
CREATE TABLE model_attributes (
  model_id UUID NOT NULL REFERENCES models(id),
  attribute_value_id UUID NOT NULL REFERENCES attribute_values(id),
  PRIMARY KEY (model_id, attribute_value_id)
);
```

---

#### **6.3 Directories (Services, Categories, Attributes, Locations):**

```sql
-- services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  h1 TEXT,
  intro_html TEXT,
  description_html TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_popular BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- attributes
CREATE TABLE attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- hair_colour, bust_type
  name TEXT NOT NULL,
  is_filterable BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  data_type TEXT NOT NULL DEFAULT 'enum', -- enum, text, number
  status TEXT NOT NULL DEFAULT 'active'
);

-- attribute_values
CREATE TABLE attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES attributes(id),
  value TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(attribute_id, value)
);

-- locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  county TEXT,
  country TEXT DEFAULT 'UK',
  timezone TEXT DEFAULT 'Europe/London',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  status TEXT NOT NULL DEFAULT 'active',
  is_popular BOOLEAN DEFAULT false
);

-- call_rates
CREATE TABLE call_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  currency TEXT NOT NULL DEFAULT 'GBP',
  duration_minutes INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
```

---

#### **6.4 Clients, Inquiries, Bookings:**

```sql
-- clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_channel TEXT, -- web, telegram, whatsapp, phone
  tags TEXT[], -- ['vip', 'regular', 'blacklist']
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);

-- inquiries
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- web, telegram, whatsapp, phone, partner
  external_ref TEXT, -- ID из внешней системы
  client_id UUID REFERENCES clients(id),
  status TEXT NOT NULL DEFAULT 'new', -- new, qualified, awaiting_client, awaiting_deposit, converted, lost, spam
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical
  subject TEXT,
  message TEXT,
  requested_location_id UUID REFERENCES locations(id),
  requested_services JSONB,
  requested_time_from TIMESTAMPTZ,
  requested_time_to TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, external_ref) -- для идемпотентности
);

CREATE INDEX idx_inquiries_status_priority ON inquiries(status, priority);
CREATE INDEX idx_inquiries_assigned ON inquiries(assigned_to, status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at);

-- inquiry_matches (результаты matching)
CREATE TABLE inquiry_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id),
  model_id UUID NOT NULL REFERENCES models(id),
  score NUMERIC(5,2), -- 0-100
  reason JSONB, -- почему match
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_matches_inquiry ON inquiry_matches(inquiry_id);
CREATE INDEX idx_inquiry_matches_model ON inquiry_matches(model_id);

-- bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id), -- optional
  client_id UUID NOT NULL REFERENCES clients(id),
  model_id UUID NOT NULL REFERENCES models(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, deposit_required, confirmed, in_progress, completed, cancelled, no_show, expired
  price_total NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  deposit_required NUMERIC(10,2),
  deposit_status TEXT DEFAULT 'none', -- none, pending, paid, failed
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid, refunded
  assigned_to UUID REFERENCES users(id),
  notes_internal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_model_start ON bookings(model_id, start_at);
CREATE INDEX idx_bookings_client ON bookings(client_id, created_at);
CREATE INDEX idx_bookings_status_start ON bookings(status, start_at);
CREATE INDEX idx_bookings_assigned ON bookings(assigned_to, status);

-- booking_services (M:N)
CREATE TABLE booking_services (
  booking_id UUID NOT NULL REFERENCES bookings(id),
  service_id UUID NOT NULL REFERENCES services(id),
  PRIMARY KEY (booking_id, service_id)
);

-- booking_timeline (все события booking)
CREATE TABLE booking_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  event_type TEXT NOT NULL, -- status_changed, payment_received, note_added
  payload JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_timeline ON booking_timeline(booking_id, created_at);
```

---

#### **6.5 Availability:**

```sql
-- availability_rules
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope TEXT NOT NULL, -- global, location, model
  location_id UUID REFERENCES locations(id),
  model_id UUID REFERENCES models(id),
  rule JSONB NOT NULL, -- расписание, ограничения, blackouts
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- availability_slots
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- available, unavailable, tentative
  source TEXT DEFAULT 'manual', -- manual, automation, sync
  confidence NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_availability_slots_model ON availability_slots(model_id, start_at);
CREATE INDEX idx_availability_slots_status ON availability_slots(status, start_at);

-- availability_mismatches (обнаруженные конфликты)
CREATE TABLE availability_mismatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id),
  expected_status TEXT NOT NULL,
  actual_status TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL, -- low, medium, high, critical
  context JSONB,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_availability_mismatches_detected ON availability_mismatches(detected_at);
CREATE INDEX idx_availability_mismatches_model ON availability_mismatches(model_id, resolved_at);
```

---

#### **6.6 Tasks, Exceptions, SLA:**

```sql
-- tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- confirm_booking, request_deposit, follow_up, review_exception
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, done, failed, cancelled
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical
  subject TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- inquiry, booking, model, payment, integration
  entity_id UUID NOT NULL,
  assigned_to UUID REFERENCES users(id),
  due_at TIMESTAMPTZ,
  sla_deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_status_sla ON tasks(status, sla_deadline_at);
CREATE INDEX idx_tasks_entity ON tasks(entity_type, entity_id);

-- exceptions
CREATE TABLE exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- payment_failed, no_show_risk, mismatch, overbooking, policy_violation
  status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, dismissed
  severity TEXT NOT NULL, -- low, medium, high, critical
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  summary TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_exceptions_status_severity ON exceptions(status, severity);
CREATE INDEX idx_exceptions_entity ON exceptions(entity_type, entity_id);

-- sla_policies
CREATE TABLE sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  applies_to TEXT NOT NULL, -- task_type, exception_type
  key TEXT NOT NULL, -- confirm_booking, payment_failed
  deadline_minutes INT NOT NULL,
  escalation JSONB, -- куда эскалировать
  status TEXT NOT NULL DEFAULT 'active'
);
```

---

#### **6.7 Payments:**

```sql
-- payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  provider TEXT NOT NULL, -- stripe, revolut, custom
  provider_payment_id TEXT,
  type TEXT NOT NULL, -- deposit, full, refund
  status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, cancelled
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB, -- полный ответ от провайдера
  UNIQUE(provider, provider_payment_id)
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
```

---

#### **6.8 Integrations & Webhooks:**

```sql
-- integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- stripe, telegram_diva, whatsapp, partner_api
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- payment, messaging, calendar, partner
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled, testing
  config JSONB NOT NULL, -- ключи, url, токены, режимы
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- webhooks_in (входящие)
CREATE TABLE webhooks_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  event_type TEXT NOT NULL,
  headers JSONB,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received', -- received, processed, failed
  error TEXT,
  idempotency_key TEXT,
  UNIQUE(integration_id, idempotency_key)
);

CREATE INDEX idx_webhooks_in_integration ON webhooks_in(integration_id, received_at);
CREATE INDEX idx_webhooks_in_status ON webhooks_in(status, received_at);

-- webhooks_out (исходящие)
CREATE TABLE webhooks_out (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  event_type TEXT NOT NULL,
  target_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  attempts INT DEFAULT 0,
  last_error TEXT
);

CREATE INDEX idx_webhooks_out_status ON webhooks_out(status, created_at);
```

---

#### **6.9 Audit & Events:**

```sql
-- audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  actor_type TEXT NOT NULL DEFAULT 'user', -- user, system
  action TEXT NOT NULL, -- STATUS_CHANGE, CREATE, UPDATE, DELETE
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  before JSONB,
  after JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id, created_at);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- domain_events (для event sourcing / асинхронной обработки)
CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_domain_events_type ON domain_events(event_type, created_at);
CREATE INDEX idx_domain_events_published ON domain_events(published_at);
```

---

#### **6.10 Automation:**

```sql
-- automation_rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled, testing
  trigger TEXT NOT NULL, -- inquiry.created, payment.succeeded
  conditions JSONB NOT NULL, -- IF conditions
  actions JSONB NOT NULL, -- THEN actions
  limits JSONB, -- rate limits, max executions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- automation_executions
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id),
  event_id UUID NOT NULL, -- from domain_events
  status TEXT NOT NULL DEFAULT 'running', -- running, done, failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  logs JSONB,
  UNIQUE(rule_id, event_id) -- дедупликация
);
```

---

## 7. API ARCHITECTURE

### 📡 Принципы:

1. **REST для CRUD**
2. **Отдельные endpoints для state transitions**
3. **Cursor pagination**
4. **Фильтры через query params**
5. **Идемпотентность**: `Idempotency-Key` header
6. **Версионирование**: `/api/v1`
7. **Единый формат ошибок**
8. **WebSocket для realtime**

---

### 🔌 Key Endpoints:

```typescript
// Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/me

// Users & Roles
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
POST   /api/v1/users/:id/roles
GET    /api/v1/roles
GET    /api/v1/permissions

// Models
GET    /api/v1/models?status=&location=&category=&q=
POST   /api/v1/models
GET    /api/v1/models/:id
PATCH  /api/v1/models/:id
POST   /api/v1/models/:id/status  ← State transition
POST   /api/v1/models/:id/media
DELETE /api/v1/models/:id/media/:media_id

// Inquiries
GET    /api/v1/inquiries?status=&priority=&assigned_to=&q=
POST   /api/v1/inquiries
GET    /api/v1/inquiries/:id
PATCH  /api/v1/inquiries/:id
POST   /api/v1/inquiries/:id/status  ← State transition
POST   /api/v1/inquiries/:id/assign
POST   /api/v1/inquiries/:id/match  ← Запустить matching
POST   /api/v1/inquiries/:id/convert-to-booking

// Bookings
GET    /api/v1/bookings?status=&start_from=&start_to=&model_id=&q=
POST   /api/v1/bookings
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id
POST   /api/v1/bookings/:id/status  ← State transition
POST   /api/v1/bookings/:id/services
GET    /api/v1/bookings/:id/timeline

// Payments
POST   /api/v1/bookings/:id/payments/deposit-intent
POST   /api/v1/payments/webhook/stripe
GET    /api/v1/payments?booking_id=
POST   /api/v1/payments/:id/retry
POST   /api/v1/payments/:id/refund

// Availability
GET    /api/v1/availability/slots?model_id=&from=&to=
POST   /api/v1/availability/slots
PATCH  /api/v1/availability/slots/:id
GET    /api/v1/availability/mismatches?severity=&status=

// Tasks & Exceptions (Action Center)
GET    /api/v1/tasks?status=&assigned_to=&sla_breached=
POST   /api/v1/tasks
POST   /api/v1/tasks/:id/assign
POST   /api/v1/tasks/:id/status  ← State transition
GET    /api/v1/exceptions?status=&severity=&type=
POST   /api/v1/exceptions/:id/resolve
POST   /api/v1/exceptions/:id/dismiss

// Automation
GET    /api/v1/automation/rules
POST   /api/v1/automation/rules
PATCH  /api/v1/automation/rules/:id
POST   /api/v1/automation/rules/:id/test
GET    /api/v1/automation/executions?rule_id=&status=

// Audit & Events
GET    /api/v1/audit?entity_type=&entity_id=&from=&to=
GET    /api/v1/events/stream  ← WebSocket/SSE

// Health
GET    /api/v1/health
GET    /api/v1/system/metrics
GET    /api/v1/system/queue
```

---

### 🔄 State Transition Example:

```typescript
// POST /api/v1/bookings/:id/status
{
  "new_status": "confirmed",
  "reason": "Deposit received",
  "metadata": {
    "payment_id": "pay_123",
    "confirmed_by": "user_789"
  }
}

// Response:
{
  "success": true,
  "data": {
    "booking": {
      "id": "...",
      "status": "confirmed",
      "confirmed_at": "2026-02-27T15:30:00Z"
    },
    "transition": {
      "from": "deposit_required",
      "to": "confirmed",
      "at": "2026-02-27T15:30:00Z",
      "by": "user_789"
    }
  }
}
```

---

## 8. AUTOMATION ENGINE

### 🤖 Концепция:

**Rule = Trigger + Conditions + Actions**

```yaml
Rule: "Confirm booking when deposit paid"
Trigger: payment.succeeded
Conditions:
  - payment.type = "deposit"
  - booking.status = "deposit_required"
Actions:
  - update booking.status → "confirmed"
  - create task "notify_model"
  - send notification via telegram
```

---

### 📋 Rule Structure:

```typescript
interface AutomationRule {
  id: string;
  name: string;
  status: 'active' | 'disabled' | 'testing';
  
  trigger: {
    event: string; // inquiry.created, payment.succeeded
    filters?: Record<string, any>; // optional pre-filters
  };
  
  conditions: Condition[]; // IF checks
  
  actions: Action[]; // THEN execute
  
  limits?: {
    max_per_hour?: number;
    max_per_day?: number;
  };
  
  schedule?: string; // cron для scheduled rules
}

type Condition = {
  field: string; // "location_id", "deposit_required"
  operator: 'equals' | 'in' | 'contains' | 'greater_than';
  value: any;
};

type Action = 
  | { type: 'create_task'; params: { type: string; assigned_to?: string } }
  | { type: 'create_exception'; params: { type: string; severity: string } }
  | { type: 'send_message'; params: { channel: string; template: string } }
  | { type: 'update_status'; params: { entity_type: string; new_status: string } }
  | { type: 'assign_operator'; params: { operator_id?: string; strategy?: string } }
  | { type: 'call_webhook'; params: { url: string; payload: Record<string, any> } }
  | { type: 'schedule_followup'; params: { delay_minutes: number; action: Action } };
```

---

### 🎯 Examples:

#### **Rule 1: Auto-qualify web inquiries**
```json
{
  "name": "Auto-qualify web inquiries from valid email domains",
  "trigger": {
    "event": "inquiry.created",
    "filters": { "source": "web" }
  },
  "conditions": [
    { "field": "client_email", "operator": "not_contains", "value": "@temp" },
    { "field": "client_email", "operator": "not_contains", "value": "@trash" }
  ],
  "actions": [
    { "type": "update_status", "params": { "entity_type": "inquiry", "new_status": "qualified" } },
    { "type": "create_task", "params": { "type": "review_inquiry", "assigned_to": "next_available" } }
  ]
}
```

---

#### **Rule 2: Deposit reminder**
```json
{
  "name": "Send deposit reminder if not paid in 2 hours",
  "trigger": {
    "event": "inquiry.status_changed",
    "filters": { "new_status": "awaiting_deposit" }
  },
  "conditions": [],
  "actions": [
    {
      "type": "schedule_followup",
      "params": {
        "delay_minutes": 120,
        "action": {
          "type": "send_message",
          "params": {
            "channel": "email",
            "template": "deposit_reminder"
          }
        }
      }
    }
  ]
}
```

---

#### **Rule 3: No-show risk detection**
```json
{
  "name": "Detect no-show risk 30min before booking",
  "trigger": {
    "event": "booking.approaching",
    "filters": { "minutes_until_start": 30 }
  },
  "conditions": [
    { "field": "status", "operator": "equals", "value": "confirmed" },
    { "field": "client_confirmed_arrival", "operator": "equals", "value": false }
  ],
  "actions": [
    {
      "type": "create_exception",
      "params": {
        "type": "no_show_risk",
        "severity": "high"
      }
    },
    {
      "type": "send_message",
      "params": {
        "channel": "telegram",
        "template": "no_show_alert"
      }
    }
  ]
}
```

---

#### **Rule 4: Payment failed escalation**
```json
{
  "name": "Escalate failed payments",
  "trigger": {
    "event": "payment.failed"
  },
  "conditions": [
    { "field": "type", "operator": "equals", "value": "deposit" }
  ],
  "actions": [
    {
      "type": "create_exception",
      "params": {
        "type": "payment_failed",
        "severity": "high"
      }
    },
    {
      "type": "create_task",
      "params": {
        "type": "retry_payment",
        "assigned_to": "finance_team"
      }
    },
    {
      "type": "update_status",
      "params": {
        "entity_type": "booking",
        "new_status": "deposit_required"
      }
    }
  ]
}
```

---

### ⚙️ Technical Implementation:

```typescript
// 1. Event происходит
async function triggerEvent(event: DomainEvent) {
  // Сохраняем event
  await prisma.domainEvents.create({
    data: {
      event_type: event.type,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      payload: event.payload
    }
  });
  
  // Находим подходящие rules
  const rules = await findMatchingRules(event.type);
  
  // Запускаем каждый rule
  for (const rule of rules) {
    await executeRule(rule, event);
  }
}

// 2. Выполняем rule
async function executeRule(rule: AutomationRule, event: DomainEvent) {
  // Проверяем дедупликацию
  const existing = await prisma.automationExecutions.findUnique({
    where: { rule_id_event_id: { rule_id: rule.id, event_id: event.id } }
  });
  
  if (existing) {
    return; // Already executed
  }
  
  // Создаём execution
  const execution = await prisma.automationExecutions.create({
    data: {
      rule_id: rule.id,
      event_id: event.id,
      status: 'running'
    }
  });
  
  try {
    // Проверяем conditions
    const conditionsMet = await checkConditions(rule.conditions, event.payload);
    
    if (!conditionsMet) {
      await prisma.automationExecutions.update({
        where: { id: execution.id },
        data: { 
          status: 'done',
          finished_at: new Date(),
          logs: { message: 'Conditions not met' }
        }
      });
      return;
    }
    
    // Выполняем actions
    for (const action of rule.actions) {
      await executeAction(action, event.payload);
    }
    
    // Успех
    await prisma.automationExecutions.update({
      where: { id: execution.id },
      data: { 
        status: 'done',
        finished_at: new Date()
      }
    });
    
  } catch (error) {
    // Ошибка
    await prisma.automationExecutions.update({
      where: { id: execution.id },
      data: { 
        status: 'failed',
        finished_at: new Date(),
        logs: { error: error.message }
      }
    });
  }
}

// 3. Выполняем action
async function executeAction(action: Action, context: any) {
  switch (action.type) {
    case 'create_task':
      await createTask({
        type: action.params.type,
        entity_type: context.entity_type,
        entity_id: context.entity_id,
        assigned_to: action.params.assigned_to || await getNextOperator()
      });
      break;
      
    case 'update_status':
      await changeStatus(
        context.entity_id,
        action.params.new_status,
        'automation',
        'system'
      );
      break;
      
    case 'send_message':
      await sendNotification({
        channel: action.params.channel,
        template: action.params.template,
        data: context
      });
      break;
      
    // ... other actions
  }
}
```

---

## 9. QUEUE SYSTEM

### 📮 3 Queues:

```yaml
critical:
  Purpose: Платежи, статусы booking, SLA
  Priority: Highest
  Timeout: 30s
  Retries: 3
  Backoff: exponential (1s, 2s, 4s)

ops:
  Purpose: Уведомления, синки, automation
  Priority: Medium
  Timeout: 60s
  Retries: 5
  Backoff: exponential (5s, 10s, 20s, 40s, 80s)

heavy:
  Purpose: Media processing, imports, reports
  Priority: Low
  Timeout: 300s
  Retries: 2
  Backoff: linear (60s, 120s)
```

---

### 🔄 Job Types:

```typescript
type Job = 
  // Critical queue
  | { type: 'process_payment'; data: { payment_id: string } }
  | { type: 'update_booking_status'; data: { booking_id: string; status: string } }
  | { type: 'check_sla_breach'; data: { task_id: string } }
  
  // Ops queue
  | { type: 'send_notification'; data: { notification_id: string } }
  | { type: 'sync_to_appsheet'; data: { booking_id: string } }
  | { type: 'execute_automation_rule'; data: { rule_id: string; event_id: string } }
  | { type: 'send_webhook'; data: { webhook_out_id: string } }
  
  // Heavy queue
  | { type: 'process_media'; data: { media_id: string } }
  | { type: 'generate_report'; data: { report_type: string; params: any } }
  | { type: 'import_data'; data: { import_id: string } };
```

---

### ⚡ Implementation (BullMQ):

```typescript
import { Queue, Worker } from 'bullmq';

// Create queues
const criticalQueue = new Queue('critical', {
  connection: { host: 'localhost', port: 6379 }
});

const opsQueue = new Queue('ops', {
  connection: { host: 'localhost', port: 6379 }
});

const heavyQueue = new Queue('heavy', {
  connection: { host: 'localhost', port: 6379 }
});

// Add job
async function addJob(queue: string, job: Job) {
  const q = queue === 'critical' ? criticalQueue 
          : queue === 'ops' ? opsQueue 
          : heavyQueue;
  
  await q.add(job.type, job.data, {
    attempts: queue === 'critical' ? 3 : queue === 'ops' ? 5 : 2,
    backoff: {
      type: queue === 'heavy' ? 'fixed' : 'exponential',
      delay: 1000
    }
  });
}

// Worker
const criticalWorker = new Worker('critical', async (job) => {
  switch (job.name) {
    case 'process_payment':
      await processPayment(job.data.payment_id);
      break;
    case 'update_booking_status':
      await updateBookingStatus(job.data.booking_id, job.data.status);
      break;
    // ...
  }
});
```

---

## 10. REALTIME UPDATES

### 🔌 WebSocket для Action Center:

```typescript
// Server
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  
  // Join room по user
  socket.join(`user:${userId}`);
  
  console.log(`User ${userId} connected`);
});

// Отправка update
async function notifyActionCenter(userId: string, update: any) {
  io.to(`user:${userId}`).emit('action_center:update', update);
}

// Пример: новая task создана
async function createTask(data: TaskData) {
  const task = await prisma.task.create({ data });
  
  // Notify оператора
  if (task.assigned_to) {
    await notifyActionCenter(task.assigned_to, {
      type: 'task_created',
      task: task
    });
  }
}

// Пример: exception resolved
async function resolveException(exceptionId: string, userId: string) {
  const exception = await prisma.exception.update({
    where: { id: exceptionId },
    data: { 
      status: 'resolved',
      resolved_at: new Date(),
      resolved_by: userId
    }
  });
  
  // Notify тому, кто был assigned
  if (exception.assigned_to) {
    await notifyActionCenter(exception.assigned_to, {
      type: 'exception_resolved',
      exception_id: exceptionId
    });
  }
}
```

---

### 💻 Client (React):

```typescript
import { io } from 'socket.io-client';

const socket = io('https://virel.com', {
  auth: {
    token: accessToken,
    userId: currentUser.id
  }
});

// Listen for updates
socket.on('action_center:update', (update) => {
  switch (update.type) {
    case 'task_created':
      // Add task to Action Center
      setTasks(prev => [update.task, ...prev]);
      break;
      
    case 'task_completed':
      // Remove task from Action Center
      setTasks(prev => prev.filter(t => t.id !== update.task_id));
      break;
      
    case 'exception_created':
      // Add exception
      setExceptions(prev => [update.exception, ...prev]);
      break;
      
    case 'booking_status_changed':
      // Update booking
      setBookings(prev => prev.map(b => 
        b.id === update.booking_id 
          ? { ...b, status: update.new_status }
          : b
      ));
      break;
  }
});
```

---

## ЗАКЛЮЧЕНИЕ

Это **не админка** - это **операционная платформа**.

**Ключевые отличия:**
- ✅ Automation Engine вместо ручной работы
- ✅ Action Center вместо списков CRUD
- ✅ State Machines вместо свободного изменения статусов
- ✅ SLA и таймеры
- ✅ Realtime updates
- ✅ Полный audit trail
- ✅ Queue system для всех операций
- ✅ Интеграции первого класса

**Следующие шаги:** Смотри `11-IMPLEMENTATION-ROADMAP.md`

---

**Дата:** 27 февраля 2026  
**Версия:** 3.0  
**Status:** ✅ Ready for implementation
