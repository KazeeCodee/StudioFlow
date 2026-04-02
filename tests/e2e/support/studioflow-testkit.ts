import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page, type TestInfo } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { getStudioDateTimeParts, parseStudioDateTimeInput } from "@/lib/datetime";

type LoadedEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
};

type StaffRole = "super_admin" | "admin" | "operator";
type DurationType = "weekly" | "monthly" | "custom";

type CreatedStaffUser = {
  profileId: string;
  email: string;
  password: string;
  fullName: string;
};

type CreatedPlan = {
  id: string;
  name: string;
};

type CreatedSpace = {
  id: string;
  name: string;
  slug: string;
};

type CreatedMember = {
  profileId: string;
  memberId: string;
  memberPlanId: string;
  email: string;
  password: string;
  fullName: string;
};

type CreatedBooking = {
  id: string;
};

let cachedEnv: LoadedEnv | null = null;
let cachedSql: postgres.Sql | null = null;
let cachedAdminClient: ReturnType<typeof createClient> | null = null;

function loadEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  const envFile = readFileSync(envPath, "utf8");
  const parsed = new Map<string, string>();

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    parsed.set(key, value);
  }

  const getValue = (key: keyof LoadedEnv) => process.env[key] ?? parsed.get(key);
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: getValue("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: getValue("SUPABASE_SERVICE_ROLE_KEY"),
    DATABASE_URL: getValue("DATABASE_URL"),
  };

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.DATABASE_URL) {
    throw new Error("Faltan variables requeridas para correr los E2E.");
  }

  cachedEnv = env as LoadedEnv;
  return cachedEnv;
}

