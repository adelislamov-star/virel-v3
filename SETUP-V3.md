# 🚀 SETUP GUIDE - VIREL v3

Пошаговая инструкция для запуска Operations Platform

---

## PREREQUISITES

Убедись что установлено:

```bash
Node.js: v20.x или выше
npm: v10.x или выше
PostgreSQL: v15.x (или используй Neon.tech)
Redis: v7.x (опционально, для queue worker)
Git: v2.x
```

Проверка версий:
```bash
node --version  # v20.x
npm --version   # v10.x
git --version   # v2.x
```

---

## STEP 1: КЛОНИРОВАНИЕ (если нужно)

```bash
# Если проект ещё не склонирован
git clone https://github.com/your-org/virel.git
cd virel
```

---

## STEP 2: УСТАНОВКА ЗАВИСИМОСТЕЙ

```bash
npm install
```

Это установит:
- Next.js 14
- Prisma 5
- TailwindCSS
- Socket.io
- BullMQ
- И все остальные зависимости из package.json

---

## STEP 3: НАСТРОЙКА БАЗЫ ДАННЫХ

### Option A: Neon.tech (Рекомендуется)

1. Зайди на https://neon.tech
2. Создай аккаунт
3. Создай новый проект "Virel v3"
4. Скопируй connection string

### Option B: Локальный PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15
createdb virel

# Ubuntu
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb virel
```

---

## STEP 4: НАСТРОЙКА .ENV

```bash
# Скопируй template
cp .env.example .env

# Открой .env в редакторе
nano .env
```

**Минимально необходимые переменные:**

```bash
# Database (ОБЯЗАТЕЛЬНО)
DATABASE_URL="postgresql://user:pass@host:5432/virel"

# Neon.tech example:
# DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Next.js (ОБЯЗАТЕЛЬНО)
NEXTAUTH_SECRET="generate-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"

# Telegram (Опционально, для ботов)
DIVA_RECEPTION_BOT_TOKEN=""
KESHA_ZEROGAP_BOT_TOKEN=""
TELEGRAM_CHAT_ID_TOMMY=""
TELEGRAM_CHAT_ID_LUKAS=""
TELEGRAM_CHAT_ID_SASHA=""
TELEGRAM_CHAT_ID_ADAM=""
TELEGRAM_CHAT_ID_DONALD=""

# Redis (Опционально, для queue worker)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Stripe (Опционально, для payments)
STRIPE_SECRET_KEY=""
STRIPE_PUBLIC_KEY=""

# Email (Опционально)
RESEND_API_KEY=""

# SMS (Опционально)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

**Генерация NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## STEP 5: PRISMA SETUP

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Push schema to database
npm run db:push

# 3. Seed demo data
npm run db:seed
```

**Что seed создаст:**
- 5 ролей (OWNER, OPS_MANAGER, OPERATOR, etc)
- 6 пользователей (Adel, Tommy, 4 операторов)
- 3 локации (Mayfair, Kensington, Knightsbridge)
- 3 сервиса (GFE, Dinner Date, Massage)
- 1 модель (Sophia)
- 1 клиент (Alan)
- 1 inquiry
- 1 booking
- 2 tasks
- 1 exception

---

## STEP 6: ЗАПУСК DEV SERVER

```bash
npm run dev
```

Откроется на http://localhost:3000

---

## STEP 7: ЛОГИН

Открой браузер:
```
http://localhost:3000/admin/action-center
```

**Credentials:**
```
Email: admin@virel.com
Password: password123
```

---

## STEP 8: ПРОВЕРКА ACTION CENTER

После логина ты должен увидеть:
- 2 tasks в списке
- 1 exception
- Summary cards (Urgent, High Priority, Normal)

Если видишь - всё работает! ✅

---

## STEP 9 (Опционально): ЗАПУСК QUEUE WORKER

Для обработки background jobs:

```bash
# В отдельном терминале
npm run worker
```

Это запустит 3 worker'а:
- Critical queue (5 concurrent)
- Ops queue (10 concurrent)
- Heavy queue (2 concurrent)

**Требования:**
- Redis должен быть запущен
- REDIS_HOST и REDIS_PORT в .env

Без worker'а всё равно будет работать, но без:
- Автоматической обработки events
- Background jobs
- Уведомлений

---

## STEP 10 (Опционально): REDIS SETUP

### macOS:
```bash
brew install redis
brew services start redis
```

### Ubuntu:
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### Docker:
```bash
docker run -d -p 6379:6379 redis:7
```

Проверка:
```bash
redis-cli ping
# Должно вернуть: PONG
```

---

## TROUBLESHOOTING

### ❌ Database connection failed

**Проблема:** Prisma не может подключиться к БД

**Решение:**
1. Проверь DATABASE_URL в .env
2. Убедись что PostgreSQL запущен
3. Проверь права доступа
4. Попробуй подключиться через psql:
```bash
psql "postgresql://user:pass@host:5432/virel"
```

---

### ❌ Port 3000 already in use

**Проблема:** Порт занят другим процессом

**Решение:**
```bash
# Найди процесс
lsof -i :3000

# Убей процесс
kill -9 <PID>

# Или используй другой порт
PORT=3001 npm run dev
```

---

### ❌ Prisma generate failed

**Проблема:** Ошибка при генерации Prisma Client

**Решение:**
```bash
# Удали node_modules
rm -rf node_modules

# Удали Prisma cache
rm -rf node_modules/.prisma

# Переустанови
npm install

# Попробуй снова
npm run db:generate
```

---

### ❌ Seed failed

**Проблема:** Ошибка при seed данных

**Решение:**
```bash
# Очисти БД
npm run db:push --force-reset

# Попробуй seed снова
npm run db:seed
```

---

### ❌ Redis connection failed

**Проблема:** Worker не может подключиться к Redis

**Решение:**
1. Убедись что Redis запущен:
```bash
redis-cli ping
```

2. Проверь REDIS_HOST и REDIS_PORT в .env

3. Если не нужен worker, просто не запускай его

---

## ПОЛЕЗНЫЕ КОМАНДЫ

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed demo data

# Worker
npm run worker           # Start queue worker

# Linting
npm run lint             # Run ESLint
```

---

## NEXT STEPS

✅ Всё работает? Отлично!

**Теперь можно:**

1. Изучи Action Center:
   - http://localhost:3000/admin/action-center

2. Проверь API endpoints:
   - GET http://localhost:3000/api/v1/tasks
   - GET http://localhost:3000/api/v1/inquiries
   - GET http://localhost:3000/api/v1/bookings

3. Почитай документацию:
   - `/docs/10-OPERATIONS-PLATFORM.md`
   - `/docs/11-IMPLEMENTATION-ROADMAP.md`

4. Начни разработку Release 2:
   - Stripe integration
   - Availability management
   - Notifications

---

## SUPPORT

Проблемы? Вопросы?

1. Проверь `/docs`
2. Проверь logs в терминале
3. Проверь Prisma Studio: `npm run db:studio`
4. Открой issue на GitHub

---

**Setup готов!** 🎉  
**Приятной работы!** 🚀
