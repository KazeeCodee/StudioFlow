# Member Without Plan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir crear miembros sin plan mediante una confirmación accesible que preserve los datos al cancelar.

**Architecture:** El formulario cliente interceptará únicamente los envíos sin `planId` y pedirá confirmación con Radix AlertDialog. La acción de servidor normalizará el valor vacío y el servicio conservará el flujo transaccional actual, omitiendo la consulta y la inserción de `member_plans` cuando no haya plan.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, TypeScript, Zod 4, Radix UI, Drizzle ORM, Supabase Auth, Vitest y Testing Library.

---

### Task 1: Aceptar un plan opcional en la validación

**Files:**
- Create: `src/modules/members/schema.test.ts`
- Modify: `src/modules/members/schema.ts`

**Step 1: Write the failing tests**

Agregar casos que comprueben que `memberSchema` acepta un UUID, acepta `""` transformándolo en `undefined`, acepta la ausencia del campo y rechaza un texto que no sea UUID.

```ts
const baseMember = {
  fullName: "Ana Pérez",
  email: "ana@example.com",
  password: "password-segura",
  status: "active" as const,
};

expect(memberSchema.parse({ ...baseMember, planId: "" }).planId).toBeUndefined();
expect(memberSchema.parse(baseMember).planId).toBeUndefined();
expect(memberSchema.safeParse({ ...baseMember, planId: "plan-invalido" }).success).toBe(false);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/members/schema.test.ts`

Expected: FAIL porque `planId` todavía es obligatorio.

**Step 3: Write minimal implementation**

Crear un esquema reutilizable que convierta el string vacío en `undefined` antes de validar el UUID opcional.

```ts
const optionalPlanIdSchema = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().uuid("Seleccioná un plan válido.").optional(),
);
```

Usarlo solamente en `memberSchema`; el cambio de plan existente debe continuar exigiendo un UUID.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/modules/members/schema.test.ts`

Expected: PASS.

### Task 2: Crear miembros sin una asignación inicial

**Files:**
- Modify: `src/services/members/create-member-with-plan.test.ts`
- Modify: `src/services/members/create-member-with-plan.ts`

**Step 1: Write the failing service test**

Mockear `getDb` y `createSupabaseAdminClient` para ejecutar la transacción real del servicio con dobles mínimos. Crear un miembro cuyo input no tenga `planId` y comprobar:

```ts
expect(db.select).not.toHaveBeenCalled();
expect(insertedTables).not.toContain(memberPlans);
expect(result.memberPlanId).toBeNull();
expect(auditMetadata).toMatchObject({ planId: null, memberPlanId: null });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/members/create-member-with-plan.test.ts`

Expected: FAIL porque el servicio consulta `plans` usando un `planId` obligatorio y siempre inserta `member_plans`.

**Step 3: Write minimal implementation**

- Consultar `plans` únicamente cuando `input.planId` exista.
- Mantener el error si se informó un UUID que no corresponde a un plan.
- Calcular fechas y cuota solo si se encontró un plan.
- Insertar `memberPlans` solo en ese caso.
- Registrar `planId` y `memberPlanId` como `null` en la auditoría cuando no hay plan.
- Devolver `{ memberId, memberPlanId: null }` para el alta sin plan.
- Conservar la eliminación compensatoria del usuario de Supabase si falla la transacción.

**Step 4: Run service tests**

Run: `npm test -- src/services/members/create-member-with-plan.test.ts`

Expected: PASS para la cuota existente y el nuevo flujo sin plan.

### Task 3: Mostrar la confirmación y preservar el formulario

**Files:**
- Create: `src/components/forms/member-form.test.tsx`
- Modify: `src/components/forms/member-form.tsx`
- Modify: `src/app/admin/members/new/page.tsx`

**Step 1: Write the failing interaction tests**

Mockear `createMemberAction` y renderizar `MemberForm` con una opción de plan. Cubrir estos comportamientos:

1. Con plan seleccionado, **Crear miembro** invoca la acción directamente y no muestra la advertencia.
2. Sin plan, **Crear miembro** abre un `alertdialog` y todavía no invoca la acción.
3. **Volver al formulario** cierra el modal y mantiene nombre, email y demás valores escritos.
4. **Crear sin plan** confirma el envío e invoca la acción con `planId` vacío.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/forms/member-form.test.tsx`

Expected: FAIL porque el selector sigue requerido y no existe el diálogo.

**Step 3: Write minimal implementation**

- Marcar `MemberForm` con `"use client"`.
- Añadir refs para el formulario y para una confirmación de un solo envío.
- Interceptar `onSubmit`; si `planId` está vacío y no está confirmado, ejecutar `preventDefault()` y abrir Radix `AlertDialog`.
- En **Crear sin plan**, marcar el envío como confirmado y llamar `form.requestSubmit()`.
- En **Volver al formulario**, cerrar el diálogo sin resetear ni navegar.
- Quitar `required` del selector y cambiar la primera opción a `Sin plan por ahora`.
- Mantener el Server Action en `action={createMemberAction}`; la autorización y la mutación siguen en el servidor.
- Actualizar el texto introductorio de la página para indicar que el plan puede asignarse ahora o después.

El diálogo debe usar `AlertDialog.Root`, `Portal`, `Overlay`, `Content`, `Title`, `Description`, `Cancel` y `Action` desde `radix-ui`, con foco atrapado, overlay, contraste y botones claros.

**Step 4: Run component tests**

Run: `npm test -- src/components/forms/member-form.test.tsx`

Expected: PASS.

### Task 4: Verificación completa

**Files:**
- Review: `src/modules/members/schema.ts`
- Review: `src/services/members/create-member-with-plan.ts`
- Review: `src/components/forms/member-form.tsx`

**Step 1: Run focused tests together**

Run: `npm test -- src/modules/members/schema.test.ts src/services/members/create-member-with-plan.test.ts src/components/forms/member-form.test.tsx`

Expected: todos PASS.

**Step 2: Run the full suite**

Run: `npm test`

Expected: 0 failures.

**Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0 sin errores.

**Step 4: Run production build**

Run: `npm run build`

Expected: exit 0.

**Step 5: Review the diff**

Run: `git diff --check` and `git status --short`.

Confirmar que no se modificaron `package-lock.json`, `.impeccable/` ni los planes no relacionados que ya estaban presentes en el worktree.
