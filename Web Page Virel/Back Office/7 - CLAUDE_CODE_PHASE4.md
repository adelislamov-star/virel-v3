# Claude Code — Virel v3 Back Office: PHASE 4 (Финальные доработки)

**Проект:** `C:\Virel`
**Контекст:** Phase 1-3 завершены. Это финальный пакет — закрытие всех оставшихся пунктов из спецификации.

> ПЕРЕД НАЧАЛОМ: `npm run build` — убедись что всё чисто.

> СТИЛЬ: Как в остальных admin страницах. Dark theme, Tailwind, shadcn/ui.

---

## ЗАДАЧА 1: AUDIT TRAIL ИНТЕГРАЦИЯ

Все новые модули должны писать в AuditLog при критических операциях.

### 1.1 — Создать хелпер `src/lib/audit/log.ts`

```typescript
import { prisma } from '@/lib/db/client';

type AuditAction = 
  | 'review.status_changed'
  | 'review.reply_added'
  | 'incident.created'
  | 'incident.status_changed'
  | 'fraud.client_status_changed'
  | 'model.status_changed'
  | 'pricing.rule_created'
  | 'pricing.rule_updated'
  | 'membership.subscription_created'
  | 'membership.subscription_cancelled'
  | 'sla.breach_detected'
  | 'data_quality.check_resolved'
  | 'booking.disputed'
  | 'payment.refunded'
  | 'payment.disputed';

export async function writeAuditLog(params: {
  action: AuditAction;
  entityType: string;    // 'review', 'incident', 'booking', etc
  entityId: string;
  userId?: string;       // кто совершил действие
  previousState?: any;   // JSON предыдущего состояния
  newState?: any;        // JSON нового состояния
  metadata?: any;        // доп. данные
  reasonCode?: string;   // причина действия
}) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId || 'system',
      previousState: params.previousState ? JSON.stringify(params.previousState) : null,
      newState: params.newState ? JSON.stringify(params.newState) : null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      reasonCode: params.reasonCode,
    },
  });
}
```

Проверь структуру существующей модели AuditLog в schema.prisma. Если полей `previousState`, `newState`, `reasonCode`, `metadata` нет — добавь их:

```prisma
model AuditLog {
  // ... существующие поля ...
  previousState   String?  @db.Text
  newState        String?  @db.Text
  reasonCode      String?
  metadata        String?  @db.Text
}
```

### 1.2 — Вставить audit logging во все API routes

Добавить вызов `writeAuditLog()` в следующие файлы:

**Reviews:**
- `src/app/api/v1/reviews/[id]/status/route.ts` — при смене статуса (action: 'review.status_changed')
- `src/app/api/v1/reviews/[id]/reply/route.ts` — при добавлении ответа (action: 'review.reply_added')

**Incidents:**
- `src/app/api/v1/incidents/route.ts` — при создании (action: 'incident.created')
- `src/app/api/v1/incidents/[id]/status/route.ts` — при смене статуса (action: 'incident.status_changed')

**Fraud:**
- `src/app/api/v1/fraud/clients/[clientId]/status/route.ts` — при смене risk status (action: 'fraud.client_status_changed')

**Model status:**
- `src/app/api/v1/models/[id]/status/route.ts` — при смене статуса (action: 'model.status_changed')

**Pricing:**
- `src/app/api/v1/pricing/rules/route.ts` — POST (action: 'pricing.rule_created')
- `src/app/api/v1/pricing/rules/[id]/route.ts` — PATCH (action: 'pricing.rule_updated')

**Membership:**
- `src/app/api/v1/membership/clients/[clientId]/subscription/route.ts` — POST/DELETE (action: 'membership.subscription_created' / 'membership.subscription_cancelled')

Каждый вызов должен включать entityType, entityId, и previousState/newState где применимо.

---

## ЗАДАЧА 2: NOTIFICATION TEMPLATES

Система уведомлений при смене статусов.

### 2.1 — Создать `src/lib/notifications/templates.ts`

