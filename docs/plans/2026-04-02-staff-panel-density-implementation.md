# Staff Panel Density Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Compactar el panel staff reduciendo copy redundante y espacio vertical en headers y configuración, sin perder claridad operativa.

**Architecture:** El cambio vive en el shell del panel staff, el header compartido y dos pantallas concretas (`users` y `settings`). La estrategia será test-first sobre el copy esperado y luego una implementación mínima que acorte textos, elimine ayudas redundantes y reduzca spacing en los bloques más altos.

**Tech Stack:** Next.js 16 App Router, React 19, Vitest, Testing Library, Tailwind CSS

---

### Task 1: Documentar el nuevo copy compacto del shell staff

**Files:**
- Modify: `src/components/layout/app-shell.test.tsx`
- Modify: `src/app/admin/layout.tsx`

**Step 1: Write the failing test**

Actualizar `src/components/layout/app-shell.test.tsx` para esperar el header staff nuevo:
- `Panel staff`
- `Centro operativo`
- una bajada más corta y directa

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/app-shell.test.tsx`
Expected: FAIL porque el subtítulo actual todavía usa el copy largo

**Step 3: Write minimal implementation**

Modificar `src/app/admin/layout.tsx` con el copy resumido aprobado.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/layout/app-shell.test.tsx`
Expected: PASS

### Task 2: Compactar el encabezado compartido

**Files:**
- Create: `src/components/layout/page-header.test.tsx`
- Modify: `src/components/layout/page-header.tsx`

**Step 1: Write the failing test**

Crear un test que renderice `PageHeader` y valide:
- presencia de eyebrow, título y subtítulo
- spacing más compacto en el contenedor principal
- ancho/control visual más ajustado del subtítulo

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/page-header.test.tsx`
Expected: FAIL porque las clases actuales siguen siendo más amplias

**Step 3: Write minimal implementation**

Reducir `space-y`, `gap` y ancho del subtítulo en `src/components/layout/page-header.tsx` sin tocar la estructura principal.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/layout/page-header.test.tsx`
Expected: PASS

### Task 3: Resumir la pantalla de usuarios internos

**Files:**
- Create: `src/app/admin/users/page.test.tsx`
- Modify: `src/app/admin/users/page.tsx`

**Step 1: Write the failing test**

Crear un test para `src/app/admin/users/page.tsx` con mocks de permisos y queries, esperando un texto más corto y sin la explicación larga actual.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/admin/users/page.test.tsx`
Expected: FAIL porque la página todavía muestra la descripción extensa actual

**Step 3: Write minimal implementation**

Resumir la bajada de `Usuarios internos` manteniendo el dato importante sobre accesos y clave inicial.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/admin/users/page.test.tsx`
Expected: PASS

### Task 4: Compactar configuración y reglas globales

**Files:**
- Create: `src/app/admin/settings/page.test.tsx`
- Modify: `src/app/admin/settings/page.tsx`

**Step 1: Write the failing test**

Crear un test con mocks de auth, settings, notifications y env para validar:
- copy más corto en el encabezado de configuración
- ausencia de la descripción redundante de `Reglas globales`
- ayudas de campos más compactas

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/admin/settings/page.test.tsx`
Expected: FAIL porque el copy actual sigue siendo largo

**Step 3: Write minimal implementation**

Actualizar `src/app/admin/settings/page.tsx` para:
- resumir el header de pantalla
- eliminar o compactar textos de apoyo redundantes
- bajar spacing vertical en cards y formularios densos

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/admin/settings/page.test.tsx`
Expected: PASS

### Task 5: Verificación final

**Files:**
- Modify: `src/components/layout/page-header.tsx`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/users/page.tsx`
- Modify: `src/app/admin/settings/page.tsx`
- Test: `src/components/layout/app-shell.test.tsx`
- Test: `src/components/layout/page-header.test.tsx`
- Test: `src/app/admin/users/page.test.tsx`
- Test: `src/app/admin/settings/page.test.tsx`

**Step 1: Run targeted tests**

Run: `npm test -- src/components/layout/app-shell.test.tsx src/components/layout/page-header.test.tsx src/app/admin/users/page.test.tsx src/app/admin/settings/page.test.tsx`
Expected: PASS

**Step 2: Run lint on touched files**

Run: `npx eslint src/components/layout/app-shell.test.tsx src/components/layout/page-header.tsx src/components/layout/page-header.test.tsx src/app/admin/layout.tsx src/app/admin/users/page.tsx src/app/admin/users/page.test.tsx src/app/admin/settings/page.tsx src/app/admin/settings/page.test.tsx`
Expected: sin errores

**Step 3: Review diff**

Run: `git diff -- docs/plans src/components/layout/page-header.tsx src/app/admin/layout.tsx src/app/admin/users/page.tsx src/app/admin/settings/page.tsx src/components/layout/app-shell.test.tsx src/components/layout/page-header.test.tsx src/app/admin/users/page.test.tsx src/app/admin/settings/page.test.tsx`
Expected: copy más compacto y spacing reducido solo en las zonas previstas
