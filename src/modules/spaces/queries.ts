import { and, asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { spaceAvailabilityRules, spaceBlocks, spaces } from "@/lib/db/schema";

export async function listSpaces() {
  const db = getDb();

  return db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      description: spaces.description,
      status: spaces.status,
      imageUrl: spaces.imageUrl,
      galleryUrls: spaces.galleryUrls,
      videoLinks: spaces.videoLinks,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
      minBookingHours: spaces.minBookingHours,
      maxBookingHours: spaces.maxBookingHours,
      capacity: spaces.capacity,
      createdAt: spaces.createdAt,
    })
    .from(spaces)
    .orderBy(desc(spaces.createdAt));
}

/** Public-facing list of spaces for the member portal — only active spaces */
export async function listPublicSpaces() {
  const db = getDb();

  return db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      description: spaces.description,
      status: spaces.status,
      imageUrl: spaces.imageUrl,
      galleryUrls: spaces.galleryUrls,
      videoLinks: spaces.videoLinks,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
      minBookingHours: spaces.minBookingHours,
      maxBookingHours: spaces.maxBookingHours,
      capacity: spaces.capacity,
      createdAt: spaces.createdAt,
    })
    .from(spaces)
    .where(eq(spaces.status, "active"))
    .orderBy(spaces.name);
}


export async function getSpaceDetail(spaceId: string) {
  const db = getDb();

  const [space] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      description: spaces.description,
      imageUrl: spaces.imageUrl,
      galleryUrls: spaces.galleryUrls,
      videoLinks: spaces.videoLinks,
      capacity: spaces.capacity,
      status: spaces.status,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
      minBookingHours: spaces.minBookingHours,
      maxBookingHours: spaces.maxBookingHours,
      createdAt: spaces.createdAt,
      updatedAt: spaces.updatedAt,
    })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!space) {
    notFound();
  }

  const availability = await db
    .select({
      id: spaceAvailabilityRules.id,
      dayOfWeek: spaceAvailabilityRules.dayOfWeek,
      startTime: spaceAvailabilityRules.startTime,
      endTime: spaceAvailabilityRules.endTime,
      isActive: spaceAvailabilityRules.isActive,
    })
    .from(spaceAvailabilityRules)
    .where(eq(spaceAvailabilityRules.spaceId, space.id))
    .orderBy(asc(spaceAvailabilityRules.dayOfWeek));

  const blocks = await db
    .select({
      id: spaceBlocks.id,
      title: spaceBlocks.title,
      reason: spaceBlocks.reason,
      startsAt: spaceBlocks.startsAt,
      endsAt: spaceBlocks.endsAt,
      createdAt: spaceBlocks.createdAt,
    })
    .from(spaceBlocks)
    .where(eq(spaceBlocks.spaceId, space.id))
    .orderBy(desc(spaceBlocks.startsAt));

  return {
    ...space,
    availability,
    blocks,
  };
}

/**
 * Like getSpaceDetail but returns notFound() if the space is not active.
 * Used by the member portal — members should only see active spaces.
 */
export async function getPublicSpaceDetail(spaceId: string) {
  const db = getDb();

  const [space] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      slug: spaces.slug,
      description: spaces.description,
      imageUrl: spaces.imageUrl,
      galleryUrls: spaces.galleryUrls,
      videoLinks: spaces.videoLinks,
      capacity: spaces.capacity,
      status: spaces.status,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
      minBookingHours: spaces.minBookingHours,
      maxBookingHours: spaces.maxBookingHours,
    })
    .from(spaces)
    .where(and(eq(spaces.id, spaceId), eq(spaces.status, "active")))
    .limit(1);

  if (!space) {
    notFound();
  }

  const availability = await db
    .select({
      id: spaceAvailabilityRules.id,
      dayOfWeek: spaceAvailabilityRules.dayOfWeek,
      startTime: spaceAvailabilityRules.startTime,
      endTime: spaceAvailabilityRules.endTime,
      isActive: spaceAvailabilityRules.isActive,
    })
    .from(spaceAvailabilityRules)
    .where(
      and(
        eq(spaceAvailabilityRules.spaceId, space.id),
        eq(spaceAvailabilityRules.isActive, true),
      ),
    )
    .orderBy(asc(spaceAvailabilityRules.dayOfWeek));

  return {
    ...space,
    availability,
  };
}

export async function getSpaceBySlug(slug: string) {
  const db = getDb();

  const [space] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
    })
    .from(spaces)
    .where(eq(spaces.slug, slug))
    .limit(1);

  return space ?? null;
}

export async function hasSpaceSlugConflict(slug: string, currentSpaceId?: string) {
  const db = getDb();
  const [space] = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(
      currentSpaceId
        ? and(eq(spaces.slug, slug), eq(spaces.id, currentSpaceId))
        : eq(spaces.slug, slug),
    )
    .limit(1);

  return Boolean(space);
}
