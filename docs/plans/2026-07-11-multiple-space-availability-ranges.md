# Multiple Space Availability Ranges Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow a space to have multiple non-overlapping availability windows on the same weekday and offer members only duration-aware, conflict-free start times.

**Architecture:** Keep `space_availability_rules` as one row per active window, with zero rows meaning closed. A client-side weekly editor serializes a variable-length rule array that is validated again by Zod and persisted transactionally; booking validation accepts a request only when one window fully contains it. A dynamic authenticated Route Handler calculates available whole-hour starts from recurring windows, blocks, active bookings, and the global buffer, and the member form consumes that endpoint after space, date, and duration are selected.

**Tech Stack:** Next.js 16 App Router and Server Actions, React 19, TypeScript, Zod 4, Drizzle ORM/PostgreSQL, Vitest/Testing Library, Playwright.

---

## Implementation conventions

- Work in an isolated git worktree.
- Before editing Next.js code, reread `node_modules/next/dist/docs/01-app/02-guides/forms.md` and `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` as required by `AGENTS.md`.
- Use @test-driven-development for every behavior change and @verification-before-completion before declaring the feature complete.
- Use @impeccable while implementing the weekly editor and booking-slot states.
- Keep bookings on whole-hour boundaries. Half-hour durations and overnight windows are explicitly out of scope.
- Do not remove `is_active` in this change. Read only active rows; newly submitted availability contains active windows only.

### Task 1: Model and validate variable-length availability windows

**Files:**
- Modify: `src/modules/spaces/schema.ts:3-66`
- Modify: `src/modules/spaces/schema.test.ts`

**Step 1: Write failing schema tests**

Add focused cases proving that two separated Monday windows are accepted and overlapping, duplicated, inverted, malformed, or out-of-range windows are rejected:

```ts
const baseSpace = {
  name: "Estudio A",
  slug: "estudio-a",
  hourlyQuotaCost: 1,
  minBookingHours: 1,
  maxBookingHours: 4,
};

it("acepta varios rangos separados para el mismo dia", () => {
  const result = spaceSchema.safeParse({
    ...baseSpace,
    availabilityRules: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
      { dayOfWeek: 1, startTime: "14:00", endTime: "22:00", isActive: true },
    ],
  });

  expect(result.success).toBe(true);
});

it.each([
  ["superpuestos", [
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
    { dayOfWeek: 1, startTime: "11:00", endTime: "14:00", isActive: true },
  ]],
  ["duplicados", [
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
  ]],
  ["invertidos", [
    { dayOfWeek: 1, startTime: "18:00", endTime: "09:00", isActive: true },
  ]],
])("rechaza rangos %s", (_label, availabilityRules) => {
  expect(spaceSchema.safeParse({ ...baseSpace, availabilityRules }).success).toBe(false);
});
```

Also test `parseAvailabilityRulesField()` with valid JSON and malformed JSON.

**Step 2: Run the test and confirm failure**

Run: `npm test -- src/modules/spaces/schema.test.ts`

Expected: FAIL because the current schema requires exactly seven rules and does not validate ordering or overlap.

**Step 3: Implement the availability schemas and parser**

Export a strict time schema, a single-window schema, the array schema, the default active windows, and a FormData parser:

```ts
const availabilityTimeSchema = z.string().regex(
  /^(?:[01]\d|2[0-3]):[0-5]\d$/,
  "Usa un horario HH:mm valido.",
);

export const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    isActive: z.boolean().default(true),
    startTime: availabilityTimeSchema,
    endTime: availabilityTimeSchema,
  })
  .refine((rule) => rule.startTime < rule.endTime, {
    path: ["endTime"],
    message: "El fin debe ser posterior al inicio.",
  });

export const availabilityRulesSchema = z.array(availabilityRuleSchema).superRefine((rules, ctx) => {
  for (const day of weekdayOptions) {
    const ordered = rules
      .map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => rule.isActive && rule.dayOfWeek === day.value)
      .sort((a, b) => a.rule.startTime.localeCompare(b.rule.startTime));

    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].rule.startTime < ordered[index - 1].rule.endTime) {
        ctx.addIssue({
          code: "custom",
          path: [ordered[index].index, "startTime"],
          message: `${day.label}: los horarios no pueden superponerse.`,
        });
      }
    }
  }
});

export function parseAvailabilityRulesField(value: FormDataEntryValue | null) {
  try {
    return availabilityRulesSchema.parse(JSON.parse(String(value ?? "[]")));
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    throw new Error("La disponibilidad enviada no es valida.");
  }
}
```

