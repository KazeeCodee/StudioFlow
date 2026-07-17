# Create Resource Form Errors Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make valid space, plan, and member creation submissions persist successfully while displaying expected failures inside their forms instead of crashing the page.

**Architecture:** Use React 19 `useActionState` with a shared serializable form state. Creation actions catch validation/service failures, log unexpected failures, return user-facing state, and redirect outside catch blocks after a confirmed insert. Normalize zero-byte space upload placeholders before image validation.

**Tech Stack:** Next.js 16.2 Server Actions, React 19.2 `useActionState`, TypeScript, Zod 4, Drizzle ORM, Vitest, Testing Library.

---

### Task 1: Normalize empty space file inputs

**Files:**
- Modify: `src/services/spaces/resolve-space-image.test.ts`
- Modify: `src/services/spaces/resolve-space-image.ts`
- Modify: `src/modules/spaces/actions.test.ts`
- Modify: `src/modules/spaces/actions.ts`

**Steps:**

1. Add a failing test with `new File([], "placeholder", { type: "application/octet-stream" })` and assert that it behaves as no upload.
2. Run `npm test -- src/services/spaces/resolve-space-image.test.ts src/modules/spaces/actions.test.ts` and confirm the MIME validation failure.
3. Change upload presence checks to require `file.size > 0`, regardless of placeholder name.
4. Run the targeted tests and confirm they pass.

### Task 2: Add shared action state and creation-action coverage

**Files:**
- Create: `src/lib/form-action-state.ts`
- Modify: `src/modules/spaces/actions.test.ts`
- Create: `src/modules/plans/actions.test.ts`
- Create: `src/modules/members/actions.test.ts`
- Modify: `src/modules/spaces/actions.ts`
- Modify: `src/modules/plans/actions.ts`
- Modify: `src/modules/members/actions.ts`

**Steps:**

1. Add failing tests asserting a controlled error state on rejected validation/service calls and a redirect after each successful creation.
2. Run the three action test files and confirm failures against the current one-argument actions.
3. Define `FormActionState`, its idle value, and safe error conversion.
4. Update creation actions to accept `(previousState, formData)`, return errors, retain authorization checks, and redirect outside catch blocks after successful writes.
5. Run the three action test files and confirm they pass.

### Task 3: Render errors without leaving the forms

**Files:**
- Create: `src/components/forms/create-resource-form.test.tsx`
- Modify: `src/components/forms/space-form.tsx`
- Modify: `src/components/forms/plan-form.tsx`
- Modify: `src/components/forms/member-form.tsx`

**Steps:**

1. Add failing component tests asserting `role="alert"`, returned error text, and a disabled pending submit button.
2. Run the component test and confirm the server action state is not rendered yet.
3. Convert the forms to client components, connect their creation actions with `useActionState`, and render accessible error feedback.
4. Preserve update-form compatibility by using a small action-state adapter for supplied update actions.
5. Run the component tests and confirm they pass.

### Task 4: Verify the complete correction

**Files:**
- No additional files expected.

**Steps:**

1. Run `npm test -- src/services/spaces/resolve-space-image.test.ts src/modules/spaces/actions.test.ts src/modules/plans/actions.test.ts src/modules/members/actions.test.ts src/components/forms/create-resource-form.test.tsx`.
2. Run `npm test`.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Review `git diff --check` and `git status --short` to ensure only scoped files changed.

