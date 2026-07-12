# StudioFlow Production Readiness on Railway — Design

**Date:** 2026-07-12

## Objective

Make StudioFlow safe and operable for its first commercial production release, using Railway for the persistent Next.js runtime and Supabase for Auth, PostgreSQL, and Storage.

## Selected architecture

- One Railway web service running the Next.js production server.
- One Railway Redis service used only for distributed rate limits.
- One Railway cron service that invokes the protected notification endpoint, retries transient failures, and exits.
- Separate Supabase projects for staging and production.
- Supavisor session-mode connection string for application traffic from Railway. Keep a separate migration connection secret.
- GitHub Actions as the mandatory quality gate. Production migration and deployment require manual approval.
- One web replica for the first release. Horizontal scaling is deferred until shared Next.js cache and Server Action encryption-key requirements are addressed.

## Data-integrity design

PostgreSQL, not the UI, is the final integrity boundary.

1. Add an exclusion constraint that prevents actual time overlap for active bookings in the same space.
2. Serialize availability decisions with a transaction-scoped advisory lock per space. This preserves the configurable booking buffer, which cannot be represented by a static exclusion constraint.
3. Lock the booking and member-plan rows before cancel/reschedule/quota mutations.
4. Re-read availability and quota inside the same transaction that performs the write.
5. Add database checks for valid booking windows and non-negative, internally consistent quota values.
6. Map constraint/concurrency failures to stable domain errors rather than exposing database errors.

All schema work is created with `supabase migration new`, exercised in staging, checked with Supabase advisors, and only then promoted.

## Application-security design

- Validate every redirect target as a same-origin relative path.
- Require canonical `APP_URL` and operational secrets in production; never build recovery URLs from untrusted host headers in production.
- Expand `proxy.ts` to apply a nonce-based CSP and baseline security headers to page responses while retaining server-side authorization inside layouts/actions.
- Permit only the origins actually used: the Supabase project for API/images and YouTube for the existing video embed.
- Remove SVG from uploads and from the public bucket MIME allowlist.
- Rate-limit login and password recovery by IP plus normalized account key. Rate-limit email-test and upload actions by authenticated profile. Redis failures fail closed for anonymous auth/email endpoints.
- Keep Supabase service-role access server-only.

## Reliability and operations

- `/api/health/live` reports process liveness without dependencies.
- `/api/health/ready` performs a bounded `select 1` and is Railway's deployment healthcheck.
- Structured JSON logs include event, severity, request/correlation ID, and safe metadata; secrets, cookies, credentials, and email bodies are never logged.
- Production email configuration is mandatory when notifications are enabled; a missing provider cannot silently degrade to log mode.
- Cron has bounded retries and idempotent delivery keys. Failures are visible in logs and `notification_deliveries`.
- Supabase Pro daily backups are the minimum production baseline. Storage objects need a separate export/retention procedure because database backups do not restore deleted Storage objects.
- External uptime monitoring checks liveness and the login page continuously; Railway healthchecks alone only protect deployments.

## Test and release strategy

- Exclude `.worktrees/**` from Vitest and ESLint discovery.
- Establish coverage thresholds only after recording the corrected baseline; the release floor cannot decrease.
- Use a dedicated staging Supabase project and `.env.e2e.local`. E2E refuses to run without an explicit mutation opt-in and matching staging project reference.
- Add database-backed concurrency tests proving that exactly one simultaneous overlapping booking succeeds and that concurrent cancellation refunds once.
- CI runs install, audit, lint, unit/integration tests, coverage, build, and E2E against staging.
- Production promotion uses a go/no-go checklist and a documented rollback: stop traffic, roll back the Railway deployment, and only reverse a migration when its down migration is explicitly proven safe.

## Deliberate exclusions for the first release

- Multiple Railway replicas.
- Redis-backed Next.js shared cache.
- A general background-job queue.
- PITR unless the business accepts its additional cost; daily backups plus tested logical exports are the initial baseline.
- Experimental Next.js SRI/CSP features.

## Success criteria

- No known high/critical production dependency vulnerabilities.
- Database rejects overlapping active bookings even under concurrent requests.
- Quota cannot be double-consumed or double-refunded.
- All redirects are internal and production recovery links use the canonical origin.
- Security headers are verified over HTTPS in staging.
- CI and isolated E2E are green and reproducible.
- Backup restore, cron delivery, healthcheck, rollback, and secret rotation procedures are tested before launch.