Change `spaceSchema.availabilityRules` from `.length(7)` to `availabilityRulesSchema.default(defaultAvailabilityRules)`. Make `defaultAvailabilityRules` contain Monday through Saturday only, each active from `09:00` to `18:00`.

**Step 4: Run the schema tests**

Run: `npm test -- src/modules/spaces/schema.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/modules/spaces/schema.ts src/modules/spaces/schema.test.ts
git commit -m "feat: validate multiple space availability windows"
```

### Task 2: Add database safeguards for availability windows

**Files:**
- Modify: `src/lib/db/schema.ts:1-15,126-135`
- Create: `supabase/migrations/0005_multiple_space_availability_ranges.sql`
- Modify: `src/lib/db/schema.test.ts`

**Step 1: Write a failing schema metadata test**

Use `getTableConfig` from `drizzle-orm/pg-core` and assert that `spaceAvailabilityRules` exposes the weekday index and both check constraints:

```ts
it("protege los rangos de disponibilidad del espacio", () => {
  const config = getTableConfig(spaceAvailabilityRules);

  expect(config.indexes.map((index) => index.config.name)).toContain(
    "space_availability_rules_space_day_idx",
  );
  expect(config.checks.map((check) => check.name)).toEqual(
    expect.arrayContaining([
      "space_availability_rules_weekday_check",
      "space_availability_rules_time_order_check",
    ]),
  );
});
```

**Step 2: Run the test and confirm failure**

Run: `npm test -- src/lib/db/schema.test.ts`

Expected: FAIL because no index or checks exist.

**Step 3: Update the Drizzle table declaration**

Import `check` and `index` from `drizzle-orm/pg-core`, then add:

```ts
}, (table) => ({
  spaceDayIdx: index("space_availability_rules_space_day_idx").on(
    table.spaceId,
    table.dayOfWeek,
  ),
  weekdayCheck: check(
    "space_availability_rules_weekday_check",
    sql`${table.dayOfWeek} between 0 and 6`,
  ),
  timeOrderCheck: check(
    "space_availability_rules_time_order_check",
    sql`${table.startTime} < ${table.endTime}`,
  ),
}));
```

Do not add a unique `(space_id, day_of_week)` constraint because multiple rows per day are now intentional.

**Step 4: Add the SQL migration**

```sql
delete from public.space_availability_rules
where is_active = false;

alter table public.space_availability_rules
  drop constraint if exists space_availability_rules_weekday_check,
  add constraint space_availability_rules_weekday_check
    check (day_of_week between 0 and 6),
  drop constraint if exists space_availability_rules_time_order_check,
  add constraint space_availability_rules_time_order_check
    check (start_time < end_time);

create index if not exists space_availability_rules_space_day_idx
  on public.space_availability_rules (space_id, day_of_week);
```

Document in a SQL comment that inactive legacy rows are removed because absence now means closed.

**Step 5: Run schema tests and type checking through the build**

Run: `npm test -- src/lib/db/schema.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: successful production build.

**Step 6: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/schema.test.ts supabase/migrations/0005_multiple_space_availability_ranges.sql
git commit -m "feat: constrain space availability windows"
```

### Task 3: Build the weekly availability editor

**Files:**
- Create: `src/components/forms/weekly-availability-editor.tsx`
- Create: `src/components/forms/weekly-availability-editor.test.tsx`
- Modify: `src/components/forms/space-form.tsx:1-50,182-243`
- Modify: `src/components/forms/space-form.test.tsx`

**Step 1: Write failing interaction tests**

Cover these user-visible behaviors with Testing Library and `userEvent`:

