# Vercel Environment Variables — нужно добавить вручную

## DIRECT_URL (для Prisma migrations)

Значение: прямой URL из Neon dashboard (НЕ pooler)

Формат:
```
postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Где взять: Neon Dashboard → Project → Connection Details → переключить на "Direct connection"

## DATABASE_URL (уже есть, проверить параметры)

Должен быть pooler URL с параметрами:
```
?pgbouncer=true&connect_timeout=15&sslmode=require
```

## Как добавить

Vercel Dashboard → Settings → Environment Variables → добавить `DIRECT_URL`
