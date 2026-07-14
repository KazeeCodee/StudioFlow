# StudioFlow Production Readiness on Railway Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the identified correctness, security, testing, and operational blockers and release StudioFlow through Railway with Supabase staging and production environments.

**Architecture:** Run one persistent Next.js service on Railway using Supavisor session-mode PostgreSQL connectivity, plus Redis for distributed rate limits and a short-lived cron service. PostgreSQL constraints and transaction locks protect booking/quota integrity; GitHub Actions and a staging rehearsal gate production promotion.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle ORM, PostgreSQL/Supabase, Redis, Vitest, Playwright, GitHub Actions, Railway.

---

## Execution rules

- Work in an isolated `codex/production-readiness` worktree.
- Use @test-driven-development for application changes, @supabase for migrations/RLS/Storage, @security-best-practices for security tasks, and @verification-before-completion before declaring a gate green.
- Never run E2E against production. Never print secrets.
- Each task is a separate reviewed commit. Do not combine schema, dependency, and infrastructure changes in one commit.

### Task 1: Make local quality gates deterministic

**Files:**
- Modify: `eslint.config.mjs`
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Add/track: `.env.example`

**Steps:**

1. Add a regression assertion or config test proving `.worktrees/**` is excluded.
2. Add `.worktrees/**` to ESLint `globalIgnores` and Vitest `exclude`.
3. Change scripts to explicit roots: `eslint src scripts tests *.ts *.mjs` and `vitest run src` while retaining a separate integration command.
4. Add `!.env.example` after `.env*` in `.gitignore`; verify `git check-ignore -v .env.example` reports the negation.
5. Run `npm run lint` and `npm test`. Expected: both exit 0 without discovering tests inside `.worktrees`.
6. Commit: `chore: make release quality gates deterministic`.

### Task 2: Patch the production dependency tree

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**

1. Record `npm audit --omit=dev --json` as the failing baseline.
2. Read the installed Next.js upgrade notes in `node_modules/next/dist/docs/` before changing versions.
3. Upgrade `next`, `next-rspack`, and `eslint-config-next` together to the current patched compatible release (audit identified `16.2.10`).
4. Move `shadcn` from `dependencies` to `devDependencies`; update vulnerable transitive packages through normal lockfile resolution, never with `--force` blindly.
5. Run `npm ci`, `npm audit --omit=dev`, `npm run lint`, `npm test`, and `npm run build`.
6. Expected: zero high/critical production vulnerabilities and all checks exit 0.
7. Commit: `chore: patch production dependencies`.

### Task 3: Add database integrity constraints

**Files:**
- Create via CLI: `supabase/migrations/<generated>_booking_integrity_and_storage_hardening.sql`
- Modify: `src/lib/db/schema.ts`
- Test: `tests/integration/booking-constraints.test.ts`

**Steps:**

1. Run `supabase --version`, `supabase migration new booking_integrity_and_storage_hardening`, and the relevant `--help` commands; do not invent the migration filename.
2. Before altering production, run read-only preflight SQL in staging to find overlapping active bookings and invalid quotas. Expected: zero rows; otherwise stop and reconcile data.
3. Add `btree_gist` and an exclusion constraint equivalent to:

```sql
alter table public.bookings
  add constraint bookings_no_active_overlap
  exclude using gist (
    space_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'));

alter table public.bookings
  add constraint bookings_valid_window check (ends_at > starts_at);

alter table public.member_plans
  add constraint member_plans_valid_quota check (
    quota_total >= 0 and quota_used >= 0 and quota_remaining >= 0
    and quota_used + quota_remaining = quota_total
  );
```

4. Update Drizzle schema declarations so application types and migration state describe the same constraints.
5. Write integration tests that insert conflicting active bookings and invalid quota snapshots. Expected failure codes: exclusion/check violations.
6. Apply only to local/staging, run `supabase migration list`, then Supabase database/security advisors. Expected: no new errors.
7. Commit: `feat: enforce booking and quota integrity in postgres`.

### Task 4: Make booking creation atomic

**Files:**
- Create: `src/services/bookings/booking-transaction.ts`
- Modify: `src/services/bookings/create-booking.ts`
- Modify: `src/modules/bookings/queries.ts`
- Test: `src/services/bookings/create-booking.test.ts`
- Test: `tests/integration/booking-concurrency.test.ts`

**Steps:**

