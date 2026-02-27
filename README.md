# Virel - Premium Companion Booking Platform

MVP версия веб-платформы для бронирования премиум компаньонов в Лондоне.

## 📋 Что включено в MVP

✅ **Frontend (Next.js 14)**
- Главная страница с Hero секцией
- Каталог с фильтрами (location, age, services)
- Профили моделей (SEO-оптимизированные с ЧПУ slug)
- Система бронирования
- FAQ с Schema разметкой
- Адаптивный дизайн (mobile-first)

✅ **Backend**
- PostgreSQL база данных через Prisma ORM
- REST API endpoints
- Authentication (JWT)
- Интеграция с Telegram ботами
- AppSheet sync

✅ **SEO Оптимизация**
- Canonical теги на всех страницах
- ЧПУ URL (/catalog/{slug})
- Уникальные Title/Meta для каждой страницы
- Schema Markup (Organization, FAQPage, Person/Profile)
- Core Web Vitals оптимизация
- Image optimization (WebP/AVIF)

✅ **Интеграции**
- DivaReceptionBot (30-мин напоминания, эскалация Tommy)
- KeshaZeroGapBot (AppSheet sync)

---

## 🚀 Быстрый старт

### 1. Предварительные требования

Убедитесь, что установлено:
- **Node.js** >= 18.17.0
- **PostgreSQL** database
- **Git**

### 2. Установка

```bash
# Клонируйте проект
cd C:\Virel

# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env
```

### 3. Настройка .env

Откройте `.env` и заполните переменные:

```env
# Database (замените на ваши данные)
DATABASE_URL="postgresql://user:password@localhost:5432/virel"

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET="ваш-супер-секретный-ключ"

# Telegram Bots (ваши токены)
DIVA_RECEPTION_BOT_TOKEN="ваш-токен-дива-бота"
KESHA_ZEROGAP_BOT_TOKEN="ваш-токен-кеша-бота"
TELEGRAM_CHAT_ID_RECEPTION="chat-id-reception"
TELEGRAM_CHAT_ID_TOMMY="chat-id-tommy"

# AppSheet
APPSHEET_API_KEY="ваш-api-ключ"
APPSHEET_APP_ID="ваш-app-id"

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Инициализация базы данных

```bash
# Создать Prisma client
npm run db:generate

# Загрузить schema в базу
npm run db:push

# (Опционально) Открыть Prisma Studio для управления данными
npm run db:studio
```

### 5. Запуск проекта

```bash
# Development режим
npm run dev

# Откройте http://localhost:3000
```

---

## 📁 Структура проекта

```
C:\Virel\
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Главный layout
│   │   ├── page.tsx            # Главная страница
│   │   ├── catalog/            # Каталог моделей
│   │   │   ├── page.tsx        # Список моделей
│   │   │   └── [slug]/         # Профиль модели
│   │   │       └── page.tsx
│   │   ├── api/                # API Routes
│   │   │   ├── bookings/       # Бронирования
│   │   │   └── models/         # Модели
│   │   └── admin/              # Админ панель
│   ├── components/             # React компоненты
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── FeaturedModels.tsx
│   │   ├── FAQ.tsx
│   │   ├── CatalogFilters.tsx
│   │   └── ModelCard.tsx
│   ├── lib/                    # Утилиты
│   │   ├── db/                 # Prisma client
│   │   ├── telegram/           # Telegram боты
│   │   │   └── bots.ts         # DivaBot & KeshaBot
│   │   └── auth/               # Аутентификация
│   └── styles/
│       └── globals.css         # Tailwind styles
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   └── images/                 # Статические изображения
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env                        # Переменные окружения
```

---

## 🔧 Основные команды

```bash
npm run dev          # Запуск dev сервера
npm run build        # Production build
npm run start        # Запуск production сервера
npm run lint         # ESLint проверка

npm run db:generate  # Генерация Prisma client
npm run db:push      # Синхронизация schema с БД
npm run db:studio    # Открыть Prisma Studio
```

---

## 📊 База данных (Prisma Schema)

### Основные модели:

**Model** - Профили компаньонов
- id, slug, name, age, nationality
- Physical attributes (height, weight, hairColor, etc.)
- SEO fields (metaTitle, metaDescription)
- Status (ACTIVE, ON_HOLIDAY, ARCHIVED)

**Booking** - Бронирования
- Client info (name, phone, email)
- Booking details (date, duration, location)
- Status (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)

**User** - Пользователи админки
- Roles: ADMIN, MANAGER, RECEPTION, MODEL

**TelegramLog** - Логи Telegram ботов
**AppSheetSync** - Логи синхронизации с AppSheet

---

## 🤖 Интеграция с Telegram ботами

### DivaReceptionBot

```typescript
import { divaBot } from '@/lib/telegram/bots'

