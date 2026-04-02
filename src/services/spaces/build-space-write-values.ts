import type { SpaceInput } from "@/modules/spaces/schema";

export function buildSpaceWriteValues(input: SpaceInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    imageUrl: input.imageUrl || null,
    galleryUrls: input.galleryUrls ?? [],
    videoLinks: input.videoLinks ?? [],
    capacity: input.capacity,
    status: input.status,
    hourlyQuotaCost: input.hourlyQuotaCost,
    minBookingHours: input.minBookingHours,
    maxBookingHours: input.maxBookingHours,
  };
}