1. Write failing tests launching two simultaneous creates for the same space/time and for the last available quota. Expected: current code permits an invalid outcome.
2. Add transaction helpers that acquire `pg_advisory_xact_lock(hashtextextended(spaceId, 0))` and lock the active member-plan row `for update`.
3. Allow availability/query helpers to receive the transaction executor instead of always calling global `getDb()`.
4. Move the space, plan, settings, block, overlap, and quota reads inside one transaction after locks are acquired.
5. Use arithmetic SQL updates guarded by remaining quota rather than writing stale snapshots; require exactly one updated row.
6. Map exclusion/insufficient-quota failures to the existing Spanish domain messages.
7. Run focused unit and integration tests. Expected: exactly one overlapping request succeeds and quota remains consistent.
8. Commit: `fix: serialize booking creation and quota consumption`.

### Task 5: Make cancellation, rescheduling, renewal, and adjustments atomic

**Actualización 2026-07-14:** el alcance de renovaciones ya bloquea `member_plans` con
`FOR UPDATE`, compara `expectedNextPaymentDueAt`, persiste evidencia estructurada y evita
el doble procesamiento por datos desactualizados. La cancelación, reprogramación y los
ajustes de cupo continúan siendo tareas independientes de este punto y no se consideran
cerrados por el trabajo del panel de renovaciones.

**Files:**
- Modify: `src/services/bookings/cancel-booking.ts`
- Modify: `src/services/bookings/reschedule-booking.ts`
- Modify: `src/services/members/adjust-member-quota.ts`
- Modify: `src/services/renewals/renew-member-plan.ts`
- Modify: `src/services/bookings/booking-transaction.ts`
- Test: corresponding `*.test.ts` files
- Test: `tests/integration/booking-concurrency.test.ts`

**Steps:**

1. Add failing concurrent cancellation and rescheduling tests.
2. Lock the booking row before checking status; lock space before the reschedule overlap check; lock member plan before every quota mutation.
3. Make cancellation status update conditional on the previous active status. Refund only when that conditional update returns one row.
4. Recompute reschedule and quota values from rows re-read inside the transaction.
5. Apply the same row-lock rule to manual quota adjustments and renewals.
6. Run tests. Expected: one refund, no negative quota, no lost adjustment, and exclusion constraint remains satisfied.
7. Commit: `fix: make booking and quota transitions idempotent`.

### Task 6: Close redirect and canonical-origin vulnerabilities

**Files:**
- Create: `src/lib/safe-redirect.ts`
- Test: `src/lib/safe-redirect.test.ts`
- Modify: `src/app/(auth)/actions.ts`
- Modify: `src/modules/bookings/schema.ts`
- Modify: `src/modules/member-portal/schema.ts`
- Modify: `src/lib/env.ts`
- Modify: `src/lib/env.test.ts`

**Steps:**

1. Write tests rejecting absolute, protocol-relative, backslash, control-character, and non-allowlisted paths.
2. Implement `getSafeInternalPath(value, fallback)` that only accepts a parsed same-origin path beginning with one `/`.
3. Apply it to login `next`, booking redirects, and member-profile redirects.
4. In production require HTTPS `APP_URL`; remove Host/`x-forwarded-host` fallback for password-recovery URLs. Local development may retain `http://localhost`.
5. Add production-aware env validation for `CRON_SECRET`, `EMAIL_FROM`, `RESEND_API_KEY`, and `REDIS_URL` according to enabled features.
6. Run auth callback/action/env tests.
7. Commit: `fix: constrain redirects and production origins`.

### Task 7: Harden uploads and public Storage

**Files:**
- Modify generated migration from Task 3
- Modify: `src/services/spaces/resolve-space-image.ts`
- Modify: `src/services/spaces/resolve-space-image.test.ts`
- Modify: `src/components/forms/space-form.tsx`
- Modify: `README.md`

**Steps:**

1. Add failing tests rejecting SVG, mismatched MIME/extension, empty images, and oversized uploads.
2. Remove `image/svg+xml` from code and the Supabase bucket allowlist. Accept JPEG, PNG, GIF, and WebP only.
3. Inspect existing Storage objects for SVG before promotion; convert or remove them explicitly. Database backups do not restore deleted Storage objects, so export originals first.
4. Keep server-generated object paths and the 5 MB server-side limit.
5. Verify bucket configuration and upload/read/delete behavior in staging.
6. Commit: `fix: restrict public space image uploads`.

