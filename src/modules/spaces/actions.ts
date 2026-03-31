"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { auditLogs, spaceAvailabilityRules, spaceBlocks, spaces } from "@/lib/db/schema";
import { requireStaffContext } from "@/modules/auth/queries";
import { spaceBlockSchema, spaceSchema } from "@/modules/spaces/schema";
import { slugify } from "@/lib/utils";

function readAvailabilityRules(formData: FormData) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isActive: formData.get(`availability-${dayOfWeek}-enabled`) === "on",
    startTime: String(formData.get(`availability-${dayOfWeek}-start`) ?? "09:00"),
    endTime: String(formData.get(`availability-${dayOfWeek}-end`) ?? "18:00"),
  }));
}

export async function createSpaceAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const input = spaceSchema.parse({
    name: formData.get("name"),
    slug: slugify(String(formData.get("name") ?? "")),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    capacity: formData.get("capacity"),
    status: formData.get("status"),
    hourlyQuotaCost: formData.get("hourlyQuotaCost"),
    minBookingHours: formData.get("minBookingHours"),
    maxBookingHours: formData.get("maxBookingHours"),
    availabilityRules: readAvailabilityRules(formData),
  });

  const db = getDb();

  const [space] = await db
    .insert(spaces)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      imageUrl: input.imageUrl || null,
      capacity: input.capacity,
      status: input.status,
      hourlyQuotaCost: input.hourlyQuotaCost,
      minBookingHours: input.minBookingHours,
      maxBookingHours: input.maxBookingHours,
    })
    .returning({ id: spaces.id, name: spaces.name, slug: spaces.slug });

  await db.insert(spaceAvailabilityRules).values(
    input.availabilityRules.map((rule) => ({
      spaceId: space.id,
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      isActive: rule.isActive,
    })),
  );

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "space.created",
    entityType: "space",
    entityId: space.id,
    metadata: {
      name: space.name,
      slug: space.slug,
    },
  });

  revalidatePath("/admin/spaces");
  revalidatePath("/admin/spaces/new");
}

export async function createSpaceBlockAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const spaceId = String(formData.get("spaceId") ?? "");
  const input = spaceBlockSchema.parse({
    title: formData.get("title"),
    reason: formData.get("reason"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  const db = getDb();
  const [block] = await db
    .insert(spaceBlocks)
    .values({
      spaceId,
      title: input.title,
      reason: input.reason,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      createdBy: profile.id,
    })
    .returning({ id: spaceBlocks.id });

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "space.block_created",
    entityType: "space_block",
    entityId: block.id,
    metadata: {
      spaceId,
      title: input.title,
    },
  });

  revalidatePath(`/admin/spaces/${spaceId}`);
}
