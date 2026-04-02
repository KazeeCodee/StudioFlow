# Booking Operations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add booking detail pages, unified history/audit visibility, and controlled rescheduling for admin/staff and members using the active plan cancellation window.

**Architecture:** Keep booking creation/cancellation rules as the source of truth and add a dedicated rescheduling service that reuses the same availability and quota checks. Expose the new behavior through booking detail pages for both admin and member portals, with ownership checks for members and timeline data built from booking status history plus audit logs.

**Tech Stack:** Next.js App Router, Server Actions, Drizzle ORM, Supabase Auth, Vitest, shadcn/ui

---

### Task 1: Define booking operation inputs and policy helpers

**Files:**
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/modules/bookings/schema.ts`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/services/bookings/booking-penalty.ts`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/services/bookings/booking-penalty.test.ts`

**Step 1: Write the failing test**
- Cover refund/penalty behavior before and after the plan cutoff.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/services/bookings/booking-penalty.test.ts`

**Step 3: Write minimal implementation**
- Add helper to determine if refund applies and expose reschedule input schema.

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/services/bookings/booking-penalty.test.ts`

### Task 2: Add booking detail queries and timeline data

**Files:**
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/modules/bookings/queries.ts`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/components/bookings/booking-detail.tsx`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/components/bookings/booking-detail.test.tsx`

**Step 1: Write the failing test**
- Cover detail rendering with summary, actions, and history entries.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/components/bookings/booking-detail.test.tsx`

**Step 3: Write minimal implementation**
- Add detail query, timeline normalization, and UI component.

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/components/bookings/booking-detail.test.tsx`

### Task 3: Implement booking reschedule service and action

**Files:**
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/services/bookings/create-booking.ts`
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/services/bookings/cancel-booking.ts`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/services/bookings/reschedule-booking.ts`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/services/bookings/reschedule-booking.test.ts`
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/modules/bookings/actions.ts`

**Step 1: Write the failing test**
- Cover reprogramming before cutoff, after cutoff, and member ownership.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/services/bookings/reschedule-booking.test.ts`

**Step 3: Write minimal implementation**
- Reuse booking validation, update timing/quota state, and write audit/history events.

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/services/bookings/reschedule-booking.test.ts`

### Task 4: Add booking detail pages and wire list navigation

**Files:**
- Create: `E:/Proyectos/GitHub/StudioFlow/src/app/admin/bookings/[bookingId]/page.tsx`
- Create: `E:/Proyectos/GitHub/StudioFlow/src/app/member/bookings/[bookingId]/page.tsx`
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/app/admin/bookings/page.tsx`
- Modify: `E:/Proyectos/GitHub/StudioFlow/src/app/member/bookings/page.tsx`

**Step 1: Write the failing test**
- Extend the booking detail component test expectations if needed.

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/components/bookings/booking-detail.test.tsx`

**Step 3: Write minimal implementation**
- Add pages, ownership guards, and links from booking lists.

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/components/bookings/booking-detail.test.tsx`

### Task 5: Verify the booking operations slice

**Files:**
- Modify only if verification exposes issues.

**Step 1: Run focused tests**
- Run: `npm test -- src/services/bookings/booking-penalty.test.ts src/services/bookings/reschedule-booking.test.ts src/components/bookings/booking-detail.test.tsx`

**Step 2: Run related booking tests**
- Run: `npm test -- src/services/bookings/calculate-booking-quota.test.ts src/services/bookings/check-availability.test.ts`

**Step 3: Run repo checks**
- Run: `npm run lint`
- Run: `npm run build`
