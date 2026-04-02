# StudioFlow Release Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dejar StudioFlow en estado de primera versión usable corrigiendo autenticación, estabilidad de UI, documentación operativa y verificaciones de release.

**Architecture:** Vamos a atacar primero los bloqueadores que impiden validar el negocio punta a punta. La prioridad es destrabar autenticación/sesión y dejar verdes los checks automatizados que hoy fallan. Después cerramos el handoff operativo con documentación y bootstrap básico para que otra persona pueda levantar el sistema sin depender del autor original.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Auth, Drizzle ORM, Vitest, Testing Library, Playwright, ESLint.

---

### Task 1: Destrabar login y sesión

**Files:**
- Modify: `src/app/(auth)/actions.ts`
- Modify: `src/lib/supabase/server.ts`
- Modify: `src/lib/supabase/proxy.ts`
- Test: `tests/e2e/studioflow-flows.spec.ts`

**Step 1: Reproducir el fallo actual**

Run: `npm run test:e2e`
Expected: FAIL en el primer flujo, quedándose en `/login`.

**Step 2: Recolectar evidencia puntual**

Verificar:
- si `signInWithPassword` devuelve error
- si la cookie de sesión queda seteada
- si el perfil se resuelve correctamente luego del login

**Step 3: Aplicar la corrección mínima**

Ajustar únicamente la parte del flujo que impide persistir o resolver la sesión.

**Step 4: Verificar el flujo**

Run: `npx playwright test tests/e2e/studioflow-flows.spec.ts --grep "alta de miembro"`
Expected: PASS del primer escenario o al menos avance más allá del login.

### Task 2: Dejar verdes los tests rojos de UI

**Files:**
- Modify: `src/components/layout/sidebar-nav.tsx`
- Modify: `src/components/layout/topbar.tsx`
- Modify: `src/components/forms/space-form.tsx`
- Modify: `src/components/dashboard/admin-dashboard.test.tsx`
- Modify: `src/components/forms/space-form.test.tsx`
- Modify: `src/components/layout/app-shell.test.tsx`
- Modify: `src/components/layout/sidebar-nav.test.tsx`
- Modify: `src/components/layout/topbar.test.tsx`

**Step 1: Ejecutar suite focalizada**

Run: `npx vitest run src/components/layout/sidebar-nav.test.tsx src/components/layout/topbar.test.tsx src/components/layout/app-shell.test.tsx src/components/dashboard/admin-dashboard.test.tsx src/components/forms/space-form.test.tsx`
Expected: FAIL reproducible en los 5 tests actuales.

**Step 2: Corregir cada contrato roto con el cambio mínimo**

Cubrir:
- `pathname` nulo en navegación
- texto/accesibilidad desalineados con tests
- cambio de markup en dashboard
- incompatibilidad de form con server action y media upload

**Step 3: Re-ejecutar suite focalizada**

Run: mismo comando del paso 1
Expected: PASS

### Task 3: Resolver errores de lint de release

**Files:**
- Modify: `src/components/ui/theme-toggle.tsx`
- Modify: `src/components/forms/smart-booking-form.tsx`
- Modify: `src/app/member/spaces/[spaceId]/page.tsx`
- Modify: cualquier archivo adicional con error, no warnings triviales

**Step 1: Ejecutar lint**

Run: `npm run lint`
Expected: FAIL por los errores actuales.

**Step 2: Corregir errores**

Corregir:
- `setState` síncrono dentro de effect
- `any` explícito
- variables declaradas con `let` innecesario

**Step 3: Re-ejecutar lint**

Run: `npm run lint`
Expected: PASS o solo warnings aceptables si decidimos mantenerlos.

### Task 4: Documentación operativa mínima

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Optional: `docs/plans/2026-04-02-release-hardening-plan.md`

**Step 1: Reemplazar README genérico**

Documentar:
- qué es StudioFlow
- requisitos
- variables de entorno
- migraciones
- cómo crear el primer admin
- cómo correr tests
- modo real de email y cron

**Step 2: Completar bootstrap mínimo**

Dejar explícito el procedimiento inicial para:
- aplicar migraciones
- crear primer usuario interno
- correr la app con datos funcionales

**Step 3: Validar legibilidad**

Revisar que otro desarrollador pueda seguir el setup de punta a punta.

### Task 5: Verificación de salida

**Files:**
- Modify: ninguno salvo ajustes menores

**Step 1: Ejecutar checks**

Run:
- `npm run lint`
- `npm test`
- `npm run test:e2e`

Expected: todo green.

**Step 2: Ejecutar build**

Run: `npm run build`
Expected: PASS

**Step 3: Resumir estado final**

Dejar claro:
- qué quedó listo
- qué supuestos se tomaron
- qué riesgos residuales existen si alguno sigue abierto