```ts
it("agrega un segundo horario al mismo dia y lo serializa", async () => {
  const user = userEvent.setup();
  render(<WeeklyAvailabilityEditor initialRules={mondayMorning} />);

  await user.click(screen.getByRole("button", { name: /agregar horario para lunes/i }));
  const mondayRanges = screen.getAllByTestId("availability-range-1");

  expect(mondayRanges).toHaveLength(2);
  expect(screen.getByDisplayValue(/"dayOfWeek":1/)).toBeInTheDocument();
});

it("muestra un error y evita guardar rangos superpuestos", async () => {
  // Add 11:00-14:00 next to 08:00-12:00 and expect an aria-live overlap error.
});

it("cerrar un dia elimina sus rangos del valor enviado", async () => {
  // Toggle Monday closed and assert that the hidden JSON has no dayOfWeek 1 rows.
});
```

Keep an integration assertion in `space-form.test.tsx` that existing multiple Monday ranges are rendered when editing.

**Step 2: Run the tests and confirm failure**

Run: `npm test -- src/components/forms/weekly-availability-editor.test.tsx src/components/forms/space-form.test.tsx`

Expected: FAIL because `WeeklyAvailabilityEditor` does not exist.

**Step 3: Implement the client editor**

Create a `"use client"` component with local state grouped by weekday. Its public contract is:

```ts
type AvailabilityRuleValue = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

type WeeklyAvailabilityEditorProps = {
  initialRules?: AvailabilityRuleValue[];
};

export function WeeklyAvailabilityEditor({ initialRules }: WeeklyAvailabilityEditorProps) {
  // Normalize active initial rules, render weekday cards, and serialize valid ordered rows.
  return <input type="hidden" name="availabilityRules" value={JSON.stringify(serializedRules)} />;
}
```

Implementation requirements:

- initialize missing new-space values to Monday-Saturday `09:00-18:00`, Sunday closed;
- treat legacy inactive rows as closed and never serialize them;
- toggling a closed day open creates one `09:00-18:00` row;
- adding a row creates `09:00-18:00`, then lets the administrator edit it;
- each range has accessible `Desde`, `Hasta`, and `Eliminar` controls containing the weekday/range in their accessible names;
- sort only when serializing or on blur so inputs do not jump while typing;
- derive overlap/inversion errors with `availabilityRulesSchema.safeParse()`;
- render errors with `role="alert"` or `aria-live="polite"`;
- disable the parent submission when local availability is invalid. Accomplish this with a hidden invalid control or a validity-aware submit contract; do not rely only on visual text.

**Step 4: Replace the fixed editor in `SpaceForm`**

Import and render:

```tsx
<WeeklyAvailabilityEditor initialRules={defaultValues?.availabilityRules} />
```

Remove `getAvailabilityRule()` and the seven hard-coded checkbox/time rows. Keep the explanatory heading and mention that several ranges can be added to represent breaks.

**Step 5: Run component tests**

Run: `npm test -- src/components/forms/weekly-availability-editor.test.tsx src/components/forms/space-form.test.tsx src/components/spaces/admin-space-detail.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add src/components/forms/weekly-availability-editor.tsx src/components/forms/weekly-availability-editor.test.tsx src/components/forms/space-form.tsx src/components/forms/space-form.test.tsx
git commit -m "feat: add weekly availability range editor"
```

### Task 4: Persist variable availability arrays transactionally

**Files:**
- Modify: `src/modules/spaces/actions.ts:17-24,46-102,104-176`
- Create: `src/modules/spaces/actions.test.ts`

**Step 1: Write failing action tests with mocked dependencies**

Mock `requireStaffContext`, image resolution, redirects/revalidation, and `getDb`. Verify:

- create parses two Monday rows and inserts both with `isActive: true`;
- create inserts the space, its rules, and audit log through the same transaction object;
- update deletes previous rules and inserts the complete replacement inside its transaction;
- malformed JSON fails before any database write.

The core assertion should resemble:

```ts
expect(availabilityInsertValues).toHaveBeenCalledWith([
  expect.objectContaining({ dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true }),
  expect.objectContaining({ dayOfWeek: 1, startTime: "14:00", endTime: "22:00", isActive: true }),
]);
```

**Step 2: Run the test and confirm failure**

Run: `npm test -- src/modules/spaces/actions.test.ts`

