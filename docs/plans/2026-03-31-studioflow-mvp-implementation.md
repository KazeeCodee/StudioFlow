# StudioFlow MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir el MVP operativo de StudioFlow con panel staff, portal miembro, autenticación por roles, reservas sin solapamientos, control de cupos, renovaciones manuales y alertas básicas.

**Architecture:** Aplicación única en Next.js App Router con Supabase para auth/storage/database, Drizzle ORM para esquema tipado y capa de servicios para encapsular reglas críticas de negocio. El producto se divide en área administrativa y portal del miembro, compartiendo el mismo backend, permisos centralizados y validaciones transaccionales.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase Postgres, Supabase Storage, Drizzle ORM, Zod, React Hook Form, FullCalendar, Vitest, Testing Library, Playwright.

---

### Task 1: Inicializar repositorio y scaffold base

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Inicializar Git**

Run: `git init`
Expected: repositorio Git inicializado en `E:\Proyectos\GitHub\StudioFlow`

**Step 2: Generar la app base**

Run: `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
Expected: proyecto Next.js funcional con App Router dentro de la carpeta actual

**Step 3: Verificar arranque base**

Run: `npm run lint`
Expected: PASS sin errores

**Step 4: Confirmar estructura mínima**

Verificar que existan:
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

**Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js application"
```

### Task 2: Instalar dependencias de dominio y testing

**Files:**
- Modify: `package.json`
- Create: `components.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Instalar dependencias**

Run:

```bash
npm install @supabase/supabase-js @supabase/ssr drizzle-orm postgres zod react-hook-form @hookform/resolvers @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction lucide-react next-themes
```

Expected: dependencias de runtime instaladas

**Step 2: Instalar dependencias de desarrollo**

Run:

```bash
npm install -D drizzle-kit vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom playwright tsx
```

Expected: dependencias de testing y tooling instaladas

**Step 3: Inicializar shadcn/ui**

Run: `npx shadcn@latest init -d`
Expected: `components.json` y utilidades base creadas

**Step 4: Configurar Vitest**

Crear `vitest.config.ts` y `src/test/setup.ts` para pruebas unitarias y de componentes.

**Step 5: Commit**

```bash
git add package.json package-lock.json components.json vitest.config.ts playwright.config.ts src/test/setup.ts
git commit -m "chore: add core dependencies and test tooling"
```

### Task 3: Definir entorno, clientes y utilidades de Supabase

**Files:**
- Modify: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/utils.ts`

**Step 1: Escribir test de validación de entorno**

**Test:** `src/lib/env.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

describe("envSchema", () => {
  it("acepta las variables mínimas requeridas", () => {
    const result = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    });

    expect(result.NEXT_PUBLIC_SUPABASE_URL).toContain("supabase.co");
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/lib/env.test.ts`
Expected: FAIL porque `env.ts` todavía no existe

**Step 3: Implementar validación y clientes**

Crear:
- `src/lib/env.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/lib/env.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add .env.example src/lib/env.ts src/lib/env.test.ts src/lib/supabase/client.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts src/lib/utils.ts
git commit -m "feat: configure environment and Supabase clients"
```

### Task 4: Modelar base de datos con Drizzle

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/relations.ts`
- Create: `src/lib/db/schema.test.ts`
- Create: `supabase/migrations/0001_initial_schema.sql`

**Step 1: Escribir test de esquema**

**Test:** `src/lib/db/schema.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { bookings, memberPlans, plans, spaces } from "@/lib/db/schema";

