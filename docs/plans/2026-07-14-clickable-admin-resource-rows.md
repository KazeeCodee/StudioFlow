# Clickable Admin Resource Rows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every admin list row for spaces, plans, and members open the exact resource detail while preserving accessible keyboard navigation and the existing detail operations.

**Architecture:** Keep all three list pages as Server Components and use one reusable stretched `next/link` inside each table row. The row remains valid table markup, gains a visible `Ver detalle` affordance, and uses the link pseudo-element to expand the pointer target without adding client-side routing code or hydrating the list pages.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

---

### Task 1: Reusable navigable admin row

**Files:**
- Create: `src/components/admin/admin-resource-row.tsx`
- Create: `src/components/admin/admin-resource-row.test.tsx`

**Step 1: Write the failing test**

Create `src/components/admin/admin-resource-row.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { AdminResourceRow } from "@/components/admin/admin-resource-row";
import { Table, TableBody, TableCell } from "@/components/ui/table";

describe("AdminResourceRow", () => {
  it("expands an accessible detail link across the interactive row", () => {
    render(
      <Table>
        <TableBody>
          <AdminResourceRow href="/admin/spaces/space-1" label="Sala Podcast">
            <TableCell>Sala Podcast</TableCell>
          </AdminResourceRow>
        </TableBody>
      </Table>,
    );

    const link = screen.getByRole("link", {
      name: "Ver detalle de Sala Podcast",
    });
    const row = screen.getByRole("row");

    expect(link).toHaveAttribute("href", "/admin/spaces/space-1");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(row).toHaveClass("relative", "cursor-pointer");
    expect(screen.getByText("Ver detalle")).toBeInTheDocument();
  });
});
```

**Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/components/admin/admin-resource-row.test.tsx
```

Expected: FAIL because `@/components/admin/admin-resource-row` does not exist.

**Step 3: Implement the minimal reusable row**

Create `src/components/admin/admin-resource-row.tsx`:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminResourceRowProps = {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminResourceRow({
  href,
  label,
  children,
  className,
}: AdminResourceRowProps) {
  return (
    <TableRow
      className={cn(
        "group relative cursor-pointer focus-within:bg-muted/50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring",
        className,
      )}
    >
      {children}
      <TableCell className="text-right">
        <Link
          href={href}
          aria-label={`Ver detalle de ${label}`}
          className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground outline-none transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:text-primary"
        >
          <span>Ver detalle</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
```

The real `Link` follows the Next.js 16 local guidance, supports keyboard activation and browser link behavior, and avoids turning the server-rendered list into a Client Component.

**Step 4: Run the test to verify it passes**

Run:

```powershell
npm test -- src/components/admin/admin-resource-row.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add src/components/admin/admin-resource-row.tsx src/components/admin/admin-resource-row.test.tsx
git commit -m "feat: add navigable admin resource row"
```

### Task 2: Make every space list row open its detail

**Files:**
- Create: `src/app/admin/spaces/page.test.tsx`
- Modify: `src/app/admin/spaces/page.tsx:1-150`

**Step 1: Write the failing page test**

Mock `requireStaffContext`, `canManageSpaces`, `listSpaces`, and `SpacesViewToggle` following the hoisted-mock pattern in `src/app/admin/users/page.test.tsx`. Render:

```tsx
render(await SpacesPage({ searchParams: Promise.resolve({}) }));

expect(
  screen.getByRole("link", { name: "Ver detalle de Sala Podcast" }),
).toHaveAttribute("href", "/admin/spaces/space-1");
```

Use a `listSpaces` fixture with `id`, `name`, `slug`, media arrays, status, quota cost, booking limits, and nullable description/image/capacity fields.

**Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/app/admin/spaces/page.test.tsx
```

Expected: FAIL because the current row only exposes the resource name as a small link and has no accessible whole-row detail target.

**Step 3: Replace the ordinary row with `AdminResourceRow`**

In `src/app/admin/spaces/page.tsx`:

- import `AdminResourceRow`
- remove the nested name-only `Link` from each data row
- render `AdminResourceRow` with `href={`/admin/spaces/${space.id}`}` and `label={space.name}`
- preserve all six existing data cells
- add a right-aligned `Acción` table header
- update the empty-state `colSpan`, if represented as a row in future refactoring
- keep the existing `Link` imports used by create-space actions

The name cell should render plain emphasized text because the shared row contributes the single semantic detail link.

**Step 4: Run the page and component tests**

Run:

```powershell
npm test -- src/app/admin/spaces/page.test.tsx src/components/admin/admin-resource-row.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add src/app/admin/spaces/page.tsx src/app/admin/spaces/page.test.tsx
git commit -m "feat: open space details from list rows"
```

### Task 3: Make every plan list row open its detail

**Files:**
- Create: `src/app/admin/plans/page.test.tsx`
- Modify: `src/app/admin/plans/page.tsx:1-85`

**Step 1: Write the failing page test**

Mock staff context, plan permission, and `listPlans`. Render the async page and assert:

```tsx
render(await PlansPage());

