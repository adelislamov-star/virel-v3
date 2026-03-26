\# CLAUDE.md — Vaurel V3



\## Project

Next.js 14 + Prisma + PostgreSQL (Neon). Deployed on Vercel.



\## Deploy Workflow

After every task:

1\. Run git status — check what changed

2\. git add only the files you changed (never git add -A or git add .)

3\. git commit -m "type: description"

4\. git push origin main

5\. Report: "PUSHED: \[sha]"



User triggers deploy manually in browser:

https://api.vercel.com/v1/integrations/deploy/prj\_bOjDo27XJ0kgKFxsbKXS2paWC6f5/6Kfab1ipLA



\## CRITICAL — git add rules

\- NEVER use git add -A

\- NEVER use git add .

\- Always add only specific files: git add src/path/to/file.tsx

\- Always run git status before committing



\## DATABASE\_URL in Local Dev

\- Missing DATABASE\_URL = expected, not a bug

\- Do NOT try to fix it

\- Just commit and push



\## Git Rules

\- Always work from C:\\Virel (main worktree)

\- Before every task: cd C:\\Virel \&\& git checkout main \&\& git pull origin main

\- Always commit to main branch directly

\- Never create feature branches unless explicitly asked



\## Protected Files

\- Do NOT touch BookingModalProvider.tsx

\- Do NOT change .bm-overlay, .bm-panel, .bm-close

