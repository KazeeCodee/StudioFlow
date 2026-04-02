# KazeCode Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el branding genérico del sidebar por el logo de KazeCode y agregar un crédito clickeable hacia kazecode.com.ar.

**Architecture:** Los assets de branding se servirán desde `public/branding/`. El layout del sidebar se actualizará en `src/components/layout/app-shell.tsx`, manteniendo la estructura actual y sin tocar la navegación. Los tests del shell se ajustarán para cubrir el nuevo branding y el enlace externo.

**Tech Stack:** Next.js 16 App Router, React 19, Testing Library, assets estáticos en `public/`

---

### Task 1: Incorporar los assets de branding

**Files:**
- Create: `public/branding/kazecode-logo.svg`
- Create: `public/branding/kazecode-logo-round.png`

**Step 1: Copiar el asset SVG**

Copiar `C:/Users/quime/Documents/TRABAJO/Kazecode/Loki/Revendedores/Logo 1.svg` a `public/branding/kazecode-logo.svg`.

**Step 2: Copiar el asset PNG**

Copiar `C:/Users/quime/Documents/TRABAJO/Kazecode/Loki/Revendedores/Logo redondo.png` a `public/branding/kazecode-logo-round.png`.

**Step 3: Verificar presencia**

Run: `Get-ChildItem public\\branding`
Expected: aparecen ambos archivos nuevos

### Task 2: Actualizar el header del sidebar

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Test: `src/components/layout/app-shell.test.tsx`

**Step 1: Escribir o ajustar el test**

Actualizar el test para validar:
- presencia de `StudioFlow`
- presencia de un enlace externo a `https://kazecode.com.ar`
- presencia del crédito `KazeCode`

**Step 2: Ejecutar el test para ver el rojo**

Run: `npm test -- src/components/layout/app-shell.test.tsx`
Expected: FAIL por ausencia del branding/crédito nuevo

**Step 3: Implementar el branding**

En `app-shell.tsx`:
- reemplazar el ícono genérico por el logo SVG
- mantener `StudioFlow`
- conservar el subtítulo contextual

**Step 4: Agregar el crédito del footer**

En el footer del sidebar:
- agregar un bloque visual discreto
- link externo con `target="_blank"` y `rel="noreferrer"`
- texto visible de crédito a KazeCode

**Step 5: Ejecutar el test para ver el verde**

Run: `npm test -- src/components/layout/app-shell.test.tsx`
Expected: PASS

### Task 3: Verificación final

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Test: `src/components/layout/app-shell.test.tsx`

**Step 1: Ejecutar lint puntual**

Run: `npx eslint src/components/layout/app-shell.tsx src/components/layout/app-shell.test.tsx`
Expected: sin errores

**Step 2: Ejecutar test puntual**

Run: `npm test -- src/components/layout/app-shell.test.tsx`
Expected: PASS

**Step 3: Revisar el diff**

Run: `git diff -- public/branding src/components/layout/app-shell.tsx src/components/layout/app-shell.test.tsx`
Expected: assets copiados, branding nuevo y test actualizado
