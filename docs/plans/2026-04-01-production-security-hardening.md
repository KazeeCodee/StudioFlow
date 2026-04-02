# Production Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Endurecer permisos de producción separando administración de operación diaria, y agregar RLS/grants reales en Supabase para aislar `member` de `staff` a nivel base de datos.

**Architecture:** Vamos a aplicar una estrategia en dos capas. Primero endurecemos la matriz de permisos de la app para que `operator` quede limitado a operación diaria y no a configuración o CRUD sensible. Después agregamos una migración SQL con helpers privados, `ENABLE ROW LEVEL SECURITY`, grants y políticas por ownership/rol en las tablas públicas expuestas por Supabase. La app seguirá usando parte del acceso server-side por Drizzle, así que este bloque cierra la superficie de API/Data Access y deja lista la base para una segunda pasada de runtime identity si hiciera falta.

**Tech Stack:** Next.js App Router, React 19, Vitest, Drizzle ORM, Supabase Auth, Supabase Postgres.

---

### Task 1: Documentar la matriz objetivo

**Files:**
- Create: `docs/plans/2026-04-01-production-security-hardening.md`
- Modify: `src/lib/permissions/guards.ts`
- Test: `src/lib/permissions/guards.test.ts`

**Step 1: Escribir el test fallando para operator**

Agregar expectativas para que `operator` no pueda gestionar `members`, `plans`, `spaces`, `settings` ni `renewals`, pero sí `bookings`.

**Step 2: Ejecutar el test y confirmar falla**

Run: `npm test -- src/lib/permissions/guards.test.ts`
Expected: FAIL porque la matriz actual deja a `operator` gestionar demasiado.

**Step 3: Implementar la matriz mínima**

Actualizar los guards para que:
- `canManageBookings(operator) === true`
- `canManageMembers(operator) === false`
- `canManagePlans(operator) === false`
- `canManageSpaces(operator) === false`
- `canManageSettings(operator) === false`
- `canRenewPlans(operator) === false`

**Step 4: Ejecutar el test y confirmar green**

Run: `npm test -- src/lib/permissions/guards.test.ts`
Expected: PASS

### Task 2: Restringir navegación y páginas sensibles

**Files:**
- Modify: `src/components/layout/sidebar-nav.tsx`
- Modify: `src/app/admin/members/page.tsx`
- Modify: `src/app/admin/members/[memberId]/page.tsx`
- Modify: `src/app/admin/plans/page.tsx`
- Modify: `src/app/admin/plans/[planId]/page.tsx`
- Modify: `src/app/admin/spaces/page.tsx`
- Modify: `src/app/admin/spaces/[spaceId]/page.tsx`
- Modify: `src/app/admin/renewals/page.tsx`

**Step 1: Escribir el test fallando de navegación si aplica**

Si hay cobertura razonable, agregar test de `SidebarNav` para validar que `operator` no vea secciones restringidas.

**Step 2: Ejecutar test y confirmar red**

Run: `npm test -- src/components/layout/sidebar-nav.test.tsx`
Expected: FAIL si se agrega cobertura nueva.

**Step 3: Implementar restricción mínima**

Filtrar navegación y agregar redirects server-side en páginas sensibles usando los guards correctos.

**Step 4: Ejecutar tests afectados**

Run: `npm test -- src/components/layout/sidebar-nav.test.tsx`
Expected: PASS

### Task 3: Agregar helpers SQL privados para políticas

**Files:**
- Create: `supabase/migrations/0002_*_production_security_hardening.sql`

**Step 1: Escribir helper functions privadas**

Crear funciones en schema privado para:
- resolver el rol actual desde `profiles`
- detectar `is_admin`, `is_staff`
- validar ownership de `profiles`, `members`, `member_plans`, `bookings`

**Step 2: Habilitar RLS**

Aplicar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sobre tablas públicas relevantes.

**Step 3: Definir grants/policies mínimos**

Políticas orientativas:
- `profiles`: propio perfil o staff; update propio perfil, con grants de columnas no sensibles para `authenticated`
- `members`, `member_plans`, `bookings`: ownership para member y acceso de staff
- `plans`, `spaces`, `space_availability_rules`: lectura para authenticated; mutación sólo staff/admin según corresponda
- `space_blocks`, `system_settings`, `audit_logs`, `notification_deliveries`, `renewals`, `booking_status_history`: sin acceso de member; lectura/escritura de staff según necesidad

**Step 4: Dejar notas de limitación**

Documentar en comentarios SQL que las conexiones server-side privilegiadas no pasan por RLS automáticamente.

### Task 4: Verificación

**Files:**
- Modify: ninguno adicional salvo ajustes menores

**Step 1: Ejecutar test unitario de permisos**

Run: `npm test -- src/lib/permissions/guards.test.ts`

**Step 2: Ejecutar tests de navegación si existen**

Run: `npm test -- src/components/layout/sidebar-nav.test.tsx`

**Step 3: Ejecutar verificación general**

Run:
- `npm run lint`
- `npm run build`

Expected: todo green, sin romper flujos actuales de staff/admin/member.