```typescript
export type NotificationChannel = 'email' | 'telegram' | 'sms';
export type NotificationEvent = 
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.completed'
  | 'booking.disputed'
  | 'inquiry.converted'
  | 'inquiry.rejected'
  | 'review.approved'
  | 'review.flagged'
  | 'incident.created'
  | 'incident.resolved'
  | 'model.published'
  | 'model.hidden'
  | 'sla.breached'
  | 'membership.activated'
  | 'membership.expiring';

type Template = {
  subject?: string;    // для email
  body: string;        // текст сообщения
  channels: NotificationChannel[];
  recipientType: 'client' | 'model' | 'manager' | 'owner';
};

// Шаблоны с плейсхолдерами {{variable}}
export const NOTIFICATION_TEMPLATES: Record<NotificationEvent, Template[]> = {
  'booking.confirmed': [
    {
      subject: 'Booking Confirmed — {{shortId}}',
      body: 'Your booking {{shortId}} with {{modelName}} on {{date}} has been confirmed. Details: {{duration}}h, {{location}}.',
      channels: ['email', 'telegram'],
      recipientType: 'client',
    },
    {
      body: 'New confirmed booking {{shortId}} — {{clientName}}, {{date}}, {{duration}}h.',
      channels: ['telegram'],
      recipientType: 'model',
    },
  ],
  'booking.cancelled': [
    {
      subject: 'Booking Cancelled — {{shortId}}',
      body: 'Booking {{shortId}} has been cancelled. Reason: {{reason}}.',
      channels: ['email', 'telegram'],
      recipientType: 'client',
    },
    {
      body: 'Booking {{shortId}} cancelled by {{cancelledBy}}.',
      channels: ['telegram'],
      recipientType: 'model',
    },
  ],
  'booking.completed': [
    {
      subject: 'Thank you — Leave a Review',
      body: 'Your booking {{shortId}} is complete. We hope you had a wonderful experience. Please leave a review.',
      channels: ['email'],
      recipientType: 'client',
    },
  ],
  'booking.disputed': [
    {
      body: '⚠️ Booking {{shortId}} has been disputed. Review required.',
      channels: ['telegram'],
      recipientType: 'manager',
    },
  ],
  'inquiry.converted': [
    {
      subject: 'Your booking request has been processed',
      body: 'Your inquiry has been converted to booking {{shortId}}.',
      channels: ['email'],
      recipientType: 'client',
    },
  ],
  'inquiry.rejected': [
    {
      subject: 'Update on your inquiry',
      body: 'Unfortunately we are unable to accommodate your request at this time. {{reason}}',
      channels: ['email'],
      recipientType: 'client',
    },
  ],
  'review.approved': [
    {
      body: 'Your review has been published. Thank you for your feedback.',
      channels: ['email'],
      recipientType: 'client',
    },
  ],
  'review.flagged': [
    {
      body: '🚩 Review flagged for moderation — model: {{modelName}}, rating: {{rating}}/5.',
      channels: ['telegram'],
      recipientType: 'manager',
    },
  ],
  'incident.created': [
    {
      body: '🚨 New incident reported — {{severity}}: {{description}}',
      channels: ['telegram'],
      recipientType: 'manager',
    },
  ],
  'incident.resolved': [
    {
      body: 'Incident resolved. Resolution: {{resolutionDetails}}. Compensation: {{compensation}}.',
      channels: ['telegram'],
      recipientType: 'manager',
    },
  ],
  'model.published': [
    {
      body: 'Your profile is now live on the website.',
      channels: ['telegram'],
      recipientType: 'model',
    },
  ],
  'model.hidden': [
    {
      body: 'Your profile has been temporarily hidden. Contact management for details.',
      channels: ['telegram'],
      recipientType: 'model',
    },
  ],
  'sla.breached': [
    {
      body: '⏰ SLA breach: {{policyName}} — {{entityType}} {{entityId}} overdue by {{overdueMinutes}} minutes.',
      channels: ['telegram'],
      recipientType: 'manager',
    },
  ],
  'membership.activated': [
    {
      subject: 'Welcome to {{planName}}',
      body: 'Your {{planName}} membership is now active. Enjoy {{discount}}% booking discount.',
      channels: ['email'],
      recipientType: 'client',
    },
  ],
  'membership.expiring': [
    {
      subject: 'Membership Expiring Soon',
      body: 'Your {{planName}} membership expires on {{expiryDate}}. Renew to keep your benefits.',
      channels: ['email'],
      recipientType: 'client',
    },
  ],
};
```