Expected: FAIL because actions still call `readAvailabilityRules()` and create is not fully transactional.

**Step 3: Replace the fixed FormData reader**

Remove `readAvailabilityRules()`. Parse the hidden payload before `spaceSchema.parse()`:

```ts
const availabilityRules = parseAvailabilityRulesField(formData.get("availabilityRules"));

const input = spaceSchema.parse({
  // existing fields
  availabilityRules,
});
```

Normalize inserts to active rows only:

```ts
const availabilityValues = input.availabilityRules.map((rule) => ({
  spaceId,
  dayOfWeek: rule.dayOfWeek,
  startTime: rule.startTime,
  endTime: rule.endTime,
  isActive: true,
}));
```

**Step 4: Make creation atomic**

Move the space insert, availability insert, and audit insert into one `db.transaction()`. Skip the availability insert when the array is empty because Drizzle should not receive `.values([])`.

Keep update's delete-and-reinsert transaction, with the same empty-array guard. Preserve existing authorization, audit metadata, revalidation, and redirect behavior.

**Step 5: Run action and space tests**

Run: `npm test -- src/modules/spaces/actions.test.ts src/modules/spaces/schema.test.ts src/components/forms/space-form.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add src/modules/spaces/actions.ts src/modules/spaces/actions.test.ts
git commit -m "feat: persist multiple availability ranges atomically"
```

### Task 5: Validate bookings against any complete availability window

**Files:**
- Modify: `src/services/bookings/booking-validation.ts:47-76`
- Modify: `src/services/bookings/booking-validation.test.ts`
- Modify: `src/services/bookings/reschedule-booking.test.ts`

**Step 1: Write failing booking-window tests**

Add a shared split-Monday schedule and assert:

```ts
const splitMonday = [
  { dayOfWeek: 1, startTime: "08:00:00", endTime: "12:00:00", isActive: true },
  { dayOfWeek: 1, startTime: "14:00:00", endTime: "22:00:00", isActive: true },
];

it.each([
  ["2026-04-06T09:00", "2026-04-06T11:00"],
  ["2026-04-06T15:00", "2026-04-06T18:00"],
])("acepta una reserva contenida en cualquiera de los rangos", (start, end) => {
  const window = validateBookingWindow(start, end);
  expect(() => assertWithinAvailability({ ...window, availabilityRules: splitMonday })).not.toThrow();
});

it("rechaza una reserva que atraviesa la pausa", () => {
  const window = validateBookingWindow("2026-04-06T11:00", "2026-04-06T15:00");
  expect(() => assertWithinAvailability({ ...window, availabilityRules: splitMonday })).toThrow(
    /fuera del horario/i,
  );
});
```

Include exact-boundary acceptance (`08:00-12:00`) and gap rejection (`12:00-14:00`). Update the reschedule fixture to include multiple same-day rules so the existing service test covers compatibility.

**Step 2: Run tests and confirm the cross-gap case fails**

Run: `npm test -- src/services/bookings/booking-validation.test.ts src/services/bookings/reschedule-booking.test.ts`

Expected: at least the second-range or cross-gap expectations FAIL because the implementation uses `.find()`.

**Step 3: Implement containment across all active windows**

Replace the single rule lookup with:

```ts
const dayRules = availabilityRules.filter(
  (item) => item.dayOfWeek === dayOfWeek && item.isActive,
);

if (dayRules.length === 0) {
  throw new Error("El espacio no opera en el dia seleccionado.");
}

const isContained = dayRules.some((rule) => {
  const ruleStart = parseTimeToMinutes(rule.startTime);
  const ruleEnd = parseTimeToMinutes(rule.endTime);
  return bookingStart >= ruleStart && bookingEnd <= ruleEnd;
});

if (!isContained) {
  throw new Error("La reserva queda fuera del horario disponible del espacio.");
}
```

Do not combine adjacent or separated rules when validating one booking.

**Step 4: Run booking service tests**

Run: `npm test -- src/services/bookings/booking-validation.test.ts src/services/bookings/reschedule-booking.test.ts src/services/bookings/check-availability.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/services/bookings/booking-validation.ts src/services/bookings/booking-validation.test.ts src/services/bookings/reschedule-booking.test.ts
git commit -m "feat: validate bookings across split availability ranges"
```

