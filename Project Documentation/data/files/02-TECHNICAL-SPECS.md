# 📐 TECHNICAL SPECIFICATIONS

## Документ: Техническое задание и требования
**Версия:** 2.0  
**Дата:** 27 февраля 2026  
**Статус:** ✅ Approved

---

## 📚 ОГЛАВЛЕНИЕ

1. [Функциональные требования](#функциональные-требования)
2. [Нефункциональные требования](#нефункциональные-требования)
3. [Роли и права доступа](#роли-и-права-доступа)
4. [Бизнес-логика](#бизнес-логика)
5. [Технические ограничения](#технические-ограничения)

---

## 1. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 1.1 Система моделей (Models)

**FR-M-001:** Создание профиля модели
- Input: name, age, nationality, services, location, photos
- Validation: уникальный slug, email (optional), phone (optional)
- Output: Model entity с auto-generated slug
- Side effects: создание audit log

**FR-M-002:** Редактирование профиля
- Поддержка изменения slug
- Auto-create 301 redirect при смене slug
- Auto-generate SEO meta если пусто
- Audit log всех изменений

**FR-M-003:** Статусы модели
- DRAFT - черновик
- ACTIVE - активна, доступна для букинга
- HOLIDAY - в отпуске
- ARCHIVED - в архиве (soft delete)

**FR-M-004:** Availability календарь
- Еженедельное расписание
- Specific dates (исключения)
- Time slots (hourly granularity)
- Block/unblock dates

**FR-M-005:** SEO для моделей
- Auto-generate metaTitle: "{Name} | London Escort | Virel"
- Auto-generate metaDescription из bio (first 155 chars)
- Canonical URL: /catalog/{slug}
- Schema markup: Person + ProfilePage

---

### 1.2 Система бронирований (Bookings)

**FR-B-001:** Создание бронирования
- Input: modelId, client details, date/time, duration, location
- Validation:
  - Model exists and ACTIVE
  - Model available at requested time
  - Valid email/phone format
- Calculate price from model.services
- Support idempotency (requestId header)

**FR-B-002:** Идемпотентность
- Header: Idempotency-Key or X-Idempotency-Key
- Duplicate request → return existing booking (no error)
- Хранить requestId в БД
- TTL: 24 hours

**FR-B-003:** Статусы бронирования
- PENDING - ожидает подтверждения (default)
- CONFIRMED - подтверждено
- IN_PROGRESS - в процессе
- COMPLETED - завершено
- CANCELLED - отменено
- NO_SHOW - клиент не пришёл

**FR-B-004:** Notifications
- При создании → TELEGRAM_DIVA (ресепшн)
- При подтверждении → EMAIL + SMS (клиент)
- При изменении статуса → sync с AppSheet

**FR-B-005:** Pricing
- Base rate из model.services (incall/outcall)
- Extra services (addon pricing)
- Duration-based calculation
- Total amount в booking entity

---

### 1.3 SEO Whitelist

**FR-S-001:** Типы страниц
- GEO - districts/locations (escorts-in-{district})
- SERVICE - services (services/{slug})
- ATTRIBUTE - attributes ({attribute}-escorts-london)

**FR-S-002:** Требования к контенту
- Title: max 60 characters
- Meta Description: max 160 characters
- H1: уникальный
- Content: min 800 words
- FAQ: 6+ questions (JSON structure)

**FR-S-003:** Indexation logic
- isIndexable=true → canonical to self, robots="index,follow"
- isIndexable=false → canonical to parent, robots="noindex,follow"
- GEO pages: index only if ≥8 models serve district
- Non-whitelist filter combinations → noindex

**FR-S-004:** Schema markup
- GEO: CollectionPage + ItemList + FAQPage + BreadcrumbList
- SERVICE: Service + FAQPage + BreadcrumbList
- ATTRIBUTE: CollectionPage + ItemList + BreadcrumbList
- Model: ProfilePage + Person + Offer + ImageObject

---

### 1.4 Audit Log

**FR-A-001:** Tracked actions
- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
- Entity types: MODEL, BOOKING, USER, SEO_PAGE, SETTINGS

**FR-A-002:** Captured data
- userId, action, entityType, entityId
- changes (JSON: before/after values)
- ipAddress, userAgent
- timestamp (automatic)

**FR-A-003:** Retention
- Keep all logs (no auto-delete)
- Paginated access через API
- Export option (CSV/JSON)

---

### 1.5 Notifications Queue

**FR-N-001:** Типы уведомлений
- TELEGRAM_DIVA - DivaReceptionBot
- TELEGRAM_KESHA - KeshaZeroGapBot
- EMAIL - email notifications
- SMS - SMS notifications

**FR-N-002:** Retry logic
- Max attempts: 3
- Backoff: exponential (1min, 5min, 15min)
- Failed → status=FAILED, store error
- Idempotency через requestId

**FR-N-003:** Payload structure
```json
{
  "type": "TELEGRAM_DIVA",
  "recipient": "chat_id",
  "payload": {
    "bookingId": "...",
    "modelName": "...",
    "clientName": "...",
    "date": "...",
    "time": "..."
  }
}
```

---

## 2. НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 2.1 Performance

**NFR-P-001:** Page load time
- Target: < 2s (Time to Interactive)
- First Paint: < 1s
- Lighthouse Score: ≥ 90

**NFR-P-002:** API response time
- GET requests: < 200ms (p95)
- POST/PUT requests: < 500ms (p95)
- Complex queries: < 1s

**NFR-P-003:** Database
- Connection pooling (Neon Pooler)
- Query optimization (indexes)
- N+1 prevention (Prisma includes)

---

### 2.2 Scalability

**NFR-SC-001:** Concurrent users
- Support: 1000 concurrent users
- Horizontal scaling ready (stateless)

**NFR-SC-002:** Data volume
- Models: 1000+
- Bookings: 10,000+
- Pages: 100+
- Audit logs: unlimited

---

### 2.3 Security

**NFR-SE-001:** Authentication
- JWT tokens
- Refresh tokens (httpOnly cookies)
- 2FA support (future)

**NFR-SE-002:** Authorization
- RBAC (Role-Based Access Control)
- Roles: ADMIN, MANAGER, RECEPTION
- Row-level security (future)

**NFR-SE-003:** Data protection
- HTTPS only (SSL)
- Password hashing (bcrypt)
- SQL injection protection (Prisma)
- XSS prevention (React escaping)
- CSRF tokens

**NFR-SE-004:** API security
- Rate limiting (100 req/min per IP)
- Idempotency keys
- Request signing (HMAC - future)

---

### 2.4 Availability

**NFR-AV-001:** Uptime
- Target: 99.9% (8.76 hours downtime/year)
- Monitoring: Sentry / UptimeRobot

**NFR-AV-002:** Backup
- Database: daily automated backups (Neon)
- Retention: 30 days
- Recovery: < 1 hour RTO

---

### 2.5 Maintainability

**NFR-M-001:** Code quality
- TypeScript strict mode
- ESLint + Prettier
- Test coverage: ≥ 70% (future)

**NFR-M-002:** Documentation
- API documentation (OpenAPI/Swagger)
- Code comments (JSDoc)
- README files
- Architecture diagrams

---

## 3. РОЛИ И ПРАВА ДОСТУПА

### 3.1 ADMIN

**Права:**
- ✅ Полный доступ ко всем функциям
- ✅ Управление пользователями
- ✅ Настройки системы
- ✅ Audit log (просмотр)
- ✅ Удаление данных

**Ограничения:**
- Нет

---

### 3.2 MANAGER

**Права:**
- ✅ Просмотр всех данных
- ✅ Создание/редактирование моделей
- ✅ Управление бронированиями
- ✅ Просмотр статистики
- ✅ Export данных

**Ограничения:**
- ❌ Нельзя удалять модели
- ❌ Нельзя управлять пользователями
- ❌ Нельзя менять настройки системы

---

### 3.3 RECEPTION

**Права:**
- ✅ Просмотр моделей
- ✅ Создание бронирований
- ✅ Обновление статусов бронирований
- ✅ Просмотр календаря

**Ограничения:**
- ❌ Нельзя редактировать модели
- ❌ Нельзя удалять бронирования
- ❌ Нельзя видеть финансовую информацию
- ❌ Нельзя видеть audit log

---

## 4. БИЗНЕС-ЛОГИКА

### 4.1 Booking Flow

```
1. Client submits booking form
   ↓
2. Validate inputs
   ↓
3. Check idempotency key
   ↓ (если новый)
4. Verify model availability
   ↓
5. Calculate price
   ↓
6. Create booking (status: PENDING)
   ↓
7. Queue notification (TELEGRAM_DIVA)
   ↓
8. Queue AppSheet sync
   ↓
9. Create audit log
   ↓
10. Return booking to client
```

---

### 4.2 Model Approval Flow

```
1. Reception creates model (status: DRAFT)
   ↓
2. Manager reviews profile
   ↓
3. Manager uploads photos
   ↓
4. Manager sets status: ACTIVE
   ↓ (trigger)
5. Set publishedAt timestamp
   ↓
6. Model appears in catalog
   ↓
7. Model appears in search results
   ↓
8. Create audit log
```

---

### 4.3 SEO Page Indexation Logic

```
GET /escorts-in-mayfair
   ↓
1. Fetch page from seo_whitelist (slug="mayfair")
   ↓
2. Count models serving Mayfair
   ↓
3. IF modelCount >= 8:
      robots = "index, follow"
      canonical = "/escorts-in-mayfair"
   ELSE:
      robots = "noindex, follow"
      canonical = "/london-escorts"
   ↓
4. Render page with SEO meta
   ↓
5. Include Schema markup
```

---

### 4.4 Notification Retry Logic

```
Notification created (status: PENDING)
   ↓
Attempt 1: Send via Telegram API
   ↓
   ├─ Success → status=SENT, sentAt=now()
   │
   └─ Failure → attempts++, wait 1 minute
              ↓
              Attempt 2: Retry
              ↓
              ├─ Success → status=SENT
              │
              └─ Failure → attempts++, wait 5 minutes
                         ↓
                         Attempt 3: Final retry
                         ↓
                         ├─ Success → status=SENT
                         │
                         └─ Failure → status=FAILED
                                       error="{error message}"
                                       failedAt=now()
```

---

## 5. ТЕХНИЧЕСКИЕ ОГРАНИЧЕНИЯ

### 5.1 Constraints

**Database:**
- Max connections: 100 (Neon Pooler)
- Query timeout: 30s
- Max row size: 1GB (PostgreSQL limit)

**API:**
- Request timeout: 30s
- Max payload size: 10MB
- Rate limit: 100 req/min per IP

**File upload:**
- Max file size: 5MB per image
- Formats: JPEG, PNG, WebP, AVIF
- Max files per upload: 10

**Content:**
- Model name: 2-100 characters
- Model bio: max 2000 characters
- Booking notes: max 500 characters
- SEO content: min 800, max 5000 words

---

### 5.2 Browser Support

**Required:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile:**
- iOS Safari 14+
- Chrome Android 90+

---

### 5.3 Dependencies Versions

```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "prisma": "5.x",
  "tailwindcss": "3.4.x"
}
```

---

## 📞 КОНТАКТЫ

**Questions:** Adel (admin@virel.com)  
**Technical Lead:** (TBD)

---

## 📚 СВЯЗАННАЯ ДОКУМЕНТАЦИЯ

- [Project Overview](./01-PROJECT-OVERVIEW.md)
- [Database Schema](./03-DATABASE-SCHEMA.md)
- [API Documentation](./04-API-DOCUMENTATION.md)

---

**Последнее обновление:** 27 февраля 2026  
**Версия:** 2.0  
**Статус:** ✅ Approved
