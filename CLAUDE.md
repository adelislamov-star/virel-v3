# CLAUDE.md — Virel V3

## Project

Next.js 14 app with Prisma + PostgreSQL (Supabase). Deployed on Vercel.

## Deploy Workflow

After every `git push origin main`:

```bash
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_bOjDo27XJ0kgKFxsbKXS2paWC6f5/6Kfab1ipLA"
```

Wait 3-4 minutes, then verify deploy status is Ready at:
https://vercel.com/adelislamov-stars-projects/virel-v3/deployments

This triggers a deploy from the Vercel account (not the git commit author), so it never gets blocked.

## Rules

- Push directly to `origin main` unless told otherwise
- Do not create feature branches unless explicitly asked
- Do not touch `BookingModalProvider.tsx`
- CSS classes `.bm-overlay`, `.bm-panel`, `.bm-close` must not be changed
