import type { User } from "@supabase/supabase-js";

export const appRoles = [
  "super_admin",
  "admin",
  "operator",
  "member",
] as const;

export type AppRole = (typeof appRoles)[number];

export type AuthenticatedProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  status: "active" | "inactive" | "suspended";
};

export type AuthContext = {
  user: User;
  profile: AuthenticatedProfile;
};
