# Members CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Completar el CRUD operativo de miembros con detalle, edicion, cambio de estado, ajuste manual de cupos y cambio de plan dentro del panel admin.

**Architecture:** La UI se apoya en una nueva ruta de detalle de miembro y en componentes de formulario reutilizables. Las reglas delicadas se mueven a servicios de dominio en `src/services/members`, mientras que las Server Actions de `src/modules/members/actions.ts` solo validan, autorizan, coordinan transacciones y revalidan rutas.

**Tech Stack:** Next.js 16 App Router, React 19, Server Actions, Drizzle ORM, Supabase Auth, Zod, Tailwind CSS, shadcn/ui, Vitest.

---

### Task 1: Cubrir reglas de cupos y cambio de plan con tests unitarios

**Files:**
- Create: `src/services/members/adjust-member-quota.test.ts`
- Create: `src/services/members/change-member-plan.test.ts`
- Create: `src/services/members/adjust-member-quota.ts`
- Create: `src/services/members/change-member-plan.ts`

**Step 1: Write the failing quota test**

```ts
import { describe, expect, it } from "vitest";
import { buildQuotaAdjustmentSnapshot } from "@/services/members/adjust-member-quota";

describe("buildQuotaAdjustmentSnapshot", () => {
  it("adjusts remaining and total quota while preserving used quota", () => {
    const result = buildQuotaAdjustmentSnapshot({
      quotaTotal: 12,
      quotaUsed: 4,
      quotaRemaining: 8,
      delta: 3,
    });

    expect(result).toEqual({
      quotaTotal: 15,
      quotaUsed: 4,
      quotaRemaining: 11,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/members/adjust-member-quota.test.ts`
Expected: FAIL because the service does not exist yet.

**Step 3: Write the failing plan change test**

```ts
import { describe, expect, it } from "vitest";
import { buildChangedPlanSnapshot } from "@/services/members/change-member-plan";

describe("buildChangedPlanSnapshot", () => {
  it("starts the new plan with the target plan quota", () => {
    const startsAt = new Date("2026-04-01T12:00:00.000Z");

    const result = buildChangedPlanSnapshot({
      startsAt,
      durationType: "monthly",
      durationValue: 1,
      quotaAmount: 20,
    });

    expect(result.quotaTotal).toBe(20);
    expect(result.quotaRemaining).toBe(20);
    expect(result.quotaUsed).toBe(0);
    expect(result.nextPaymentDueAt).toEqual(result.endsAt);
  });
});
```

**Step 4: Run test to verify it fails**

Run: `npm test -- src/services/members/change-member-plan.test.ts`
Expected: FAIL because the service does not exist yet.

**Step 5: Write minimal implementation**

Implement pure helpers first:

- `buildQuotaAdjustmentSnapshot`
- `buildChangedPlanSnapshot`
- helper for plan end date calculation

Also guard invalid snapshots:

- `quotaRemaining` cannot be negative
- `quotaTotal` cannot be smaller than `quotaUsed`

**Step 6: Run tests to verify they pass**

Run: `npm test -- src/services/members/adjust-member-quota.test.ts src/services/members/change-member-plan.test.ts`
Expected: PASS

### Task 2: Expand member schemas for edit, status, quota, and plan change flows

**Files:**
- Modify: `src/modules/members/schema.ts`
- Create: `src/modules/members/schema.test.ts`

**Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from "vitest";
import { memberQuotaAdjustmentSchema } from "@/modules/members/schema";