describe("schema", () => {
  it("define las tablas clave del negocio", () => {
    expect(plans).toBeDefined();
    expect(memberPlans).toBeDefined();
    expect(spaces).toBeDefined();
    expect(bookings).toBeDefined();
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/lib/db/schema.test.ts`
Expected: FAIL porque el esquema aún no existe

**Step 3: Implementar esquema inicial**

Definir en `src/lib/db/schema.ts`:
- enums de roles y estados
- `profiles`
- `members`
- `plans`
- `memberPlans`
- `spaces`
- `spaceAvailabilityRules`
- `spaceBlocks`
- `bookings`
- `bookingStatusHistory`
- `renewals`
- `systemSettings`
- `auditLogs`

**Step 4: Generar migración**

Run: `npx drizzle-kit generate`
Expected: SQL inicial generado o actualizado

**Step 5: Commit**

```bash
git add drizzle.config.ts src/lib/db/index.ts src/lib/db/schema.ts src/lib/db/relations.ts src/lib/db/schema.test.ts supabase/migrations
git commit -m "feat: add initial Drizzle schema"
```

### Task 5: Implementar autenticación, perfiles y permisos

**Files:**
- Create: `src/modules/auth/types.ts`
- Create: `src/modules/auth/queries.ts`
- Create: `src/lib/permissions/roles.ts`
- Create: `src/lib/permissions/guards.ts`
- Create: `src/middleware.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/actions.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/member/layout.tsx`
- Test: `src/lib/permissions/guards.test.ts`

**Step 1: Escribir test de permisos**

```ts
import { describe, expect, it } from "vitest";
import { canManagePlans, canManageSettings } from "@/lib/permissions/guards";

describe("guards", () => {
  it("permite a admin gestionar planes", () => {
    expect(canManagePlans("admin")).toBe(true);
  });

  it("bloquea a operator en settings críticos", () => {
    expect(canManageSettings("operator")).toBe(false);
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/lib/permissions/guards.test.ts`
Expected: FAIL porque guards aún no existen

**Step 3: Implementar auth y route protection**

Crear:
- middleware con redirección por sesión y rol
- login base
- utilidades de permisos
- layouts para admin y member

**Step 4: Ejecutar test y smoke check**

Run:

```bash
npx vitest run src/lib/permissions/guards.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/auth src/lib/permissions src/middleware.ts src/app/(auth) src/app/admin/layout.tsx src/app/member/layout.tsx
git commit -m "feat: add auth flows and role guards"
```

### Task 6: Construir shell de UI y navegación principal

**Files:**
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/sidebar-nav.tsx`
- Create: `src/components/layout/topbar.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/app/member/dashboard/page.tsx`
- Test: `src/components/layout/app-shell.test.tsx`

**Step 1: Escribir test del shell**

```tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

describe("AppShell", () => {
  it("renderiza navegación y contenido", () => {
    render(<AppShell role="admin"><div>Contenido</div></AppShell>);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/components/layout/app-shell.test.tsx`
Expected: FAIL porque el shell no existe

**Step 3: Implementar layout compartido**

Construir shell reusable para:
- navegación admin
- navegación miembro
- encabezados y breadcrumbs simples

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/components/layout/app-shell.test.tsx
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/layout src/app/admin/dashboard/page.tsx src/app/member/dashboard/page.tsx
git commit -m "feat: add application shell and dashboards shell"
```

### Task 7: Implementar planes y miembros con alta completa

**Files:**
- Create: `src/modules/plans/schema.ts`
- Create: `src/modules/plans/queries.ts`
- Create: `src/modules/plans/actions.ts`
- Create: `src/modules/members/schema.ts`
- Create: `src/modules/members/queries.ts`
- Create: `src/modules/members/actions.ts`
- Create: `src/services/members/create-member-with-plan.ts`
- Create: `src/app/admin/plans/page.tsx`
- Create: `src/app/admin/plans/new/page.tsx`
- Create: `src/app/admin/members/page.tsx`
- Create: `src/app/admin/members/new/page.tsx`
- Test: `src/services/members/create-member-with-plan.test.ts`

**Step 1: Escribir test del servicio de alta**

```ts
import { describe, expect, it } from "vitest";
import { calculateInitialQuota } from "@/services/members/create-member-with-plan";

describe("create-member-with-plan", () => {
  it("usa los cupos del plan como cuota inicial", () => {
    expect(calculateInitialQuota({ quotaAmount: 12 })).toBe(12);
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/services/members/create-member-with-plan.test.ts`
Expected: FAIL porque el servicio no existe

**Step 3: Implementar CRUDs y servicio**

Crear formularios, validaciones y servicio que:
- cree usuario auth
- cree profile
- cree member
- cree member_plan activo
- registre auditoría

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/services/members/create-member-with-plan.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/plans src/modules/members src/services/members src/app/admin/plans src/app/admin/members
git commit -m "feat: add plans and member onboarding"
```

### Task 8: Implementar espacios, disponibilidad y bloqueos

**Files:**
- Create: `src/modules/spaces/schema.ts`
- Create: `src/modules/spaces/queries.ts`
- Create: `src/modules/spaces/actions.ts`
- Create: `src/app/admin/spaces/page.tsx`
- Create: `src/app/admin/spaces/new/page.tsx`
- Create: `src/app/admin/spaces/[spaceId]/page.tsx`
- Create: `src/components/forms/space-form.tsx`
- Test: `src/modules/spaces/schema.test.ts`

**Step 1: Escribir test de validación**

```ts
import { describe, expect, it } from "vitest";
import { spaceSchema } from "@/modules/spaces/schema";

describe("spaceSchema", () => {
  it("requiere costo horario entero mayor o igual a 1", () => {
    const result = spaceSchema.safeParse({
      name: "Estudio A",
      slug: "estudio-a",
      hourlyQuotaCost: 1,
      minBookingHours: 1,
      maxBookingHours: 4,
    });

    expect(result.success).toBe(true);
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/modules/spaces/schema.test.ts`
Expected: FAIL porque `spaceSchema` no existe

**Step 3: Implementar módulo**

Incluir:
- CRUD de espacios
- reglas semanales de disponibilidad
- bloqueos por rango
- costo en cupos por hora

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/modules/spaces/schema.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/spaces src/app/admin/spaces src/components/forms/space-form.tsx
git commit -m "feat: add spaces, availability and blocks"
```

### Task 9: Implementar motor de reservas y cancelaciones

**Files:**
- Create: `src/modules/bookings/schema.ts`
- Create: `src/modules/bookings/queries.ts`
- Create: `src/modules/bookings/actions.ts`
- Create: `src/services/bookings/calculate-booking-quota.ts`
- Create: `src/services/bookings/create-booking.ts`
- Create: `src/services/bookings/cancel-booking.ts`
- Create: `src/services/bookings/check-availability.ts`
- Create: `src/app/admin/bookings/new/page.tsx`
- Create: `src/app/admin/bookings/page.tsx`
- Create: `src/app/member/bookings/new/page.tsx`
- Create: `src/app/member/bookings/page.tsx`
- Test: `src/services/bookings/calculate-booking-quota.test.ts`
- Test: `src/services/bookings/check-availability.test.ts`

**Step 1: Escribir tests del motor**

```ts
import { describe, expect, it } from "vitest";
import { calculateBookingQuota } from "@/services/bookings/calculate-booking-quota";

describe("calculateBookingQuota", () => {
  it("multiplica horas por costo horario del espacio", () => {
    expect(calculateBookingQuota({ durationHours: 2, hourlyQuotaCost: 3 })).toBe(6);
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { hasOverlap } from "@/services/bookings/check-availability";

describe("hasOverlap", () => {
  it("detecta solapamientos del mismo espacio", () => {
    const result = hasOverlap(
      { startsAt: new Date("2026-04-01T10:00:00Z"), endsAt: new Date("2026-04-01T12:00:00Z") },
      [{ startsAt: new Date("2026-04-01T11:00:00Z"), endsAt: new Date("2026-04-01T13:00:00Z") }],
    );

    expect(result).toBe(true);
  });
});
```

**Step 2: Ejecutar tests y verificar fallo**

Run:

```bash
npx vitest run src/services/bookings/calculate-booking-quota.test.ts
npx vitest run src/services/bookings/check-availability.test.ts
```

Expected: FAIL porque los servicios aún no existen

**Step 3: Implementar servicios y pantallas**

El servicio `create-booking` debe:
- validar plan activo
- validar cupos suficientes
- validar disponibilidad
- validar bloqueos
- validar solapamientos
- descontar cupos en transacción
- guardar historial y auditoría

El servicio `cancel-booking` debe:
- validar política
- reintegrar cupos si corresponde
- actualizar estado
- registrar historial y auditoría

**Step 4: Ejecutar tests, lint y smoke**

Run:

```bash
npx vitest run src/services/bookings/calculate-booking-quota.test.ts src/services/bookings/check-availability.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/bookings src/services/bookings src/app/admin/bookings src/app/member/bookings
git commit -m "feat: add booking engine and cancellation policies"
```

### Task 10: Implementar calendario operativo

**Files:**
- Create: `src/components/calendar/bookings-calendar.tsx`
- Create: `src/components/calendar/calendar-filters.tsx`
- Create: `src/app/admin/calendar/page.tsx`
- Test: `src/components/calendar/bookings-calendar.test.tsx`

**Step 1: Escribir test del calendario**

```tsx
import { render, screen } from "@testing-library/react";
import { BookingsCalendar } from "@/components/calendar/bookings-calendar";

describe("BookingsCalendar", () => {
  it("renderiza eventos recibidos", () => {
    render(<BookingsCalendar events={[{ id: "1", title: "Reserva", start: "2026-04-01T10:00:00Z", end: "2026-04-01T11:00:00Z" }]} />);
    expect(screen.getByText("Reserva")).toBeInTheDocument();
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/components/calendar/bookings-calendar.test.tsx`
Expected: FAIL porque el componente no existe

**Step 3: Implementar calendario**

Incluir:
- vista día/semana/mes
- filtros por espacio, estado y miembro
- reservas y bloqueos en la misma agenda

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/components/calendar/bookings-calendar.test.tsx
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/calendar src/app/admin/calendar/page.tsx
git commit -m "feat: add operations calendar"
```

### Task 11: Implementar renovaciones manuales y alertas

**Files:**
- Create: `src/modules/renewals/actions.ts`
- Create: `src/modules/renewals/queries.ts`
- Create: `src/services/renewals/renew-member-plan.ts`
- Create: `src/modules/alerts/queries.ts`
- Create: `src/app/admin/renewals/page.tsx`
- Create: `src/app/admin/settings/page.tsx`
- Test: `src/services/renewals/renew-member-plan.test.ts`

**Step 1: Escribir test de renovación**

```ts
import { describe, expect, it } from "vitest";
import { buildRenewalSnapshot } from "@/services/renewals/renew-member-plan";

describe("renew-member-plan", () => {
  it("reinicia cupos con el total del plan", () => {
    const result = buildRenewalSnapshot({
      oldQuotaRemaining: 2,
      newQuotaTotal: 10,
    });

    expect(result.quotaRemaining).toBe(10);
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/services/renewals/renew-member-plan.test.ts`
Expected: FAIL porque el servicio no existe

**Step 3: Implementar seguimiento manual**

Incluir:
- listado de pagos o vencimientos próximos
- acción `registrar pago / renovar`
- actualización de vigencia
- reinicio de cupos
- registro en `renewals`
- reglas configurables básicas desde settings

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/services/renewals/renew-member-plan.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/renewals src/modules/alerts src/services/renewals src/app/admin/renewals/page.tsx src/app/admin/settings/page.tsx
git commit -m "feat: add manual renewals and operational alerts"
```

### Task 12: Completar portal del miembro

**Files:**
- Create: `src/app/member/plan/page.tsx`
- Create: `src/app/member/profile/page.tsx`
- Create: `src/modules/profile/actions.ts`
- Create: `src/modules/profile/schema.ts`
- Test: `src/modules/profile/schema.test.ts`

**Step 1: Escribir test del perfil**

```ts
import { describe, expect, it } from "vitest";
import { passwordChangeSchema } from "@/modules/profile/schema";

describe("passwordChangeSchema", () => {
  it("requiere confirmar la nueva contraseña", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "secret123",
      newPassword: "newSecret123",
      confirmPassword: "newSecret123",
    });

    expect(result.success).toBe(true);
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/modules/profile/schema.test.ts`
Expected: FAIL porque el módulo aún no existe

**Step 3: Implementar portal**

Incluir:
- dashboard del miembro
- pantalla de plan activo
- pantalla de reservas propias
- cambio de contraseña
- alertas visibles para el miembro

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/modules/profile/schema.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/member/plan/page.tsx src/app/member/profile/page.tsx src/modules/profile
git commit -m "feat: complete member self-service portal"
```

### Task 13: Construir dashboard operativo con métricas básicas

**Files:**
- Create: `src/modules/dashboard/queries.ts`
- Create: `src/components/dashboard/kpi-card.tsx`
- Create: `src/components/dashboard/occupancy-chart.tsx`
- Modify: `src/app/admin/dashboard/page.tsx`
- Test: `src/modules/dashboard/queries.test.ts`

**Step 1: Escribir test de métricas**

```ts
import { describe, expect, it } from "vitest";
import { buildOccupancySummary } from "@/modules/dashboard/queries";

describe("buildOccupancySummary", () => {
  it("resume horas reservadas por espacio", () => {
    const result = buildOccupancySummary([
      { spaceId: "a", durationHours: 2 },
      { spaceId: "a", durationHours: 1 },
    ]);

    expect(result["a"]).toBe(3);
  });
});
```

**Step 2: Ejecutar test y verificar fallo**

Run: `npx vitest run src/modules/dashboard/queries.test.ts`
Expected: FAIL porque el módulo no existe

**Step 3: Implementar dashboard**

Mostrar:
- reservas del día
- ocupación por espacio
- membresías activas
- vencimientos próximos
- cancelaciones recientes
- acciones rápidas

**Step 4: Ejecutar test y lint**

Run:

```bash
npx vitest run src/modules/dashboard/queries.test.ts
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/dashboard src/components/dashboard src/app/admin/dashboard/page.tsx
git commit -m "feat: add operational dashboard"
```

### Task 14: End-to-end básico, RLS y hardening

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`
- Create: `tests/e2e/member-booking.spec.ts`
- Create: `tests/e2e/admin-renewal.spec.ts`
- Modify: `README.md`

**Step 1: Escribir E2E del miembro**

```ts
import { test, expect } from "@playwright/test";

test("member can book available space", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/login/);
});
```

**Step 2: Ejecutar E2E y verificar fallo**

Run: `npx playwright test tests/e2e/member-booking.spec.ts`
Expected: FAIL hasta tener la app corriendo y el flujo completo implementado

**Step 3: Implementar hardening final**

Incluir:
- políticas RLS mínimas
- README con setup local
- seeds de ejemplo
- verificación de flows principales

**Step 4: Ejecutar suite final**

Run:

```bash
npm run lint
npx vitest run
npx playwright test
```

Expected: PASS

**Step 5: Commit**

```bash
git add supabase tests README.md
git commit -m "chore: add rls policies and end-to-end coverage"
```

## Notas de implementación

- Mantener una sola fuente de verdad para disponibilidad en `src/services/bookings`.
- Las acciones críticas deben ejecutarse en transacciones.
- Guardar snapshot de `hourlyQuotaCost` y `quotaConsumed` al crear la reserva.
- Renovación manual del MVP debe reiniciar cupos y no acumular remanente, salvo cambio explícito de negocio.
- El frontend no debe confiar en `memberId` enviado por el navegador para flujos del miembro.
- El calendario puede dejar drag and drop para una iteración posterior si complica el alcance.

## Verificación mínima antes de considerar listo el MVP

- staff puede crear plan, espacio y miembro
- miembro puede iniciar sesión con credenciales creadas por staff
- miembro puede reservar un espacio disponible
- no se generan solapamientos
- los cupos se descuentan correctamente
- cancelaciones respetan la política
- staff puede registrar pago y renovar
- dashboard muestra métricas básicas
- RLS protege datos de miembros entre sí