### Task 8: Apply CSP and baseline security headers

**Files:**
- Create: `src/lib/security-headers.ts`
- Test: `src/lib/security-headers.test.ts`
- Modify: `src/proxy.ts`
- Modify: `src/lib/supabase/proxy.ts`
- Modify: `next.config.ts`
- Test: `src/lib/supabase/proxy.test.ts`

**Steps:**

1. Write tests for CSP production/dev variants and for headers on public, admin, member, and redirect responses.
2. Generate a per-request nonce in `proxy.ts`; pass the CSP request header so Next.js applies it to framework scripts.
3. Extend the matcher to page routes while excluding `_next/static`, `_next/image`, favicon, and prefetch requests. Keep authorization in layouts/actions.
4. Configure CSP for self, Supabase API/images, and the current YouTube embed; keep `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`.
5. Add `X-Content-Type-Options: nosniff`, `Referrer-Policy`, a minimal `Permissions-Policy`, and `X-Frame-Options: DENY`. Do not add HSTS in this task.
6. Start CSP as `Report-Only` in staging, fix violations, then enforce before production.
7. Verify with Playwright response headers and browser console.
8. Commit: `feat: enforce application security headers`.

### Task 9: Add distributed rate limits

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/request-identity.ts`
- Test: `src/lib/rate-limit.test.ts`
- Modify: `src/app/(auth)/actions.ts`
- Modify: `src/modules/settings/actions.ts`
- Modify: `src/modules/spaces/actions.ts`
- Modify: `.env.example`

**Steps:**

1. Provision Redis in Railway staging and add the maintained `redis` client package.
2. Write tests for allowed, exceeded, expiry, and Redis-unavailable behavior using an injected fake store.
3. Implement an atomic fixed/sliding-window counter with expiry. Keys must hash identifiers and contain no raw email/password.
4. Apply limits to login and recovery by trusted proxy IP plus normalized email; apply authenticated limits to test-email and upload actions.
5. Fail closed for anonymous auth/email endpoints when Redis is unavailable and emit a safe operational log.
6. Verify limits from two application processes against the same Redis service.
7. Commit: `feat: add distributed abuse protection`.

### Task 10: Add health, startup validation, and structured logging

**Files:**
- Create: `src/app/api/health/live/route.ts`
- Create: `src/app/api/health/ready/route.ts`
- Create: `src/lib/logger.ts`
- Create: `src/instrumentation.ts`
- Test: corresponding `*.test.ts` files
- Modify: `src/lib/email/transport.ts`
- Modify: `src/services/notifications/dispatcher.ts`

**Steps:**

1. Add liveness and readiness tests, including database timeout/failure.
2. Make liveness dependency-free. Make readiness execute bounded `select 1`; return 503 without internals on failure.
3. Validate production env once at Node startup through `instrumentation.ts`.
4. Replace free-form production console output with JSON logger calls and redact credentials, cookies, authorization, email bodies, and provider response bodies.
5. Make production email configuration fail at startup or action invocation instead of silently returning `skipped` for missing configuration.
6. Run tests and manually curl both health endpoints.
7. Commit: `feat: add production health and operational logging`.

### Task 11: Finalize Railway web and cron services

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `nixpacks.toml`
- Create: `scripts/run-notifications-cron.mjs`
- Test: `src/app/api/cron/notifications/route.test.ts`
- Modify: `README.md`
- Remove: `vercel.json` after Railway staging is verified

**Steps:**

1. Enable `output: 'standalone'`; change production start to `node .next/standalone/server.js` and ensure static/public assets are copied by the build/deploy setup.
2. Keep one web replica and set Railway healthcheck to `/api/health/ready` with a 300-second deployment timeout.
3. Configure runtime `DATABASE_URL` as Supavisor session mode, SSL enabled, and a conservative `DATABASE_POOL_MAX` (start at 5 and validate against Supabase connection limits).
4. Create a cron script that calls `/api/cron/notifications` with `CRON_SECRET`, uses three bounded retries, rejects non-2xx responses, logs a summary, and exits.
5. Configure the Railway cron service for `0 12 * * *` UTC and verify it terminates; Railway skips future runs if the prior process remains active.
6. Remove Vercel deployment config only after Railway parity is confirmed.
7. Commit: `chore: configure Railway production services`.

### Task 12: Isolate integration/E2E environments

**Files:**
- Modify: `tests/e2e/support/studioflow-testkit.ts`
- Modify: `playwright.config.ts`
- Create: `.env.e2e.example`
- Modify: `.gitignore`
- Modify: `README.md`

**Steps:**

1. Change E2E loading from `.env.local` to `.env.e2e.local`.
2. Require `E2E_ALLOW_MUTATIONS=true` and an expected staging project reference; abort if URL/ref equals production.
3. Ensure cleanup runs in `finally`/fixtures even after assertion failures and closes SQL clients.
4. Run unit/integration tests locally, then the full Playwright suite against staging.
5. Expected: no production access, all created records/users removed, test process exits cleanly.
6. Commit: `test: isolate database-backed release suites`.

### Task 13: Add CI and release gates

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/staging-e2e.yml`
- Modify: `vitest.config.ts`
- Modify: `README.md`

