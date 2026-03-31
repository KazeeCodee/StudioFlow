"use server";

import { revalidatePath } from "next/cache";
import { requireStaffContext } from "@/modules/auth/queries";
import { memberSchema } from "@/modules/members/schema";
import { createMemberWithPlan } from "@/services/members/create-member-with-plan";

export async function createMemberAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const input = memberSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    status: formData.get("status"),
    planId: formData.get("planId"),
    notes: formData.get("notes"),
  });

  await createMemberWithPlan(input, profile);

  revalidatePath("/admin/members");
  revalidatePath("/admin/members/new");
}