expect(
  screen.getByRole("link", { name: "Ver detalle de Plan Pro" }),
).toHaveAttribute("href", "/admin/plans/plan-1");
```

The fixture must include every field returned by `listPlans`, including timestamps and nullable booking limits/price.

**Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/app/admin/plans/page.test.tsx
```

Expected: FAIL because there is no accessible whole-row detail link.

**Step 3: Use `AdminResourceRow` in the plan table**

- import `AdminResourceRow`
- replace each ordinary data `TableRow`
- remove the name-only nested link
- pass `/admin/plans/${plan.id}` and `plan.name`
- add an `Acción` header
- change the empty-state `colSpan` from `5` to `6`
- preserve the create-plan `Link`

**Step 4: Run the focused tests**

Run:

```powershell
npm test -- src/app/admin/plans/page.test.tsx src/components/admin/admin-resource-row.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add src/app/admin/plans/page.tsx src/app/admin/plans/page.test.tsx
git commit -m "feat: open plan details from list rows"
```

### Task 4: Make every member list row open its detail

**Files:**
- Create: `src/app/admin/members/page.test.tsx`
- Modify: `src/app/admin/members/page.tsx:1-82`

**Step 1: Write the failing page test**

Mock staff context, member permission, and `listMembers`. Render and assert:

```tsx
render(await MembersPage());

expect(
  screen.getByRole("link", { name: "Ver detalle de Ana Pérez" }),
).toHaveAttribute("href", "/admin/members/member-1");
```

Include the member identity, status, optional plan name/quota, and plan end date in the fixture.

**Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/app/admin/members/page.test.tsx
```

Expected: FAIL because there is no accessible whole-row detail link.

**Step 3: Use `AdminResourceRow` in the member table**

- import `AdminResourceRow`
- replace each ordinary member data row
- remove the name-only link
- pass `/admin/members/${member.id}` and `member.fullName`
- add an `Acción` header
- change the empty-state `colSpan` from `5` to `6`
- preserve the new-member `Link`

**Step 4: Run the focused tests**

Run:

```powershell
npm test -- src/app/admin/members/page.test.tsx src/components/admin/admin-resource-row.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add src/app/admin/members/page.tsx src/app/admin/members/page.test.tsx
git commit -m "feat: open member details from list rows"
```

### Task 5: Regression and visual verification

**Files:**
- Modify only if verification reveals a defect in files already listed above.

**Step 1: Run all affected unit tests**

```powershell
npm test -- src/components/admin/admin-resource-row.test.tsx src/app/admin/spaces/page.test.tsx src/app/admin/plans/page.test.tsx src/app/admin/members/page.test.tsx src/components/spaces/admin-space-detail.test.tsx src/components/plans/admin-plan-detail.test.tsx src/components/member/admin-member-detail.test.tsx
```

Expected: all tests PASS with no warnings.

**Step 2: Run the full unit suite**

```powershell
npm test
```

Expected: all tests PASS.

**Step 3: Run lint**

```powershell
npm run lint
```

Expected: exit code 0 with no new errors.

**Step 4: Run the production build**

```powershell
npm run build
```

Expected: Next.js 16.2.1 build completes successfully.

**Step 5: Verify the interface in a real browser**

Start the app and inspect `/admin/spaces`, `/admin/plans`, and `/admin/members` using the browser skill. For one record in each table verify:

- the whole row displays pointer/hover feedback
- clicking the row opens the correct dynamic detail URL
- tab focus reaches `Ver detalle`
- pressing Enter opens the same URL
- the space card view still opens the correct space detail
- the detail page still exposes edit, hide/pause, reactivate/status, and delete safeguards

**Step 6: Commit any verification-only correction**

If a correction was required:

```powershell
git add <corrected-files>
git commit -m "fix: polish admin row navigation"
```

If no correction was required, do not create an empty commit.