### Task 6: Generate duration-aware, conflict-free start times

**Files:**
- Create: `src/services/bookings/generate-available-start-times.ts`
- Create: `src/services/bookings/generate-available-start-times.test.ts`
- Modify: `src/modules/bookings/queries.ts:122-143,249-319`
- Modify: `src/modules/bookings/schema.ts`

**Step 1: Write failing pure slot-generation tests**

Test a Monday with `08:00-12:00` and `14:00-22:00`:

- duration 2 returns `08:00, 09:00, 10:00, 14:00 ... 20:00`;
- it excludes `11:00`, `12:00`, `13:00`, and `21:00`;
- a `15:00-17:00` operational block removes starts that overlap it;
- a confirmed booking removes overlaps after the configured buffer is applied;
- a cancelled booking never reaches the generator because the query filters active statuses;
- a closed weekday returns an empty array.

```ts
expect(generateAvailableStartTimes({
  date: "2026-04-06",
  durationHours: 2,
  availabilityRules: splitMonday,
  blocks: [],
  bookings: [],
  bookingBufferHours: 0,
})).toEqual([
  "08:00", "09:00", "10:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
]);
```

**Step 2: Run the test and confirm failure**

Run: `npm test -- src/services/bookings/generate-available-start-times.test.ts`

Expected: FAIL because the module does not exist.

**Step 3: Implement the pure generator**

Use `parseStudioDateTimeInput()`, `getStudioDateTimeParts()`, `applyBookingBuffer()`, and `hasOverlap()` so slot calculation shares timezone and overlap semantics with booking creation.

```ts
export function generateAvailableStartTimes(input: {
  date: string;
  durationHours: number;
  availabilityRules: AvailabilityRule[];
  blocks: BookingInterval[];
  bookings: BookingInterval[];
  bookingBufferHours: number;
}): string[] {
  // Filter active rules for the studio weekday, iterate whole-hour candidates,
  // require candidate end <= rule end, reject block overlap, then reject
  // booking overlap after applying the global buffer. Return sorted HH:mm strings.
}
```

Deduplicate the returned strings defensively with `Set` before sorting.

**Step 4: Add request validation and query composition**

In `src/modules/bookings/schema.ts`, add:

```ts
export const bookingAvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationHours: z.coerce.number().int().min(1),
});
```

In `src/modules/bookings/queries.ts`, add `getAvailableStartTimesForSpace()` that:

1. loads `getSpaceBookingContext(spaceId)` and operational settings;
2. rejects missing or inactive spaces and durations outside the space limits;
3. creates studio-local day bounds with `parseStudioDateTimeInput(date + "T00:00")` and the next studio day;
4. fetches blocks overlapping the day and pending/confirmed bookings overlapping the day expanded by the buffer;
5. calls `generateAvailableStartTimes()` with the loaded rules and conflicts.

Keep database work in this query layer and the generator pure.

**Step 5: Add query tests with mocked database dependencies or extracted query collaborators**

Create a focused test section in `src/modules/bookings/queries.test.ts` only if the database builder can be mocked without brittle chained mocks. Otherwise, test the pure generator thoroughly here and cover query wiring through the Route Handler in Task 7. Do not duplicate implementation logic to make it testable.

**Step 6: Run service and schema tests**

Run: `npm test -- src/services/bookings/generate-available-start-times.test.ts src/modules/bookings/schema.test.ts`

Expected: PASS.

**Step 7: Commit**

```bash
git add src/services/bookings/generate-available-start-times.ts src/services/bookings/generate-available-start-times.test.ts src/modules/bookings/queries.ts src/modules/bookings/schema.ts src/modules/bookings/schema.test.ts
git commit -m "feat: calculate real booking start times"
```

### Task 7: Expose authenticated live availability

**Files:**
- Create: `src/app/api/member/spaces/[spaceId]/availability/route.ts`
- Create: `src/app/api/member/spaces/[spaceId]/availability/route.test.ts`

**Step 1: Write failing Route Handler tests**

