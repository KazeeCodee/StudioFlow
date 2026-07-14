import postgres from "postgres";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedProfile } from "@/modules/auth/types";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("INTEGRATION_DATABASE_URL is required for database integration tests.");
}

process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_POOL_MAX = "4";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://studioflow-test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "integration-test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "integration-test-service-role-key";

const sql = postgres(databaseUrl, { max: 4 });

const actorId = "00000000-0000-4000-8000-000000000301";
const memberId = "00000000-0000-4000-8000-000000000302";
const planId = "00000000-0000-4000-8000-000000000303";
const memberPlanId = "00000000-0000-4000-8000-000000000304";
const firstSpaceId = "00000000-0000-4000-8000-000000000305";
const secondSpaceId = "00000000-0000-4000-8000-000000000306";

const actor: AuthenticatedProfile = {
  id: actorId,
  email: "booking-concurrency@studioflow.invalid",
  fullName: "Booking Concurrency Test",
  role: "admin",
  status: "active",
};

function bookingInput(spaceId: string) {
  return {
    memberId,
    spaceId,
    startsAt: "2026-08-03T10:00",
    endsAt: "2026-08-03T11:00",
  };
}

async function clearBookings() {
  await sql`delete from public.bookings where member_id = ${memberId}`;
}

async function resetQuota(quota: number) {
  await sql`
    update public.member_plans
    set quota_total = ${quota}, quota_used = 0, quota_remaining = ${quota}
    where id = ${memberPlanId}
  `;
}

describe("concurrent booking creation", () => {
  beforeAll(async () => {
    await sql`
      insert into public.profiles (id, full_name, email, role)
      values (${actorId}, 'Booking Concurrency Test', 'booking-concurrency@studioflow.invalid', 'admin')
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.members (id, full_name, email)
      values (${memberId}, 'Concurrent Member', 'concurrent-member@studioflow.invalid')
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.plans (id, name, status, quota_amount)
      values (${planId}, 'Concurrent Plan', 'active', 10)
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.member_plans (
        id, member_id, plan_id, starts_at, ends_at, next_payment_due_at,
        quota_total, quota_used, quota_remaining
      ) values (
        ${memberPlanId}, ${memberId}, ${planId}, '2026-08-01T00:00:00Z',
        '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z', 10, 0, 10
      )
      on conflict (id) do nothing
    `;

    for (const [spaceId, slug] of [
      [firstSpaceId, "concurrency-space-one"],
      [secondSpaceId, "concurrency-space-two"],
    ] as const) {
      await sql`
        insert into public.spaces (
          id, name, slug, status, hourly_quota_cost, min_booking_hours, max_booking_hours
        ) values (${spaceId}, ${slug}, ${slug}, 'active', 1, 1, 8)
        on conflict (id) do nothing
      `;
      await sql`
        insert into public.space_availability_rules (
          space_id, day_of_week, start_time, end_time, is_active
        ) values (${spaceId}, 1, '00:00:00', '23:59:00', true)
      `;
    }
  });

  afterEach(async () => {
    await clearBookings();
    await resetQuota(10);
  });

  afterAll(async () => {
    await clearBookings();
    await sql`delete from public.space_availability_rules where space_id in (${firstSpaceId}, ${secondSpaceId})`;
    await sql`delete from public.spaces where id in (${firstSpaceId}, ${secondSpaceId})`;
    await sql`delete from public.member_plans where id = ${memberPlanId}`;
    await sql`delete from public.plans where id = ${planId}`;
    await sql`delete from public.members where id = ${memberId}`;
    await sql`delete from public.profiles where id = ${actorId}`;
    await sql.end();
  });

  it("returns one domain conflict when two requests overlap", async () => {
    await resetQuota(10);
    const { createBooking } = await import("@/services/bookings/create-booking");

    const results = await Promise.allSettled([
      createBooking(bookingInput(firstSpaceId), actor),
      createBooking(bookingInput(firstSpaceId), actor),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      reason: new Error("El espacio ya tiene una reserva superpuesta."),
    });
  });

  it("allows only one request to consume the last quota", async () => {
    await resetQuota(1);
    const { createBooking } = await import("@/services/bookings/create-booking");

    const results = await Promise.allSettled([
      createBooking(bookingInput(firstSpaceId), actor),
      createBooking(bookingInput(secondSpaceId), actor),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const [quota] = await sql`
      select quota_total, quota_used, quota_remaining
      from public.member_plans
      where id = ${memberPlanId}
    `;
    expect(quota).toMatchObject({ quota_total: 1, quota_used: 1, quota_remaining: 0 });
  });
});
