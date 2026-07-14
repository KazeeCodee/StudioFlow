"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { parseStudioDateTimeInput } from "@/lib/datetime";
import { auditLogs, bookings, spaceAvailabilityRules, spaceBlocks, spaces } from "@/lib/db/schema";
import { canManageSpaces } from "@/lib/permissions/guards";
import {
  consumeRateLimit,
  logRateLimitUnavailable,
  redisRateLimitStore,
} from "@/lib/rate-limit";
import { buildRateLimitKey } from "@/lib/request-identity";
import { slugify } from "@/lib/utils";
import { requireStaffContext } from "@/modules/auth/queries";
import type { AppRole } from "@/modules/auth/types";
import {
  parseAvailabilityRulesField,
  spaceBlockSchema,
  spaceSchema,
} from "@/modules/spaces/schema";
import { buildSpaceWriteValues } from "@/services/spaces/build-space-write-values";
import { resolveSpaceImageUrl } from "@/services/spaces/resolve-space-image";

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

async function assertSpaceUploadRateLimit(profileId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || (file.size === 0 && file.name.length === 0)) {
    return;
  }

  const rateLimit = await consumeRateLimit({
    failureMode: "open",
    key: buildRateLimitKey("spaces:upload", [profileId]),
    limit: 20,
    onUnavailable: () => logRateLimitUnavailable("spaces:upload"),
    store: redisRateLimitStore,
    windowMs: 15 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    throw new Error(
      "Demasiadas imagenes subidas. Intenta nuevamente mas tarde.",
    );
  }
}

export async function createSpaceAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);
  const imageFile = formData.get("imageFile");
  await assertSpaceUploadRateLimit(profile.id, imageFile);
  const name = String(formData.get("name") ?? "");
  const slug = slugify(name);
  const imageUrl = await resolveSpaceImageUrl({
    file: imageFile as File | null,
    removeImage: false,
    slug,
  });
  const availabilityRules = parseAvailabilityRulesField(formData.get("availabilityRules")).filter(
    (rule) => rule.isActive,
  );
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
    availabilityRules,
  });

  const db = getDb();
  const values = buildSpaceWriteValues(input);

  await db.transaction(async (tx) => {
    const [space] = await tx
      .insert(spaces)
      .values(values)
      .returning({ id: spaces.id, name: spaces.name, slug: spaces.slug });

    if (input.availabilityRules.length > 0) {
      await tx.insert(spaceAvailabilityRules).values(
        input.availabilityRules.map((rule) => ({
          spaceId: space.id,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: true,
        })),
      );
    }

    await tx.insert(auditLogs).values({
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
  });

  revalidateSpacePaths();
}

export async function updateSpaceAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManageSpaces(profile.role);
  const imageFile = formData.get("imageFile");
  await assertSpaceUploadRateLimit(profile.id, imageFile);
  const spaceId = String(formData.get("spaceId") ?? "");
  const name = String(formData.get("name") ?? "");
  const slug = slugify(name);
  const imageUrl = await resolveSpaceImageUrl({
    currentImageUrl: String(formData.get("currentImageUrl") ?? "").trim() || null,
    file: imageFile as File | null,
    removeImage: formData.get("removeImage") === "on",
    slug,
  });
  const availabilityRules = parseAvailabilityRulesField(formData.get("availabilityRules")).filter(
    (rule) => rule.isActive,
  );
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
    availabilityRules,
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

    if (input.availabilityRules.length > 0) {
      await tx.insert(spaceAvailabilityRules).values(
        input.availabilityRules.map((rule) => ({
          spaceId,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: true,
        })),
      );
    }

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