### 2.2 — Создать `src/lib/notifications/sender.ts`

```typescript
import { NOTIFICATION_TEMPLATES, NotificationEvent, NotificationChannel } from './templates';

// Заменяет {{variable}} в шаблоне
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

export async function sendNotification(
  event: NotificationEvent,
  variables: Record<string, string>,
  options?: { channels?: NotificationChannel[] }
) {
  const templates = NOTIFICATION_TEMPLATES[event];
  if (!templates) return;

  for (const template of templates) {
    const channels = options?.channels || template.channels;
    const body = interpolate(template.body, variables);
    const subject = template.subject ? interpolate(template.subject, variables) : undefined;

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'telegram':
            await sendTelegram(body);
            break;
          case 'email':
            await sendEmail(subject || event, body, variables.recipientEmail);
            break;
          case 'sms':
            // Placeholder — не реализовано
            console.log(`[SMS] ${body}`);
            break;
        }
      } catch (error) {
        console.error(`[Notification] Failed to send ${channel} for ${event}:`, error);
      }
    }
  }
}

async function sendTelegram(message: string) {
  // Используй существующий Telegram клиент в проекте
  // Найди файл с Telegram интеграцией и используй его
  // Если нет — отправь через Telegram Bot API напрямую:
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}

async function sendEmail(subject: string, body: string, to?: string) {
  // Placeholder — подключить когда будет email provider (Resend, SendGrid, etc.)
  console.log(`[Email] To: ${to || 'admin'}, Subject: ${subject}, Body: ${body}`);
}
```

### 2.3 — Интегрировать уведомления в API routes

Добавить `sendNotification()` в ключевые API routes:

- `src/app/api/v1/bookings/[id]/status/route.ts` — при confirmed, cancelled, completed, disputed
- `src/app/api/v1/reviews/[id]/status/route.ts` — при approved, flagged
- `src/app/api/v1/incidents/route.ts` — при создании
- `src/app/api/v1/incidents/[id]/status/route.ts` — при resolved
- `src/app/api/v1/models/[id]/status/route.ts` — при published, hidden
- `src/app/api/v1/sla/check-breaches/route.ts` — при обнаружении breach
- `src/app/api/v1/membership/clients/[clientId]/subscription/route.ts` — при активации

---

## ЗАДАЧА 3: STRIPE WEBHOOK — refunded / disputed

### 3.1 — Обновить `src/app/api/webhooks/stripe/route.ts`

Найди существующий Stripe webhook handler. Добавь обработку событий:

```typescript
// Добавить в switch/case обработки Stripe событий:

case 'charge.refunded':
case 'payment_intent.payment_failed': {
  // Найти Payment по stripePaymentIntentId
  // Обновить статус на 'refunded'
  // Обновить booking.status если нужно
  // writeAuditLog({ action: 'payment.refunded', ... })
  // sendNotification('booking.cancelled', { reason: 'Payment refunded', ... })
  break;
}

case 'charge.dispute.created': {
  // Найти Payment по stripePaymentIntentId
  // Обновить статус на 'disputed'
  // Обновить booking.status на 'disputed'
  // Инкрементировать client.chargebackCount
  // Создать FraudSignal (signalType: 'chargeback')
  // writeAuditLog({ action: 'payment.disputed', ... })
  // sendNotification('booking.disputed', { ... })
  break;
}

case 'charge.dispute.closed': {
  // Обновить Payment — dispute resolved
  // Если won — вернуть booking в предыдущий статус
  // Если lost — оставить disputed
  break;
}
```

---

## ЗАДАЧА 4: REVIEW SENTIMENT AI SCORING

### 4.1 — Создать `src/lib/reviews/sentiment.ts`

