import type { AppRole } from "@/modules/auth/types";

export const staffRoles: AppRole[] = ["super_admin", "admin", "operator"];
export const configManagerRoles: AppRole[] = ["super_admin", "admin"];
export const memberRoles: AppRole[] = ["member"];

export function isStaffRole(role: AppRole) {
  return staffRoles.includes(role);
}

export function canAccessAdmin(role: AppRole) {
  return isStaffRole(role);
}

export function canAccessMemberPortal(role: AppRole) {
  return memberRoles.includes(role);
}

export function getDefaultRouteForRole(role: AppRole) {
  return isStaffRole(role) ? "/admin" : "/member";
}