function getSql() {
  if (cachedSql) {
    return cachedSql;
  }

  cachedSql = postgres(loadEnv().DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  return cachedSql;
}

function getAdminClient() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const env = loadEnv();
  cachedAdminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return cachedAdminClient;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildStudioDateInput({
  dayOffset,
  hour,
  minute = 0,
}: {
  dayOffset: number;
  hour: number;
  minute?: number;
}) {
  const anchor = new Date();
  anchor.setDate(anchor.getDate() + dayOffset);
  const parts = getStudioDateTimeParts(anchor);

  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}T${hour
    .toString()
    .padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function getFutureStudioSlot({
  daysFromNow,
  startHour,
  durationHours,
}: {
  daysFromNow: number;
  startHour: number;
  durationHours: number;
}) {
  const startsAtInput = buildStudioDateInput({
    dayOffset: daysFromNow,
    hour: startHour,
  });
  const endsAtInput = buildStudioDateInput({
    dayOffset: daysFromNow,
    hour: startHour + durationHours,
  });

  return {
    startsAtInput,
    endsAtInput,
    startsAt: parseStudioDateTimeInput(startsAtInput),
    endsAt: parseStudioDateTimeInput(endsAtInput),
  };
}

export class StudioFlowTestKit {
  readonly prefix: string;

  private readonly sql = getSql();

  private readonly adminClient = getAdminClient();

  private readonly trackedAuthUserIds = new Set<string>();

  private readonly trackedProfileIds = new Set<string>();

  private readonly trackedMemberIds = new Set<string>();

  private readonly trackedMemberPlanIds = new Set<string>();

  private readonly trackedPlanIds = new Set<string>();

  private readonly trackedSpaceIds = new Set<string>();

  private readonly trackedBookingIds = new Set<string>();

  constructor(testInfo: TestInfo) {
    this.prefix = slugify(`e2e-${testInfo.title}-${randomUUID().slice(0, 8)}`);
  }

  addDays(baseDate: Date, days: number) {
    const result = new Date(baseDate);
    result.setDate(result.getDate() + days);
    return result;
  }

  private async createAuthUser({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName: string;
  }) {
    const result = await this.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (result.error || !result.data.user) {
      throw new Error(result.error?.message ?? "No se pudo crear el usuario de prueba.");
    }

    this.trackedAuthUserIds.add(result.data.user.id);
    return result.data.user.id;
  }

  async createStaffUser({
    role,
    fullName = "Admin E2E",
    password = "Admin1234!",
  }: {
    role: StaffRole;
    fullName?: string;
    password?: string;
  }) {
    const email = `${this.prefix}-${role}@studioflow.dev`;
    const authUserId = await this.createAuthUser({
      email,
      password,
      fullName,
    });

    await this.sql`
      insert into profiles (id, full_name, email, role, status)
      values (${authUserId}, ${fullName}, ${email}, ${role}, 'active')
    `;

    this.trackedProfileIds.add(authUserId);

    return {
      profileId: authUserId,
      email,
      password,
      fullName,
    } satisfies CreatedStaffUser;
  }

  async createPlan({
    quotaAmount = 10,
    cancellationPolicyHours = 24,
    durationType = "monthly",
    durationValue = 1,
  }: {
    quotaAmount?: number;
    cancellationPolicyHours?: number;
    durationType?: DurationType;
    durationValue?: number;
  } = {}) {
    const name = `${this.prefix}-plan`;
    const [plan] = await this.sql<{ id: string; name: string }[]>`
      insert into plans (
        name,
        description,
        status,
        duration_type,
        duration_value,
        quota_amount,
        cancellation_policy_hours
      )
      values (
        ${name},
        'Plan E2E',
        'active',
        ${durationType},
        ${durationValue},
        ${quotaAmount},
        ${cancellationPolicyHours}
      )
      returning id, name
    `;

    this.trackedPlanIds.add(plan.id);
    return plan satisfies CreatedPlan;
  }

  async createSpace({
    hourlyQuotaCost = 2,
    minBookingHours = 1,
    maxBookingHours = 4,
  }: {
    hourlyQuotaCost?: number;
    minBookingHours?: number;
    maxBookingHours?: number;
  } = {}) {
    const slug = `${this.prefix}-space`;
    const name = `${this.prefix} Space`;
    const [space] = await this.sql<{ id: string; name: string; slug: string }[]>`
      insert into spaces (
        name,
        slug,
        description,
        status,
        hourly_quota_cost,
        min_booking_hours,
        max_booking_hours
      )
      values (
        ${name},
        ${slug},
        'Espacio E2E',
        'active',
        ${hourlyQuotaCost},
        ${minBookingHours},
        ${maxBookingHours}
      )
      returning id, name, slug
    `;

    this.trackedSpaceIds.add(space.id);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      await this.sql`
        insert into space_availability_rules (space_id, day_of_week, start_time, end_time, is_active)
        values (${space.id}, ${dayOfWeek}, '08:00', '22:00', true)
      `;
    }

    return space satisfies CreatedSpace;
  }

  async createMember({
    planId,
    fullName = "Miembro E2E",
    password = "Member1234!",
    quotaTotal = 10,
    quotaRemaining = quotaTotal,
    quotaUsed = 0,
    nextPaymentDueAt = this.addDays(new Date(), 14),
    endsAt = this.addDays(new Date(), 14),
  }: {
    planId: string;
    fullName?: string;
    password?: string;
    quotaTotal?: number;
    quotaRemaining?: number;
    quotaUsed?: number;
    nextPaymentDueAt?: Date;
    endsAt?: Date;
  }) {
    const email = `${this.prefix}-member@studioflow.dev`;
    const authUserId = await this.createAuthUser({
      email,
      password,
      fullName,
    });

    const [profile] = await this.sql<{ id: string }[]>`
      insert into profiles (id, full_name, email, role, status)
      values (${authUserId}, ${fullName}, ${email}, 'member', 'active')
      returning id
    `;

    const [member] = await this.sql<{ id: string }[]>`
      insert into members (profile_id, full_name, email, status)
      values (${profile.id}, ${fullName}, ${email}, 'active')
      returning id
    `;

    const [memberPlan] = await this.sql<{ id: string }[]>`
      insert into member_plans (
        member_id,
        plan_id,
        status,
        starts_at,
        ends_at,
        next_payment_due_at,
        quota_total,
        quota_remaining,
        quota_used
      )
      values (
        ${member.id},
        ${planId},
        'active',
        now(),
        ${endsAt},
        ${nextPaymentDueAt},
        ${quotaTotal},
        ${quotaRemaining},
        ${quotaUsed}
      )
      returning id
    `;

    this.trackedProfileIds.add(profile.id);
    this.trackedMemberIds.add(member.id);
    this.trackedMemberPlanIds.add(memberPlan.id);

    return {
      profileId: profile.id,
      memberId: member.id,
      memberPlanId: memberPlan.id,
      email,
      password,
      fullName,
    } satisfies CreatedMember;
  }

  async createBooking({
    memberId,
    memberPlanId,
    spaceId,
    startsAt,
    endsAt,
    hourlyQuotaCost,
    quotaConsumed,
    createdBy,
  }: {
    memberId: string;
    memberPlanId: string;
    spaceId: string;
    startsAt: Date;
    endsAt: Date;
    hourlyQuotaCost: number;
    quotaConsumed: number;
    createdBy: string;
  }) {
    const durationHours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
    const [booking] = await this.sql<{ id: string }[]>`
      insert into bookings (
        member_id,
        space_id,
        member_plan_id,
        starts_at,
        ends_at,
        duration_hours,
        hourly_quota_cost,
        quota_consumed,
        status,
        created_by
      )
      values (
        ${memberId},
        ${spaceId},
        ${memberPlanId},
        ${startsAt},
        ${endsAt},
        ${durationHours},
        ${hourlyQuotaCost},
        ${quotaConsumed},
        'confirmed',
        ${createdBy}
      )
      returning id
    `;

    await this.sql`
      insert into booking_status_history (booking_id, new_status, changed_by, note)
      values (${booking.id}, 'confirmed', ${createdBy}, 'Reserva creada')
    `;

    this.trackedBookingIds.add(booking.id);

    return booking satisfies CreatedBooking;
  }

  async login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/contrase/i).fill(password);
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/(admin|member)(\/|$)/, {
      timeout: 40_000,
    });
  }

  async findMemberByEmail(email: string) {
    const [member] = await this.sql<{
      memberId: string;
      profileId: string | null;
      memberPlanId: string | null;
      email: string;
    }[]>`
      select
        m.id as "memberId",
        m.profile_id as "profileId",
        mp.id as "memberPlanId",
        m.email
      from members m
      left join member_plans mp
        on mp.member_id = m.id and mp.status = 'active'
      where m.email = ${email}
      limit 1
    `;

    return member ?? null;
  }

  async trackMemberByEmail(email: string) {
    const member = await this.findMemberByEmail(email);

    if (member?.profileId) {
      this.trackedAuthUserIds.add(member.profileId);
      this.trackedProfileIds.add(member.profileId);
    }

    if (member?.memberId) {
      this.trackedMemberIds.add(member.memberId);
    }

    if (member?.memberPlanId) {
      this.trackedMemberPlanIds.add(member.memberPlanId);
    }
  }

  trackBooking(bookingId: string) {
    this.trackedBookingIds.add(bookingId);
  }

  async getMemberPlan(memberPlanId: string) {
    const [memberPlan] = await this.sql<{
      id: string;
      quotaRemaining: number;
      quotaUsed: number;
      renewedManually: boolean;
      nextPaymentDueAt: Date;
      endsAt: Date;
    }[]>`
      select
        id,
        quota_remaining as "quotaRemaining",
        quota_used as "quotaUsed",
        renewed_manually as "renewedManually",
        next_payment_due_at as "nextPaymentDueAt",
        ends_at as "endsAt"
      from member_plans
      where id = ${memberPlanId}
      limit 1
    `;

    return memberPlan ?? null;
  }

  async findLatestBookingForMember(memberId: string) {
    const [booking] = await this.sql<{
      id: string;
      status: string;
      quotaConsumed: number;
    }[]>`
      select
        id,
        status,
        quota_consumed as "quotaConsumed"
      from bookings
      where member_id = ${memberId}
      order by created_at desc
      limit 1
    `;

    return booking ?? null;
  }

  async getBooking(bookingId: string) {
    const [booking] = await this.sql<{
      id: string;
      status: string;
      cancellationReason: string | null;
    }[]>`
      select
        id,
        status,
        cancellation_reason as "cancellationReason"
      from bookings
      where id = ${bookingId}
      limit 1
    `;

    return booking ?? null;
  }

  async findLatestRenewalForMemberPlan(memberPlanId: string) {
    const [renewal] = await this.sql<{
      id: string;
      notes: string | null;
    }[]>`
      select id, notes
      from renewals
      where member_plan_id = ${memberPlanId}
      order by renewed_at desc
      limit 1
    `;

    return renewal ?? null;
  }

  async cleanup() {
    await this.sql`delete from notification_deliveries where recipient_email like ${`${this.prefix}%`}`;

    for (const bookingId of this.trackedBookingIds) {
      await this.sql`delete from audit_logs where entity_id = ${bookingId}`;
      await this.sql`delete from bookings where id = ${bookingId}`;
    }

    for (const memberPlanId of this.trackedMemberPlanIds) {
      await this.sql`delete from audit_logs where entity_id = ${memberPlanId}`;
    }

    for (const memberId of this.trackedMemberIds) {
      await this.sql`delete from audit_logs where entity_id = ${memberId}`;
      await this.sql`delete from members where id = ${memberId}`;
    }

    for (const profileId of this.trackedProfileIds) {
      await this.sql`delete from audit_logs where actor_id = ${profileId}`;
      await this.sql`delete from profiles where id = ${profileId}`;
    }

    for (const spaceId of this.trackedSpaceIds) {
      await this.sql`delete from audit_logs where entity_id = ${spaceId}`;
      await this.sql`delete from spaces where id = ${spaceId}`;
    }

    for (const planId of this.trackedPlanIds) {
      await this.sql`delete from audit_logs where entity_id = ${planId}`;
      await this.sql`delete from plans where id = ${planId}`;
    }

    for (const authUserId of this.trackedAuthUserIds) {
      await this.adminClient.auth.admin.deleteUser(authUserId);
    }
  }
}

export async function createStudioFlowTestKit(testInfo: TestInfo) {
  return new StudioFlowTestKit(testInfo);
}
