---
Task ID: 8
Agent: Main Agent
Task: Migrate from SQLite to Supabase PostgreSQL

Work Log:
- Updated prisma schema datasource to postgresql (then reverted for local dev)
- Rewrote src/lib/db.ts for production-ready PrismaClient singleton
- Deleted src/lib/db-init.ts (no longer needed)
- Converted all raw SQL queries to Prisma ORM in API routes
- Found port 5432 blocked in sandbox, switched to Supabase REST API approach
- Installed @supabase/supabase-js
- Created src/lib/supabase.ts with Supabase client (service_role key)
- Rewrote all 11 API route files to use Supabase REST API
- Created src/lib/case-converter.ts for camelCase↔snake_case conversion
- Generated SQL for 7 tables and user executed in Supabase SQL Editor
- Verified: all API routes return 200, data persists in Supabase

Stage Summary:
- Database fully migrated to Supabase PostgreSQL
- All API routes use Supabase REST API (HTTPS, no port 5432 needed)
- 7 tables created: Customer, Paper, PrintingCost, Finishing, Setting, RiwayatPotongKertas, RiwayatHitungCetakan
- Setting profit default = 10%
- Preview confirmed working by user

---
Task ID: 10
Agent: Full-stack Developer
Task: Remove Prisma dependency and fix deployment

Work Log:
- Removed `output: "standalone"` from next.config.ts
- Removed `postinstall`, `db:push`, `db:generate`, `db:migrate`, `db:reset` scripts from package.json
- Simplified `build` script to just `next build` and `start` to `next start`
- Rewrote src/app/api/pengguna/route.ts to use Supabase client (all CRUD operations)
- Rewrote src/app/api/register/route.ts to use Supabase client
- Deleted src/lib/db.ts (Prisma client singleton)
- src/lib/db-init.ts was already deleted in previous task
- Removed `prisma` and `@prisma/client` packages via bun remove
- Deleted entire prisma/ directory including schema.prisma
- Verified: no remaining imports of @/lib/db or @prisma/client in src/
- Verified: `npx tsc --noEmit` passes with 0 errors
- Verified: `bun run lint` passes with only 1 pre-existing warning
- Verified: `NODE_ENV=production npx next build` succeeds

Stage Summary:
- Project no longer depends on Prisma at all
- All data access through Supabase REST API
- Build size significantly reduced (removed ~132MB of Prisma node_modules)
- Deployment should work without DATABASE_URL env var
- No more standalone output or postinstall scripts blocking deployment
