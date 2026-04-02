"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageStaffUsers } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { staffUserSchema, staffUserUpdateSchema } from "@/modules/auth/schema";
import type { AppRole } from "@/modules/auth/types";
import { createStaffUser } from "@/services/staff-users/create-staff-user";
import { updateStaffUser } from "@/services/staff-users/update-staff-user";

function assertCanManageStaffUsers(role: AppRole) {
  if (!canManageStaffUsers(role)) {
    redirect("/admin");
  }
}

function revalidateStaffUserPaths() {
  revalidatePath("/admin/users");
}

export async function createStaffUserAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageStaffUsers(profile.role);

  const input = staffUserSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    status: formData.get("status"),
    password: formData.get("password"),
  });

  await createStaffUser(input, profile);
  revalidateStaffUserPaths();
  redirect("/admin/users");
}

export async function updateStaffUserAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageStaffUsers(profile.role);

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    throw new Error("Falta el usuario interno a actualizar.");
  }

  const input = staffUserUpdateSchema.parse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    status: formData.get("status"),
    password: formData.get("password"),
  });

  await updateStaffUser(
    {
      userId,
      input,
    },
    profile,
  );

  revalidateStaffUserPaths();
  redirect("/admin/users");
}