describe("memberQuotaAdjustmentSchema", () => {
  it("accepts positive and negative deltas with a note", () => {
    const result = memberQuotaAdjustmentSchema.safeParse({
      delta: -2,
      reason: "Correccion manual",
    });

    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/modules/members/schema.test.ts`
Expected: FAIL because the schema does not exist yet.

**Step 3: Write minimal implementation**

Add dedicated schemas for:

- `memberUpdateSchema`
- `memberStatusSchema`
- `memberQuotaAdjustmentSchema`
- `memberPlanChangeSchema`

Keep `memberSchema` for create flow unchanged except for shared helpers if useful.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/modules/members/schema.test.ts`
Expected: PASS

### Task 3: Add member detail query support

**Files:**
- Modify: `src/modules/members/queries.ts`

**Step 1: Extend queries**

Add:

- `getMemberDetail(memberId: string)`
- active plan info with `member_plans` + `plans`
- recent plan history ordered descending

The returned shape should include:

- member identity and notes
- linked profile id and status
- active plan summary
- recent plan history array

**Step 2: Keep list query compatible**

Make sure `listMembers()` still powers the current index page without breaking its shape.

### Task 4: Add services for member operations

**Files:**
- Create: `src/services/members/update-member-profile.ts`
- Modify: `src/services/members/adjust-member-quota.ts`
- Modify: `src/services/members/change-member-plan.ts`

**Step 1: Implement profile update service**

`updateMemberProfile` should:

- load member + profile
- update `members`
- update `profiles`
- keep email untouched
- write `audit_logs`

**Step 2: Implement quota adjustment service**

`adjustMemberQuota` should:

- load active `member_plan`
- compute new snapshot with `buildQuotaAdjustmentSnapshot`
- persist `quota_total` and `quota_remaining`
- keep `quota_used`
- write `audit_logs`

**Step 3: Implement plan change service**

`changeMemberPlan` should:

- load member and current active plan
- load selected target plan
- cancel the previous active plan if present
- create a new active `member_plan`
- write `audit_logs`

**Step 4: Keep all writes transactional**

Use `db.transaction` for every service that touches multiple rows/tables.

### Task 5: Add Server Actions for the new member operations

**Files:**
- Modify: `src/modules/members/actions.ts`

**Step 1: Add update action**

Parse with `memberUpdateSchema`, require staff, call `updateMemberProfile`, then:

- `revalidatePath("/admin/members")`
- `revalidatePath(\`/admin/members/${memberId}\`)`

**Step 2: Add status action**

Parse with `memberStatusSchema`, require staff, synchronize status between `profiles` and `members`, write audit, revalidate routes.

**Step 3: Add quota adjustment action**

Parse with `memberQuotaAdjustmentSchema`, require staff, call `adjustMemberQuota`, revalidate routes.

**Step 4: Add plan change action**

Parse with `memberPlanChangeSchema`, require staff, call `changeMemberPlan`, revalidate routes.

### Task 6: Rework the member form into a reusable create/edit component

**Files:**
- Modify: `src/components/forms/member-form.tsx`

**Step 1: Preserve create flow**

Keep support for:

- password field
- plan selection
- create action

**Step 2: Add edit mode**

Support props for:

- default values
- optional password field hidden in edit mode
- optional action prop for edit flow
- optional submit label and title

**Step 3: Avoid overloading operational actions**

Quota adjustment, status change, and plan change stay outside this form as dedicated forms/cards.

### Task 7: Build the admin member detail page

**Files:**
- Create: `src/app/admin/members/[memberId]/page.tsx`
- Modify: `src/app/admin/members/page.tsx`

**Step 1: Add the route**

Implement `PageProps` compatible with Next.js 16 async `params`.

The page should render:

- header with member identity
- active plan summary
- edit card using `MemberForm`
- status change card
- quota adjustment card
- plan change card
- recent plan history table

**Step 2: Link from the index**

Make each member row navigate to `/admin/members/[memberId]` from the list page.

### Task 8: Run focused verification

**Files:**
- No code changes required unless something fails

**Step 1: Run unit tests**

Run: `npm test -- src/services/members/adjust-member-quota.test.ts src/services/members/change-member-plan.test.ts src/modules/members/schema.test.ts`
Expected: PASS

**Step 2: Run the existing member-related tests**

Run: `npm test -- src/services/members/create-member-with-plan.test.ts`
Expected: PASS

**Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 4: Optional app smoke**

Run: `npm run build`
Expected: PASS if no unrelated environment/runtime blockers appear.

## Notes

- Keep all authorization inside Server Actions and services; do not rely on route protection alone.
- Use native server forms unless there is a concrete need for client state.
- Preserve current audit log style with explicit `action`, `entityType`, and metadata snapshots.
- Use `notFound()` for missing members and avoid returning partial UI with undefined data.
- Do not introduce email editing yet because auth/account syncing belongs to the later auth/accounts milestone.
