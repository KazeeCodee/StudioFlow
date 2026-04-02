import { asc, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { staffRoles } from "@/lib/permissions/roles";

export async function listStaffUsers() {
  const db = getDb();

  return db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
      role: profiles.role,
      status: profiles.status,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(inArray(profiles.role, [...staffRoles]))
    .orderBy(asc(profiles.fullName));
}
