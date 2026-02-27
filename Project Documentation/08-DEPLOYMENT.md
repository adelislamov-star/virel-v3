# 🚀 DEPLOYMENT GUIDE

## Документ: Руководство по деплою
**Версия:** 2.0  
**Дата:** 27 февраля 2026

---

## 📚 ОГЛАВЛЕНИЕ

1. [Локальная разработка](#локальная-разработка)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Production Deployment](#production-deployment)
5. [CI/CD](#cicd)
6. [Monitoring](#monitoring)

---

## 1. ЛОКАЛЬНАЯ РАЗРАБОТКА

### ✅ Prerequisites:

```bash
Node.js: 20.x или выше
npm: 10.x или выше
Git: 2.x или выше
PostgreSQL: 15.x (optional, используем Neon)
```

### 📦 Installation:

```bash
# 1. Clone repository
git clone https://github.com/your-org/virel.git
cd virel

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env with your credentials
nano .env

# 5. Generate Prisma Client
npm run db:generate

# 6. Push schema to database
npm run db:push

# 7. Seed database
node prisma/seed-v2.js

# 8. Run development server
npm run dev
```

### 🌐 Access:

```
Frontend: http://localhost:3000
Admin: http://localhost:3000/admin
API: http://localhost:3000/api
```

---

## 2. ENVIRONMENT VARIABLES

### 📝 .env.example:

```bash
# ================================
# DATABASE
# ================================
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# Neon.tech example:
# DATABASE_URL="postgresql://neondb_owner:pass@ep-sparkling-shape.aws.neon.tech/neondb?sslmode=require"

# ================================
# NEXTAUTH (Future)
# ================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-32-char-string"

# ================================
# TELEGRAM BOTS
# ================================
DIVA_RECEPTION_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
KESHA_ZEROGAP_BOT_TOKEN="9876543210:ZYXwvuTSRqponMLKjiHGFedcBA"

# Reception staff chat IDs
TELEGRAM_CHAT_ID_LUKAS="123456789"
TELEGRAM_CHAT_ID_SASHA="987654321"
TELEGRAM_CHAT_ID_ADAM="456789123"
TELEGRAM_CHAT_ID_DONALD="789123456"

# Manager chat ID
TELEGRAM_CHAT_ID_TOMMY="321654987"

# ================================
# APPSHEET
# ================================
APPSHEET_API_KEY="V2-xxxxx-xxxxx-xxxxx"
APPSHEET_APP_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
APPSHEET_TABLE_NAME="Bookings"

# ================================
# EMAIL (Future - SendGrid/Resend)
# ================================
EMAIL_FROM="noreply@virel.com"
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# OR
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"

# ================================
# SMS (Future - Twilio)
# ================================
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+447700900123"

# ================================
# PAYMENT (Future - Stripe)
# ================================
STRIPE_PUBLIC_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"

# ================================
# REDIS (Future)
# ================================
REDIS_URL="redis://default:password@host:6379"

# ================================
# MONITORING (Future)
# ================================
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

# ================================
# ANALYTICS
# ================================
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# ================================
# SEO
# ================================
NEXT_PUBLIC_SITE_URL="https://virel.com"
NEXT_PUBLIC_SITE_NAME="Virel"

# ================================
# DEVELOPMENT
# ================================
NODE_ENV="development"
# production | development | test
```

### 🔐 Security Notes:

- ❌ **НИКОГДА** не коммитьте .env в Git
- ✅ Используйте .env.local для локальных переопределений
- ✅ Храните секреты в безопасном месте (1Password, etc)
- ✅ Используйте разные credentials для dev/staging/prod

---

## 3. DATABASE SETUP

### 🗄️ Option 1: Neon.tech (Recommended)

**Преимущества:**
- ✅ Serverless PostgreSQL
- ✅ Автоматическое масштабирование
- ✅ Встроенные backups
- ✅ Бесплатный tier (до 512MB)

**Setup:**

1. Создайте аккаунт на https://neon.tech
2. Создайте проект "Virel"
3. Выберите регион (AWS US East 1 recommended)
4. Скопируйте connection string
5. Добавьте в .env:

```bash
DATABASE_URL="postgresql://neondb_owner:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require"
```

6. Push schema:
```bash
npm run db:push
```

7. Seed data:
```bash
node prisma/seed-v2.js
```

---

### 🗄️ Option 2: Local PostgreSQL

```bash
# Install PostgreSQL
# macOS:
brew install postgresql@15
brew services start postgresql@15

# Ubuntu:
sudo apt install postgresql-15
sudo systemctl start postgresql

# Create database
createdb virel

# Update .env
DATABASE_URL="postgresql://user:pass@localhost:5432/virel"

# Push schema
npm run db:push
```

---

### 🗄️ Option 3: Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: virel
      POSTGRES_PASSWORD: password
      POSTGRES_DB: virel
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
DATABASE_URL="postgresql://virel:password@localhost:5432/virel"
npm run db:push
```

---

## 4. PRODUCTION DEPLOYMENT

### 🚂 Option 1: Railway (Recommended)

**Преимущества:**
- ✅ Простой деплой из GitHub
- ✅ Автоматический HTTPS
- ✅ Встроенный PostgreSQL
- ✅ Logs и monitoring
- ✅ $5/month credit бесплатно

**Steps:**

1. **Подготовка кода:**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Railway setup:**
- Зайдите на https://railway.app
- New Project → Deploy from GitHub repo
- Выберите репозиторий "virel"
- Railway автоматически обнаружит Next.js

3. **Environment variables:**
В Railway dashboard → Variables → Raw Editor:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=your-secret-here
# ... остальные переменные
```

4. **Database:**
- New → Database → PostgreSQL
- Railway автоматически создаст DATABASE_URL
- Push schema через CLI:
```bash
railway link
railway run npx prisma db push
railway run node prisma/seed-v2.js
```

5. **Domain:**
- Settings → Domains → Generate Domain
- Или добавьте custom domain: virel.com

6. **Deploy:**
- Railway автоматически деплоит при push в main
- Или вручную: Settings → Deploy → Redeploy

---

### ▲ Option 2: Vercel

**Преимущества:**
- ✅ Оптимизация для Next.js
- ✅ Edge Functions
- ✅ Instant rollbacks
- ✅ Preview deployments

**Steps:**

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
# Follow prompts
```

4. **Environment variables:**
```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... etc
```

5. **Database:**
- Используйте Neon.tech или Supabase
- Не рекомендуется self-hosted DB с Vercel

6. **Production:**
```bash
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["lhr1"]
}
```

---

### 🖥️ Option 3: VPS (DigitalOcean/Linode)

**Для advanced users:**

1. **Server setup:**
```bash
# Ubuntu 22.04
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2
```

2. **Deploy app:**
```bash
# Clone repo
git clone https://github.com/your-org/virel.git /var/www/virel
cd /var/www/virel

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "virel" -- start
pm2 save
pm2 startup
```

3. **Nginx config:**
```nginx
# /etc/nginx/sites-available/virel
server {
    listen 80;
    server_name virel.com www.virel.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **SSL with Let's Encrypt:**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d virel.com -d www.virel.com
```

---

## 5. CI/CD

### 🔄 GitHub Actions

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 6. MONITORING

### 📊 Health Checks:

**Create `/api/health/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    }, { status: 503 });
  }
}
```

**Monitor with:**
- UptimeRobot: https://uptimerobot.com
- Ping endpoint: https://virel.com/api/health
- Frequency: Every 5 minutes
- Alert: Email/SMS on failure

---

### 📈 Performance Monitoring:

**Sentry (errors):**
```bash
npm install @sentry/nextjs

# sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**Vercel Analytics:**
```bash
npm install @vercel/analytics

# app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

### 📧 Error Alerts:

**Email on critical errors:**
```typescript
// lib/notify.ts
export async function notifyError(error: Error) {
  if (process.env.NODE_ENV === 'production') {
    await sendEmail({
      to: 'admin@virel.com',
      subject: '🚨 Production Error',
      body: `Error: ${error.message}\nStack: ${error.stack}`
    });
  }
}
```

---

## 📋 DEPLOYMENT CHECKLIST

### Before Production:

- [ ] Environment variables set
- [ ] Database migrated
- [ ] Database seeded
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Health check endpoint working
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Backup strategy
- [ ] Rollback plan
- [ ] Load testing done
- [ ] Security audit done

### Post-Deploy:

- [ ] Smoke tests passed
- [ ] Admin panel accessible
- [ ] API endpoints working
- [ ] Telegram bots connected
- [ ] Email notifications working
- [ ] Monitoring alerts configured
- [ ] Team notified
- [ ] Documentation updated

---

**Последнее обновление:** 27 февраля 2026  
**Production URL:** (TBD)  
**Staging URL:** (TBD)
