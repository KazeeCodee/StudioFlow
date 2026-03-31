import type { AppRole } from "@/modules/auth/types";
import {
  canAccessAdmin,
  canAccessMemberPortal,
  configManagerRoles,
  getDefaultRouteForRole,
  isStaffRole,
} from "@/lib/permissions/roles";

export function canManagePlans(role: AppRole) {
  return isStaffRole(role);
}

export function canManageMembers(role: AppRole) {
  return isStaffRole(role);
}

export function canManageSpaces(role: AppRole) {
  return isStaffRole(role);
}

export function canManageBookings(role: AppRole) {
  return isStaffRole(role);
}

export function canManageSettings(role: AppRole) {
  return configManagerRoles.includes(role);
}

export function canRenewPlans(role: AppRole) {
  return configManagerRoles.includes(role);
}

export function canViewAdmin(role: AppRole) {
  return canAccessAdmin(role);
}

export function canViewMemberPortal(role: AppRole) {
  return canAccessMemberPortal(role);
}

export { getDefaultRouteForRole };
