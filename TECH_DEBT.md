# Tech Debt Audit

## socket.io / socket.io-client

- **Files where used:** `src/lib/websocket/server.ts`
- **Imported elsewhere in app:** No — file is never imported from any route, page, or API handler
- **Actually works on Vercel:** No — Vercel serverless functions don't support persistent WebSocket connections
- **Recommendation:** Safe to remove. Dead code — was scaffolded but never wired into the Next.js app. No routes or components reference it.

## bullmq

- **Files where used:** `src/workers/index.ts`
- **Imported elsewhere in app:** No — file is never imported from any route, page, or API handler
- **Worker runs on Vercel:** No — requires a persistent Node.js process + Redis connection. Vercel serverless cannot run long-lived workers.
- **Recommendation:** Safe to remove. Dead code — worker definitions exist but are never started or referenced by the app.

## ioredis

- **Files where used:** Transitive dependency of `src/workers/index.ts` (Redis connection config)
- **Imported elsewhere in app:** No
- **Recommendation:** Safe to remove along with bullmq.

## Summary

All three packages (`socket.io`, `socket.io-client`, `bullmq`, `ioredis`) are dead code:
- Files exist in `src/workers/` and `src/lib/websocket/` but are **never imported** by any page, API route, or component
- They add ~2.5 MB to `node_modules` and slow down installs
- None of them can function on Vercel's serverless architecture

**Action taken:**
- Packages uninstalled: `socket.io`, `socket.io-client`, `bullmq`, `ioredis` (removed 35 packages)
- Dead source files deleted: `src/workers/index.ts`, `src/lib/websocket/server.ts`
- If real-time/queue functionality is needed later, deploy on a dedicated server (Railway, Render, etc.)
