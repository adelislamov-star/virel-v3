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

## Email (Resend) — нужно добавить в Vercel когда будет готово

`RESEND_API_KEY` — получить на https://resend.com после регистрации
`EMAIL_FROM` — адрес отправителя (нужно верифицировать домен virel.com в Resend)

Шаги для активации:
1. Зарегистрироваться на https://resend.com
2. Settings → Domains → Add Domain → virel.com
3. Добавить DNS записи которые покажет Resend
4. Скопировать API Key → добавить в Vercel как `RESEND_API_KEY`
5. Добавить `EMAIL_FROM=bookings@virel.com` в Vercel
