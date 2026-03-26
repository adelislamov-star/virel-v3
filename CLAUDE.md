# CLAUDE.md — Vaurel V3

## Project
Next.js 14 + Prisma + PostgreSQL (Neon). Deployed on Vercel.

## Deploy Workflow
After every task:
1. git add src/path/to/changed-file.tsx (only specific files you changed)
2. git commit -m "type: description"
3. git push origin main
4. Report: "PUSHED: [sha]"

User opens this URL in browser to deploy:
https://api.vercel.com/v1/integrations/deploy/prj_bOjDo27XJ0kgKFxsbKXS2paWC6f5/6Kfab1ipLA

## CRITICAL — git add
- NEVER use git add -A or git add .
- Always run git status first
- Add only files you actually changed

## DATABASE_URL
- Missing DATABASE_URL in dev = expected, not a bug
- Do NOT fix it, just push

## Git Rules
- Always work from C:\Virel
- Before task: cd C:\Virel && git checkout main && git pull origin main
- Always commit to main, never feature branches

## Protected Files
- Do NOT touch BookingModalProvider.tsx
- Do NOT change .bm-overlay, .bm-panel, .bm-close
