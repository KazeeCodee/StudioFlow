import { expect, test } from "@playwright/test";
import {
  createStudioFlowTestKit,
  getFutureStudioSlot,
} from "./support/studioflow-testkit";

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test("alta de miembro desde admin crea acceso y plan inicial", async ({ page }, testInfo) => {
  const kit = await createStudioFlowTestKit(testInfo);

  try {
    const admin = await kit.createStaffUser({ role: "admin" });
    const plan = await kit.createPlan();
    const memberEmail = `${kit.prefix}-alta@studioflow.dev`;
    const memberPassword = "Member1234!";

    await kit.login(page, admin.email, admin.password);
    await page.goto("/admin/members/new");
    await page.locator("#fullName").fill("Miembro Alta E2E");
    await page.locator("#email").fill(memberEmail);
    await page.locator("#phone").fill("+54 11 5555 1111");
    await page.locator("#password").fill(memberPassword);
    await page.locator("#planId").selectOption(plan.id);
    await page.locator("#notes").fill("Alta automatizada E2E");
    await page.getByRole("button", { name: /crear miembro/i }).click();

    await expect.poll(async () => Boolean(await kit.findMemberByEmail(memberEmail))).toBe(true);

    await kit.trackMemberByEmail(memberEmail);
    await page.goto("/admin/members");
    await expect(page.getByText(memberEmail)).toBeVisible();
    await expect(page.getByText("Miembro Alta E2E")).toBeVisible();

    await kit.login(page, memberEmail, memberPassword);
    await page.goto("/member/plan");
    await expect(page.getByText(plan.name)).toBeVisible();
  } finally {
    await kit.cleanup();
  }
});

test("miembro reserva un espacio y consume cupos", async ({ page }, testInfo) => {
  const kit = await createStudioFlowTestKit(testInfo);

  try {
    const plan = await kit.createPlan({ quotaAmount: 10 });
    const space = await kit.createSpace({ hourlyQuotaCost: 2 });
    const member = await kit.createMember({ planId: plan.id, quotaTotal: 10 });
    const slot = getFutureStudioSlot({ daysFromNow: 3, durationHours: 2, startHour: 10 });

    await kit.login(page, member.email, member.password);
    await page.goto("/member/bookings/new");
    await page.locator("#spaceId").selectOption(space.id);
    await page.locator("#date").selectOption(slot.startsAtInput.slice(0, 10));
    await page.locator("#startTime").selectOption(slot.startsAtInput.slice(11, 16));
    await page.locator("#duration").selectOption("2");
    await page.getByRole("button", { name: /confirmar.*reserva/i }).click();
    await expect(page).toHaveURL(/\/member\/bookings(?:\/|$)/, {
      timeout: 20_000,
    });

    await expect.poll(async () => Boolean(await kit.findLatestBookingForMember(member.memberId)), {
      timeout: 20_000,
    }).toBe(true);
    const booking = await kit.findLatestBookingForMember(member.memberId);
    expect(booking?.status).toBe("confirmed");
    if (booking) {
      kit.trackBooking(booking.id);
    }

    await expect.poll(async () => (await kit.getMemberPlan(member.memberPlanId))?.quotaRemaining).toBe(6);
    const memberPlan = await kit.getMemberPlan(member.memberPlanId);
    expect(memberPlan?.quotaRemaining).toBe(6);
    expect(memberPlan?.quotaUsed).toBe(4);

    await expect(page.getByRole("cell", { name: space.name })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("cell", { name: "confirmed" })).toBeVisible({
      timeout: 20_000,
    });
  } finally {
    await kit.cleanup();
  }
});

test("miembro cancela antes de la politica y recupera los cupos", async ({ page }, testInfo) => {
  const kit = await createStudioFlowTestKit(testInfo);

  try {
    const plan = await kit.createPlan({ quotaAmount: 10, cancellationPolicyHours: 24 });
    const space = await kit.createSpace({ hourlyQuotaCost: 2 });
    const member = await kit.createMember({
      planId: plan.id,
      quotaTotal: 10,
      quotaRemaining: 6,
      quotaUsed: 4,
    });
    const slot = getFutureStudioSlot({ daysFromNow: 4, durationHours: 2, startHour: 9 });
    const booking = await kit.createBooking({
      memberId: member.memberId,
      memberPlanId: member.memberPlanId,
      spaceId: space.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      hourlyQuotaCost: 2,
      quotaConsumed: 4,
      createdBy: member.profileId,
    });

    await kit.login(page, member.email, member.password);
    await page.goto(`/member/bookings/${booking.id}`);
    await page.locator("#cancel-reason").fill("No voy a poder asistir");
    await page.getByRole("button", { name: /cancelar reserva/i }).click();

    await expect.poll(async () => (await kit.getBooking(booking.id))?.status).toBe("cancelled_by_user");
    const cancelledBooking = await kit.getBooking(booking.id);
    expect(cancelledBooking?.status).toBe("cancelled_by_user");

    await expect.poll(async () => (await kit.getMemberPlan(member.memberPlanId))?.quotaRemaining).toBe(10);
    const memberPlan = await kit.getMemberPlan(member.memberPlanId);
    expect(memberPlan?.quotaRemaining).toBe(10);
    expect(memberPlan?.quotaUsed).toBe(0);

    await page.goto("/member/plan");
    await expect(page.getByText("de 10 disponibles")).toBeVisible();
  } finally {
    await kit.cleanup();
  }
});

test("admin registra una renovacion manual y reinicia cupos del plan", async ({ page }, testInfo) => {
  const kit = await createStudioFlowTestKit(testInfo);

  try {
    const admin = await kit.createStaffUser({ role: "admin" });
    const plan = await kit.createPlan({ quotaAmount: 12, durationValue: 1, durationType: "monthly" });
    const member = await kit.createMember({
      planId: plan.id,
      quotaTotal: 12,
      quotaRemaining: 1,
      quotaUsed: 11,
      nextPaymentDueAt: kit.addDays(new Date(), 2),
      endsAt: kit.addDays(new Date(), 2),
    });

    await kit.login(page, admin.email, admin.password);
    await page.goto("/admin/renewals");
    const renewalRow = page.locator("tr").filter({ hasText: member.email });
    await page.locator(`#notes-${member.memberPlanId}`).fill("Pago validado por E2E");
    await renewalRow.getByRole("button", { name: /renovar/i }).click();

    await expect.poll(async () => (await kit.getMemberPlan(member.memberPlanId))?.quotaRemaining).toBe(12);
    const memberPlan = await kit.getMemberPlan(member.memberPlanId);
    expect(memberPlan?.quotaRemaining).toBe(12);
    expect(memberPlan?.quotaUsed).toBe(0);
    expect(memberPlan?.renewedManually).toBe(true);

    await expect.poll(async () => Boolean(await kit.findLatestRenewalForMemberPlan(member.memberPlanId))).toBe(true);
    const renewal = await kit.findLatestRenewalForMemberPlan(member.memberPlanId);
    expect(renewal?.notes).toBe("Pago validado por E2E");

    await expect(page.locator("tr").filter({ hasText: member.email }).first()).toBeVisible();
  } finally {
    await kit.cleanup();
  }
});