Mock `requireMemberContext()` and `getAvailableStartTimesForSpace()`. Cover:

- valid date and duration return `{ startTimes: [...] }`;
- invalid query returns HTTP 400;
- the query service receives the route `spaceId` and parsed values;
- member authentication is invoked before returning availability;
- a known missing/inactive space maps to 404 and unexpected errors are not silently converted to empty availability.

```ts
const response = await GET(
  new NextRequest(
    "https://studioflow.test/api/member/spaces/space-1/availability?date=2026-04-06&durationHours=2",
  ),
  { params: Promise.resolve({ spaceId: "space-1" }) },
);

expect(await response.json()).toEqual({ startTimes: ["08:00", "14:00"] });
```

**Step 2: Run the test and confirm failure**

Run: `npm test -- "src/app/api/member/spaces/[spaceId]/availability/route.test.ts"`

Expected: FAIL because the route does not exist.

**Step 3: Implement the dynamic GET handler**

Follow the bundled Next.js 16 Route Handler guide. Read `request.nextUrl.searchParams`, await `context.params`, authenticate inside the handler, validate with `bookingAvailabilityQuerySchema.safeParse()`, and return `NextResponse.json()`.

```ts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ spaceId: string }> },
) {
  await requireMemberContext();
  const { spaceId } = await context.params;
  const parsed = bookingAvailabilityQuerySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    durationHours: request.nextUrl.searchParams.get("durationHours"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta de disponibilidad invalida." }, { status: 400 });
  }

  const startTimes = await getAvailableStartTimesForSpace({ spaceId, ...parsed.data });
  return NextResponse.json({ startTimes });
}
```

The route is dynamic by virtue of reading the request URL and database state; do not opt into caching.

**Step 4: Run route tests**

Run: `npm test -- "src/app/api/member/spaces/[spaceId]/availability/route.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add "src/app/api/member/spaces/[spaceId]/availability/route.ts" "src/app/api/member/spaces/[spaceId]/availability/route.test.ts"
git commit -m "feat: expose member slot availability"
```

### Task 8: Update the member booking experience

**Files:**
- Modify: `src/components/forms/smart-booking-form.tsx`
- Create: `src/components/forms/smart-booking-form.test.tsx`

**Step 1: Write failing component tests**

Mock `global.fetch` and cover:

- duration appears before start time;
- selecting space, date, and duration calls the new endpoint;
- start-time choices come only from `{ startTimes }`;
- changing space/date/duration clears the previously selected time;
- loading disables the start-time select and displays `Consultando horarios...`;
- empty results display `No quedan horarios disponibles para esta fecha y duracion`;
- fetch errors display a retryable error and do not enable confirmation;
- the hidden `startsAt` and `endsAt` fields reflect the selected whole-hour slot and duration.

**Step 2: Run the test and confirm failure**

Run: `npm test -- src/components/forms/smart-booking-form.test.tsx`

Expected: FAIL because the component currently derives all starts from the first weekly rule and renders start before duration.

**Step 3: Implement live availability state**

Replace `startTimeOptions` calculation with state:

```ts
const [startTimeOptions, setStartTimeOptions] = useState<string[]>([]);
const [isLoadingTimes, setIsLoadingTimes] = useState(false);
const [timesError, setTimesError] = useState<string | null>(null);
```

Use an effect keyed by `selectedSpaceId`, `selectedDate`, and `durationHours`. Fetch:

```ts
`/api/member/spaces/${selectedSpaceId}/availability?${new URLSearchParams({
  date: selectedDate,
  durationHours: String(durationHours),
})}`
```

Use `AbortController` and ignore aborted requests to prevent stale responses from replacing newer selections. Reset selected time before every request and on any upstream selection change.

**Step 4: Reorder and refine the UI**

Render controls as:

1. space;
2. enabled date within the existing 30-day window;
3. duration constrained by the space;
4. live available start time.

Show loading, empty, and error states next to step 4 using `aria-live="polite"`. Do not show the confirmation button until a live start time has been selected and both hidden datetime fields are populated. Update the helper copy so it no longer claims that conflicts are checked only after submit.

**Step 5: Run component tests**