**Steps:**

1. Add CI jobs for `npm ci`, `npm audit --omit=dev`, lint, unit/integration, coverage, and production build using Node 20.
2. Record corrected coverage, then set non-regressing thresholds for lines/functions/branches/statements. Raise them in later changes; do not invent an arbitrary high number that blocks the first fix.
3. Add staging E2E using GitHub Environment secrets and concurrency cancellation so two suites cannot mutate staging simultaneously.
4. Protect `master`: require CI and staging E2E, forbid direct pushes, require review.
5. Keep production deployment manual until the first two successful releases; Railway autodeploy must not bypass GitHub checks.
6. Commit: `ci: enforce production release gates`.

### Task 14: Configure Supabase production controls

**Files:**
- Create: `docs/runbooks/supabase-production.md`
- Create: `docs/runbooks/backup-restore.md`
- Modify: `README.md`

**Steps:**

1. Create separate staging/production projects; apply migrations to staging through the Supabase CLI and verify `migration list`.
2. Run database and security advisors; resolve every error and document accepted warnings.
3. Verify RLS on every exposed table, service-role secrecy, Auth redirect allowlist, password policy, email rate limits, CAPTCHA decision, JWT lifetime, and session revocation procedure.
4. Use Supabase Pro daily backups as minimum. Schedule encrypted logical exports off-site and a separate Storage export; document retention.
5. Perform a restore rehearsal into a disposable project and record RPO/RTO. Do not claim backups work until restoration is demonstrated.
6. Rotate production database, service-role, Redis, cron, and email secrets after the rehearsal.
7. Commit: `docs: add Supabase production and recovery runbooks`.

### Task 15: Staging rehearsal, go-live, and rollback

**Files:**
- Create: `docs/runbooks/railway-release.md`
- Create: `docs/runbooks/incident-response.md`
- Create: `docs/checklists/production-go-live.md`

**Steps:**

1. Deploy the additive database migration to staging, then the application. Run smoke, concurrency, E2E, CSP/header, rate-limit, cron, email, and health checks.
2. Run `npm ci`, audit, lint, unit/integration, coverage, E2E, and build from a clean checkout. Attach outputs to the release record.
3. Load-test the booking and login paths conservatively; confirm DB connections, memory, CPU, error rate, and latency remain within agreed limits.
4. Verify external uptime monitoring and alerts reach a real operator.
5. Take/export backups, freeze schema changes, approve go/no-go, apply production migration, deploy Railway, and perform member/admin smoke tests.
6. Rollback trigger: integrity error, auth failure, elevated 5xx, broken cron/email, or failed readiness. Roll back the Railway deployment first; never reverse a data migration blindly.
7. Observe closely for 24 hours and review notification failures, audit logs, DB connections, Redis health, and security events.
8. Commit: `docs: add production release and incident runbooks`.

## Final go/no-go gate

Production is **NO-GO** unless every item below is evidenced:

- Zero high/critical production dependency advisories.
- Concurrent overlap and double-refund tests pass against staging PostgreSQL.
- Supabase migration list/advisors are clean or explicitly accepted.
- Lint, unit/integration, coverage, E2E, and build pass from a clean checkout.
- CSP and security headers are enforced over HTTPS without browser violations.
- Redis limits work across processes and fail safely.
- Railway readiness, cron termination/retry, real email delivery, and alerts are verified.
- Database and Storage restoration has been rehearsed.
- Production secrets, domain, Auth redirects, backups, rollback owner, and incident contacts are documented.

