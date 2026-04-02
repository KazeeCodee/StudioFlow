"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { parseStudioDateTimeInput } from "@/lib/datetime";
import { auditLogs, bookings, spaceAvailabilityRules, spaceBlocks, spaces } from "@/lib/db/schema";
import { canManageSpaces } from "@/lib/permissions/guards";
import { slugify } from "@/lib/utils";
import { requireStaffContext } from "@/modules/auth/queries";
import type { AppRole } from "@/modules/auth/types";
import { spaceBlockSchema, spaceSchema } from "@/modules/spaces/schema";
import { buildSpaceWriteValues } from "@/services/spaces/build-space-write-values";
import { resolveSpaceImageUrl } from "@/services/spaces/resolve-space-image";

function readAvailabilityRules(formData: FormData) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isActive: formData.get(`availability-${dayOfWeek}-enabled`) === "on",
    startTime: String(formData.get(`availability-${dayOfWeek}-start`) ?? "09:00"),
    endTime: String(formData.get(`availability-${dayOfWeek}-end`) ?? "18:00"),
  }));
}

function readStringArray(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String).filter(Boolean);
}


function revalidateSpacePaths(spaceId?: string) {
  revalidatePath("/admin/spaces");
  revalidatePath("/admin/spaces/new");

  if (spaceId) {
    revalidatePath(`/admin/spaces/${spaceId}`);
  }
}

function assertCanManageSpaces(role: AppRole) {
  if (!canManageSpaces(role)) {
    redirect("/admin");
  }
}

export async function createSpaceAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);
  const name = String(formData.get("name") ?? "");
  const slug = slugify(name);
  const imageUrl = await resolveSpaceImageUrl({
    file: formData.get("imageFile") as File | null,
    removeImage: false,
    slug,
  });
  const input = spaceSchema.parse({
    name,
    slug,
    description: formData.get("description"),
    imageUrl: imageUrl ?? "",
    galleryUrls: readStringArray(formData, "galleryUrls"),
    videoLinks: readStringArray(formData, "videoLinks"),
    capacity: formData.get("capacity"),
    status: formData.get("status"),
    hourlyQuotaCost: formData.get("hourlyQuotaCost"),
    minBookingHours: formData.get("minBookingHours"),
    maxBookingHours: formData.get("maxBookingHours"),
    availabilityRules: readAvailabilityRules(formData),
  });

  const db = getDb();
  const values = buildSpaceWriteValues(input);

  const [space] = await db
    .insert(spaces)
    .values(values)
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

  revalidateSpacePaths();
}

export async function updateSpaceAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);
  const spaceId = String(formData.get("spaceId") ?? "");
  const name = String(formData.get("name") ?? "");
  const slug = slugify(name);
  const imageUrl = await resolveSpaceImageUrl({
    currentImageUrl: String(formData.get("currentImageUrl") ?? "").trim() || null,
    file: formData.get("imageFile") as File | null,
    removeImage: formData.get("removeImage") === "on",
    slug,
  });
  const input = spaceSchema.parse({
    name,
    slug,
    description: formData.get("description"),
    imageUrl: imageUrl ?? "",
    galleryUrls: readStringArray(formData, "galleryUrls"),
    videoLinks: readStringArray(formData, "videoLinks"),
    capacity: formData.get("capacity"),
    status: formData.get("status"),
    hourlyQuotaCost: formData.get("hourlyQuotaCost"),
    minBookingHours: formData.get("minBookingHours"),
    maxBookingHours: formData.get("maxBookingHours"),
    availabilityRules: readAvailabilityRules(formData),
  });

  if (!spaceId) {
    throw new Error("Falta el espacio a actualizar.");
  }

  const db = getDb();
  const values = buildSpaceWriteValues(input);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(spaces)
      .set({
        ...values,
        updatedAt: now,
      })
      .where(eq(spaces.id, spaceId));

    await tx.delete(spaceAvailabilityRules).where(eq(spaceAvailabilityRules.spaceId, spaceId));

    await tx.insert(spaceAvailabilityRules).values(
      input.availabilityRules.map((rule) => ({
        spaceId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        isActive: rule.isActive,
      })),
    );

    await tx.insert(auditLogs).values({
      actorId: profile.id,
      actorRole: profile.role,
      action: "space.updated",
      entityType: "space",
      entityId: spaceId,
      metadata: {
        name: values.name,
        slug: values.slug,
        status: values.status,
      },
    });
  });

  revalidateSpacePaths(spaceId);
  redirect(`/admin/spaces/${spaceId}`);
}

export async function createSpaceBlockAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);
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
      startsAt: parseStudioDateTimeInput(input.startsAt),
      endsAt: parseStudioDateTimeInput(input.endsAt),
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

  revalidateSpacePaths(spaceId);
  redirect(`/admin/spaces/${spaceId}`);
}

export async function deleteSpaceBlockAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);
  const spaceId = String(formData.get("spaceId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");

  if (!spaceId || !blockId) {
    throw new Error("Falta el bloqueo a eliminar.");
  }

  const db = getDb();
  await db.delete(spaceBlocks).where(eq(spaceBlocks.id, blockId));

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "space.block_deleted",
    entityType: "space_block",
    entityId: blockId,
    metadata: {
      spaceId,
    },
  });

  revalidateSpacePaths(spaceId);
  redirect(`/admin/spaces/${spaceId}`);
}

export async function updateSpaceStatusAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);

  const spaceId = String(formData.get("spaceId") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!spaceId) {
    throw new Error("Falta el espacio a actualizar.");
  }

  if (!["active", "inactive", "maintenance"].includes(status)) {
    throw new Error("Estado de espacio inválido.");
  }

  const db = getDb();
  const [currentSpace] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      status: spaces.status,
    })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!currentSpace) {
    throw new Error("No encontramos el espacio solicitado.");
  }

  await db
    .update(spaces)
    .set({
      status: status as "active" | "inactive" | "maintenance",
      updatedAt: new Date(),
    })
    .where(eq(spaces.id, spaceId));

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "space.status_changed",
    entityType: "space",
    entityId: spaceId,
    metadata: {
      name: currentSpace.name,
      previousStatus: currentSpace.status,
      status,
      reason,
    },
  });

  revalidateSpacePaths(spaceId);
  redirect(`/admin/spaces/${spaceId}`);
}

export async function deleteSpaceAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);

  const spaceId = String(formData.get("spaceId") ?? "");

  if (!spaceId) {
    throw new Error("Falta el espacio a eliminar.");
  }

  const db = getDb();
  const [currentSpace] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
    })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!currentSpace) {
    throw new Error("No encontramos el espacio solicitado.");
  }

  const [{ bookingCount }] = await db
    .select({ bookingCount: count() })
    .from(bookings)
    .where(eq(bookings.spaceId, spaceId));

  if (bookingCount > 0) {
    throw new Error("No se puede eliminar el espacio mientras tenga reservas asociadas.");
  }

  await db.delete(spaces).where(eq(spaces.id, spaceId));

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "space.deleted",
    entityType: "space",
    entityId: spaceId,
    metadata: {
      name: currentSpace.name,
    },
  });

  revalidateSpacePaths();
  redirect("/admin/spaces");
}