Run: `npm test -- src/components/forms/smart-booking-form.test.tsx`

Expected: PASS.

**Step 6: Commit**

```bash
git add src/components/forms/smart-booking-form.tsx src/components/forms/smart-booking-form.test.tsx
git commit -m "feat: show live duration-aware booking times"
```

### Task 9: Cover the split schedule end to end

**Files:**
- Modify: `tests/e2e/support/studioflow-testkit.ts:320-350`
- Modify: `tests/e2e/studioflow-flows.spec.ts:40-85`

**Step 1: Extend the test fixture API**

Change `createSpace()` to accept optional availability windows:

```ts
availabilityRules?: Array<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}>;
```

When omitted, retain the current `08:00-22:00` all-week fixture. When supplied, insert only those active rows.

**Step 2: Update the existing booking flow for the new control order**

Select `#duration` before `#startTime` and wait for the requested live option:

```ts
await page.locator("#duration").selectOption("2");
await expect(page.locator("#startTime").locator(`option[value="${startTime}"]`)).toBeAttached();
await page.locator("#startTime").selectOption(startTime);
```

**Step 3: Add the split-Monday E2E case**

Create a future Monday deterministically, seed Monday `08:00-12:00` and `14:00-22:00`, then assert:

- `10:00` and `14:00` are available for a two-hour booking;
- `11:00`, `12:00`, `13:00`, and `21:00` are absent;
- booking `14:00-16:00` succeeds and consumes quota.

Do not depend on the workstation's current weekday; add a test-kit helper that returns the next requested studio weekday.

**Step 4: Run the focused E2E tests**

Run: `npx playwright test tests/e2e/studioflow-flows.spec.ts --grep "reserva|rangos separados"`

Expected: PASS against the configured test database.

If the external Supabase test host is unavailable, record the infrastructure failure and still run all unit/component tests; do not report E2E as passing.

**Step 5: Commit**

```bash
git add tests/e2e/support/studioflow-testkit.ts tests/e2e/studioflow-flows.spec.ts
git commit -m "test: cover split space availability schedule"
```

### Task 10: Final regression and documentation verification

**Files:**
- Modify only if behavior changed: `docs/plans/2026-07-11-multiple-space-availability-ranges-design.md`

**Step 1: Run the focused regression suite**

```bash
npm test -- \
  src/modules/spaces/schema.test.ts \
  src/lib/db/schema.test.ts \
  src/components/forms/weekly-availability-editor.test.tsx \
  src/components/forms/space-form.test.tsx \
  src/modules/spaces/actions.test.ts \
  src/services/bookings/booking-validation.test.ts \
  src/services/bookings/reschedule-booking.test.ts \
  src/services/bookings/generate-available-start-times.test.ts \
  src/components/forms/smart-booking-form.test.tsx \
  "src/app/api/member/spaces/[spaceId]/availability/route.test.ts"
```

Expected: all focused tests PASS.

**Step 2: Run the full unit suite**

Run: `npm test`

Expected: all test files PASS.

**Step 3: Run static verification**

Run: `npm run lint`

Expected: exit code 0 with no errors.

Run: `npm run build`

Expected: successful Next.js production build and type checking.

**Step 4: Apply and verify the migration in the intended environment**

Use the project's normal Supabase migration deployment workflow. Then verify read-only:

```sql
select space_id, day_of_week, start_time, end_time, is_active
from public.space_availability_rules
order by space_id, day_of_week, start_time;
```

Expected: active windows remain, inactive legacy rows are gone, and multiple rows can exist for the same space/day.

**Step 5: Manually verify responsive and accessible states**

At desktop and mobile widths, verify:

- two Monday ranges can be added, edited, removed, saved, and loaded again;
- overlap errors are announced and prevent submission;
- closed days submit no rows;
- the member flow exposes duration before live start time;
- loading, empty, API error, and successful slot states are legible;
- keyboard focus order follows the numbered booking steps.

**Step 6: Review the final diff and commit any verification-only adjustments**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: clean after final commits.

If documentation required correction:

```bash
git add docs/plans/2026-07-11-multiple-space-availability-ranges-design.md
git commit -m "docs: align availability range design with implementation"
```

