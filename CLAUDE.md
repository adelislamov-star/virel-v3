# CLAUDE.md — Vaurel V3

## Project
Next.js 14 + Prisma + PostgreSQL (Supabase). Deployed on Vercel via Deploy Hook.

## How Deploy Works
A git post-commit hook at `.git/hooks/post-commit` automatically:
1. Pushes to `origin main`
2. Triggers the Vercel deploy hook

So after every `git commit` on main — deploy happens automatically.
You do NOT need to manually push or trigger the hook.

Verify deploy at: https://vercel.com/adelislamov-stars-projects/virel-v3/deployments
(Look for "Ready" status — takes ~3 min)

## DATABASE_URL in Local Dev
The `.env` file is NOT available in worktrees or fresh clones.
This is EXPECTED and NORMAL.

- `DATABASE_URL missing` errors in dev server = expected, not a bug
- Do NOT try to fix DATABASE_URL errors
- Do NOT stop or delay commits because of DATABASE_URL errors
- The code runs correctly on Vercel where DATABASE_URL is set
- Just commit — the hook handles the rest

## Git Rules
- ALWAYS work from `C:\Virel` (main worktree), NOT from `.claude/worktrees/`
- Before starting any task: `cd C:\Virel && git checkout main && git pull origin main`
- ALWAYS commit directly to `main` branch
- NEVER create feature branches unless explicitly asked by the user
- If push is rejected: `git pull origin main --rebase` then commit again (hook will push)

## Task Completion — Required Steps
1. Make code changes in `C:\Virel`
2. `git add -A`
3. `git commit -m "type: description"` ← hook auto-pushes and deploys
4. Confirm: "COMMITTED: [sha] — deploy triggered automatically"

That's it. No manual push. No manual curl. The hook does it.

## Protected Files
- Do NOT touch `BookingModalProvider.tsx`
- Do NOT change CSS classes `.bm-overlay`, `.bm-panel`, `.bm-close`
