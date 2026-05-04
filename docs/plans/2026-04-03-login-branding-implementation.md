# Login Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Actualizar la pantalla de login con branding KazeCode y copy más comercial sin alterar el flujo de autenticación.

**Architecture:** El trabajo se concentra en `src/app/(auth)/login/page.tsx` y una prueba nueva de render. Se reutiliza el asset existente en `public/branding/` y se validan solamente branding y copy, sin tocar acciones del servidor.

**Tech Stack:** Next.js App Router, React 19, Vitest, Testing Library, next/image

---

### Task 1: Cubrir el login con una prueba de branding

**Files:**
- Create: `src/app/(auth)/login/page.test.tsx`
- Modify: `src/app/(auth)/login/page.tsx`

**Step 1: Write the failing test**

Crear una prueba que renderice la página de login y valide:
- presencia visible de `StudioFlow`
- presencia de una imagen con `alt="KazeCode"`
- nuevo heading comercial
- nuevo texto del botón principal

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/(auth)/login/page.test.tsx`
Expected: FAIL porque el heading y/o el CTA todavía responden al copy anterior.

**Step 3: Write minimal implementation**

Actualizar `src/app/(auth)/login/page.tsx` para:
- importar y usar `next/image`
- reemplazar el ícono por el logo KazeCode en desktop y mobile
- ajustar hero copy y copy del formulario

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/(auth)/login/page.test.tsx`
Expected: PASS

**Step 5: Commit**

No hacer commit automático en este plan porque el árbol tiene cambios ajenos en curso.

### Task 2: Verificar que el cambio no rompa branding compartido

**Files:**
- Test: `src/components/layout/app-shell.test.tsx`

**Step 1: Run targeted regression checks**

Run: `npm test -- src/app/(auth)/login/page.test.tsx src/components/layout/app-shell.test.tsx`
Expected: PASS

**Step 2: Review final diff**

Verificar que solo cambien el login y los documentos de plan.

**Step 3: Commit**

No hacer commit automático en este plan porque el usuario no pidió acciones de git y hay trabajo ajeno presente.
