import postgres from "postgres";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("INTEGRATION_DATABASE_URL is required for database integration tests.");
}

const sql = postgres(databaseUrl, { max: 1 });

const memberId = "00000000-0000-4000-8000-000000000101";
const spaceId = "00000000-0000-4000-8000-000000000102";
const planId = "00000000-0000-4000-8000-000000000103";

async function expectSqlState(operation: () => Promise<unknown>, code: string) {
  try {
    await operation();
  } catch (error) {
    expect(error).toMatchObject({ code });
    return;
  }

  throw new Error(`Expected PostgreSQL error ${code}, but the statement succeeded.`);
}

async function clearTestRows() {
  await sql`delete from public.bookings where member_id = ${memberId}`;
  await sql`delete from public.member_plans where member_id = ${memberId}`;
}

describe("booking and quota database constraints", () => {
  beforeAll(async () => {
    await sql`
      insert into public.members (id, full_name, email)
      values (${memberId}, 'Constraint Test Member', 'constraint-test@studioflow.invalid')
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.spaces (id, name, slug)
      values (${spaceId}, 'Constraint Test Space', 'constraint-test-space')
      on conflict (id) do nothing
    `;
    await sql`
      insert into public.plans (id, name, quota_amount)
      values (${planId}, 'Constraint Test Plan', 10)
      on conflict (id) do nothing
    `;
  });

  afterEach(clearTestRows);

  afterAll(async () => {
    await clearTestRows();
    await sql`delete from public.plans where id = ${planId}`;
    await sql`delete from public.spaces where id = ${spaceId}`;
    await sql`delete from public.members where id = ${memberId}`;
    await sql.end();
  });

  it("rejects overlapping active bookings for the same space", async () => {
    await sql`
      insert into public.bookings (
        member_id, space_id, starts_at, ends_at,
        duration_hours, hourly_quota_cost, quota_consumed, status
      ) values (
        ${memberId}, ${spaceId}, '2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z',
        1, 1, 1, 'confirmed'
      )
    `;

    await expectSqlState(
      () => sql`
        insert into public.bookings (
          member_id, space_id, starts_at, ends_at,
          duration_hours, hourly_quota_cost, quota_consumed, status
        ) values (
          ${memberId}, ${spaceId}, '2026-08-03T10:30:00Z', '2026-08-03T11:30:00Z',
          1, 1, 1, 'pending'
        )
      `,
      "23P01",
    );
  });

  it("rejects booking windows whose end is not after their start", async () => {
    await expectSqlState(
      () => sql`
        insert into public.bookings (
          member_id, space_id, starts_at, ends_at,
          duration_hours, hourly_quota_cost, quota_consumed, status
        ) values (
          ${memberId}, ${spaceId}, '2026-08-03T12:00:00Z', '2026-08-03T11:00:00Z',
          1, 1, 1, 'confirmed'
        )
      `,
      "23514",
    );
  });

  it("rejects inconsistent member-plan quota snapshots", async () => {
    await expectSqlState(
      () => sql`
        insert into public.member_plans (
          member_id, plan_id, starts_at, ends_at, next_payment_due_at,
          quota_total, quota_used, quota_remaining
        ) values (
          ${memberId}, ${planId}, '2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z',
          '2026-09-01T00:00:00Z', 10, 6, 5
        )
      `,
      "23514",
    );
  });
});
