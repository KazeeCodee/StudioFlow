import { expect, test } from "@playwright/test";
import { createStudioFlowTestKit } from "./support/studioflow-testkit";

test("prioriza vencidos, busca miembros y conserva la accion en movil", async ({ page }, testInfo) => {
  const kit = await createStudioFlowTestKit(testInfo);

  try {
    const admin = await kit.createStaffUser({ role: "admin" });
    const plan = await kit.createPlan({ quotaAmount: 8, durationType: "monthly", durationValue: 1 });
    const member = await kit.createMember({
      planId: plan.id,
      fullName: "Renovacion Movil E2E",
      nextPaymentDueAt: kit.addDays(new Date(), -3),
      endsAt: kit.addDays(new Date(), -3),
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await kit.login(page, admin.email, admin.password);
    await page.goto("/admin/renewals?view=pending");

    await expect(page.getByText(member.email)).toBeVisible();
    await expect(page.getByText("Vencido")).toBeVisible();
    await expect(page.getByRole("button", { name: `Revisar pago de ${member.fullName}` })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByLabel("Buscar renovaciones").fill(member.email);
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText(member.email)).toBeVisible();
  } finally {
    await kit.cleanup();
  }
});

test("un plan futuro aparece en Todos pero no en Pendientes", async ({ page }, testInfo) => {
  const kit = await createStudioFlowTestKit(testInfo);

  try {
    const admin = await kit.createStaffUser({ role: "admin" });
    const plan = await kit.createPlan({ quotaAmount: 8 });
    const member = await kit.createMember({
      planId: plan.id,
      fullName: "Renovacion Futura E2E",
      nextPaymentDueAt: kit.addDays(new Date(), 30),
      endsAt: kit.addDays(new Date(), 30),
    });

    await kit.login(page, admin.email, admin.password);
    await page.goto("/admin/renewals?view=pending");
    await expect(page.getByText(member.email)).toHaveCount(0);

    await page.getByRole("link", { name: /Todos los planes/ }).click();
    await expect(page.getByText(member.email)).toBeVisible();
    await expect(page.getByText("Futuro")).toBeVisible();
  } finally {
    await kit.cleanup();
  }
});