```typescript
// Простой sentiment scoring без внешнего API
// Для MVP — keyword-based. Позже можно подключить Anthropic API.

const POSITIVE_WORDS = [
  'amazing', 'wonderful', 'excellent', 'fantastic', 'great', 'lovely',
  'beautiful', 'professional', 'perfect', 'incredible', 'outstanding',
  'superb', 'brilliant', 'delightful', 'charming', 'exceptional',
  'recommend', 'best', 'impressed', 'exceeded', 'pleasure'
];

const NEGATIVE_WORDS = [
  'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'rude',
  'unprofessional', 'late', 'fake', 'scam', 'never', 'waste',
  'unacceptable', 'disgusting', 'avoid', 'regret', 'complaint'
];

const TOXIC_WORDS = [
  // Добавь слова для toxicity detection
  // Оставь минимальный список — грубая лексика, оскорбления
];

export function analyzeSentiment(text: string): {
  sentimentScore: number;  // -1 to 1
  toxicityFlag: boolean;
  suspiciousFlag: boolean;
} {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of words) {
    if (POSITIVE_WORDS.some(pw => word.includes(pw))) positiveCount++;
    if (NEGATIVE_WORDS.some(nw => word.includes(nw))) negativeCount++;
  }
  
  const total = positiveCount + negativeCount;
  const sentimentScore = total === 0 ? 0 : (positiveCount - negativeCount) / total;
  
  const toxicityFlag = TOXIC_WORDS.some(tw => lower.includes(tw));
  
  // Suspicious: очень короткий текст + 5 stars, или text содержит URLs
  const suspiciousFlag = 
    (words.length < 5 && text.length < 20) || 
    /https?:\/\//.test(text) ||
    /\b(whatsapp|telegram|signal|contact me)\b/i.test(text);
  
  return {
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    toxicityFlag,
    suspiciousFlag,
  };
}
```

### 4.2 — Интегрировать в Review creation

Если существует API для создания review (`POST /api/v1/reviews`), добавь:

```typescript
import { analyzeSentiment } from '@/lib/reviews/sentiment';

// При создании review:
const sentiment = analyzeSentiment(text);
// Добавить в create data:
// sentimentScore: sentiment.sentimentScore,
// toxicityFlag: sentiment.toxicityFlag,
// suspiciousFlag: sentiment.suspiciousFlag,
// Если toxicityFlag — автоматически поставить status = 'flagged'
```

---

## ЗАДАЧА 5: SEO SEED SCRIPT

### 5.1 — Создать `scripts/seed-seo-pages.ts`

```typescript
// Запуск: npx tsx scripts/seed-seo-pages.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSEOPages() {
  let created = 0;
  let skipped = 0;

  // 1. Model profiles
  const publishedModels = await prisma.model.findMany({
    where: { status: 'published' },
    select: { id: true, name: true, slug: true },
  });

  for (const model of publishedModels) {
    const path = `/catalog/${model.slug}`;
    const exists = await prisma.sEOPage.findUnique({ where: { path } });
    if (exists) { skipped++; continue; }

    await prisma.sEOPage.create({
      data: {
        pageType: 'model_profile',
        path,
        title: `${model.name} — Premium Companion in London | Virel`,
        metaDescription: `Book ${model.name}, a verified premium companion available in London. Professional, discreet service.`,
        indexStatus: 'indexed',
      },
    });
    created++;
  }

  // 2. Geo pages — список districts
  const districts = [
    'mayfair', 'kensington', 'knightsbridge', 'chelsea', 'belgravia',
    'marylebone', 'westminster', 'soho', 'canary-wharf',
  ];

  for (const district of districts) {
    const path = `/escorts-in/${district}`;
    const exists = await prisma.sEOPage.findUnique({ where: { path } });
    if (exists) { skipped++; continue; }

    const name = district.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    await prisma.sEOPage.create({
      data: {
        pageType: 'geo_page',
        path,
        title: `Escorts in ${name} — Premium Companions | Virel`,
        metaDescription: `Find verified premium escorts in ${name}, London. Discreet, sophisticated companion services available 24/7.`,
        indexStatus: 'indexed',
      },
    });
    created++;
  }

  // 3. Service pages
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
  });

  for (const service of services) {
    if (!service.slug) continue;
    const path = `/services/${service.slug}`;
    const exists = await prisma.sEOPage.findUnique({ where: { path } });
    if (exists) { skipped++; continue; }

    await prisma.sEOPage.create({
      data: {
        pageType: 'service_page',
        path,
        title: `${service.name} — London Escort Services | Virel`,
        metaDescription: `Professional ${service.name.toLowerCase()} services from verified London companions. Book with Virel.`,
        indexStatus: 'indexed',
      },
    });
    created++;
  }

  console.log(`SEO Pages seeded: ${created} created, ${skipped} skipped (already exist).`);
  await prisma.$disconnect();
}

seedSEOPages().catch(console.error);
```