// Уведомление о новом бронировании
await divaBot.notifyNewBooking({
  id: booking.id,
  clientName: 'John Smith',
  clientPhone: '+447123456789',
  modelName: 'Sophia',
  date: new Date(),
  duration: 2,
  location: 'Mayfair'
})

// Автоматически:
// - Отправит сообщение reception
// - Через 30 мин - напоминание
// - Через 45 мин - эскалация Tommy
```

### KeshaZeroGapBot

```typescript
import { keshaBot } from '@/lib/telegram/bots'

// Отправка карточки модели
await keshaBot.sendBookingCard(modelTelegramId, {
  id: booking.id,
  clientName: 'John Smith',
  date: new Date(),
  duration: 2,
  location: 'Mayfair',
  status: 'CONFIRMED'
})

// Синхронизация с AppSheet
await keshaBot.syncWithAppSheet(bookingData)
```

---

## 🎨 Дизайн

### Цветовая схема

**Dark Theme (по умолчанию):**
- Background: `#121212` (почти черный)
- Primary: `#F5C249` (золотой)
- Text: `#FAFAFA` (белый)

**Light Theme:**
- Background: `#FFFFFF` (белый)
- Primary: `#3B82F6` (синий)
- Text: `#111827` (темный)

### Шрифты

- **Headings:** Playfair Display (serif) - элегантность
- **Body:** Inter (sans-serif) - читаемость

---

## 🚢 Деплой

### Вариант 1: Railway (рекомендуется)

1. Создайте аккаунт на [Railway](https://railway.app/)
2. Подключите GitHub репозиторий
3. Railway автоматически:
   - Установит зависимости
   - Создаст PostgreSQL базу
   - Задеплоит приложение

```bash
# Добавьте environment variables в Railway:
DATABASE_URL, JWT_SECRET, TELEGRAM токены, etc.
```

### Вариант 2: Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com/)
2. Импортируйте проект из GitHub
3. Настройте PostgreSQL через [Neon](https://neon.tech/) или [Supabase](https://supabase.com/)
4. Добавьте переменные окружения

```bash
vercel --prod
```

### Вариант 3: VPS (DigitalOcean, Hetzner, etc.)

```bash
# На сервере
git clone https://github.com/your-repo/virel.git
cd virel
npm install
npm run build

# Используйте PM2 для управления процессом
pm2 start npm --name "virel" -- start
pm2 save
pm2 startup
```

---

## ✅ Чеклист перед запуском

- [ ] Заполнены все переменные в `.env`
- [ ] База данных создана и доступна
- [ ] Prisma schema синхронизирована (`npm run db:push`)
- [ ] Telegram боты настроены и токены корректны
- [ ] AppSheet API ключ валиден
- [ ] Тестовый запуск на localhost работает
- [ ] SSL сертификат установлен (для production)
- [ ] Google Analytics настроен (опционально)

---

## 📈 Следующие шаги (после MVP)

### Фаза 2 (2-4 недели):
- [ ] Geo-страницы для районов Лондона
- [ ] Платежная система (Stripe)
- [ ] Email уведомления
- [ ] Расширенная админка с аналитикой

### Фаза 3 (1-2 месяца):
- [ ] CRM система
- [ ] Мультиязычность (RU, EN)
- [ ] Блог для SEO
- [ ] Mobile приложение

---

## 🆘 Помощь и поддержка

### Частые проблемы:

**"Cannot connect to database"**
```bash
# Проверьте DATABASE_URL в .env
# Убедитесь что PostgreSQL запущен
```

**"Module not found"**
```bash
# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

**"Prisma client error"**
```bash
# Пересоздайте Prisma client
npm run db:generate
```

### Контакты:
- GitHub Issues: [ваш репозиторий]
- Email: dev@virel.com

---

## 📝 Лицензия

Proprietary - All rights reserved

---

**Сделано с ❤️ для Virel**