**Примечания:**
- Проверь имена полей: `model.slug` может называться иначе в текущей schema (может быть `model.name` в lowercase). Подгони под реальную schema.
- Для Service — проверь есть ли `slug` поле. Если нет — используй `service.name.toLowerCase().replace(/\s+/g, '-')`.
- SEOPage модель может называться `sEOPage` или `seoPage` в Prisma client — проверь сгенерированный тип.

---

## ЗАДАЧА 6: CALENDAR VIEW ДЛЯ БУКИНГОВ

### 6.1 — Создать `src/app/admin/bookings/calendar/page.tsx`

Визуальный календарь бронирований.

**Layout:** Заголовок "Booking Calendar" + переключатель Week/Day + навигация ← Today →

**Для MVP — простой недельный вид:**
- 7 колонок (Mon-Sun)
- Каждый букинг отображается как карточка в своём дне
- Карточка: время, имя модели, имя клиента, статус Badge
- Клик по карточке → переход на `/admin/bookings/{id}`

**Данные:** Загрузка букингов за выбранную неделю:
```
GET /api/v1/bookings?from={monday}&to={sunday}&limit=100
```

**Навигация:**
- Кнопки ← → для переключения недели
- Кнопка "Today" для возврата к текущей неделе
- Отображение текущей недели: "3 - 9 March 2026"

**Цвета карточек по статусу:**
- confirmed = amber border
- in_progress = green border
- completed = gray
- cancelled = red, strikethrough
- disputed = purple

### 6.2 — Добавить ссылку в sidebar

Добавить в секцию Operations (после Bookings):
- 📅 Calendar → /admin/bookings/calendar

---

## ЗАДАЧА 7: ADMIN SETTINGS — NOTIFICATION PREFERENCES

### 7.1 — Обновить `src/app/admin/settings/page.tsx`

Добавить секцию "Notification Settings":

- Telegram Bot Token (text input, masked)
- Telegram Admin Chat ID (text input)
- Telegram Enabled (toggle)
- Email Notifications Enabled (toggle)

Сохранение в SystemSettings (таблица из Phase 1):
```
PATCH /api/v1/system/settings
body: { key: 'telegram_bot_token', value: '...' }
```

### 7.2 — Создать/обновить `src/app/api/v1/system/settings/route.ts`

Если не существует — создать:
- GET — получить все настройки (Owner only)
- PATCH — обновить настройку по key (Owner only)

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. AuditLog schema update + audit helper — Задача 1.1
2. `npx prisma db push` если schema изменилась
3. Audit logging в API routes — Задача 1.2
4. Notification templates + sender — Задача 2
5. Notification integration в routes — Задача 2.3
6. Stripe webhook refunded/disputed — Задача 3
7. Review sentiment — Задача 4
8. SEO seed script — Задача 5
9. Calendar view — Задача 6
10. Settings notifications — Задача 7
11. `npm run build` — финальная проверка

---

## ОГРАНИЧЕНИЯ

- **НЕ** трогать публичный фронтенд
- **НЕ** ломать существующие Phase 1-3 файлы
- Audit logs — append-only, никогда не удалять
- Telegram sender — graceful failure (если token не установлен — просто пропускать, не падать)
- Email sender — placeholder (console.log), не подключать реальный провайдер пока
- Sentiment analysis — keyword-based для MVP, без внешних API вызовов
- Calendar — простой CSS grid, без тяжёлых библиотек (не тянуть FullCalendar)
