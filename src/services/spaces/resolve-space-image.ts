import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";
import { slugify } from "@/lib/utils";

const UPLOADS_BUCKET = "uploads";
const SPACE_IMAGES_PREFIX = "spaces";
const MAX_SPACE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedSpaceImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

type UploadedImageFile = File | null;

type ResolveSpaceImageUrlInput = {
  adminClient?: ReturnType<typeof createSupabaseAdminClient>;
  currentImageUrl?: string | null;
  file: UploadedImageFile;
  projectUrl?: string;
  randomId?: string;
  removeImage: boolean;
  slug: string;
};

function isUploadedFile(file: UploadedImageFile): file is File {
  return Boolean(file && typeof file.arrayBuffer === "function" && file.size > 0);
}

function normalizeUploadedFileName(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
  const baseName = slugify(parts.join(".") || "space-image");

  return extension ? `${baseName}.${extension}` : baseName;
}

function buildSpaceImagePath({
  fileName,
  randomId,
  slug,
}: {
  fileName: string;
  randomId: string;
  slug: string;
}) {
  return `${SPACE_IMAGES_PREFIX}/${slug}/${randomId}-${normalizeUploadedFileName(fileName)}`;
}

async function removeUploadedObject(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
  objectPath: string | null,
) {
  if (!objectPath) {
    return;
  }

  await adminClient.storage.from(UPLOADS_BUCKET).remove([objectPath]);
}

function assertValidSpaceImage(file: File) {
  if (!allowedSpaceImageMimeTypes.has(file.type)) {
    throw new Error("La imagen debe ser JPG, PNG, GIF, WEBP o SVG.");
  }

  if (file.size > MAX_SPACE_IMAGE_SIZE_BYTES) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }
}

export function getUploadsObjectPathFromPublicUrl(
  imageUrl: string,
  projectUrl: string,
) {
  try {
    const currentUrl = new URL(imageUrl);
    const currentProjectUrl = new URL(projectUrl);
    const prefix = `/storage/v1/object/public/${UPLOADS_BUCKET}/`;

    if (
      currentUrl.origin !== currentProjectUrl.origin ||
      !currentUrl.pathname.startsWith(prefix)
    ) {
      return null;
    }

    return decodeURIComponent(currentUrl.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export async function resolveSpaceImageUrl({
  adminClient = createSupabaseAdminClient(),
  currentImageUrl,
  file,
  projectUrl = getEnv().NEXT_PUBLIC_SUPABASE_URL,
  randomId = crypto.randomUUID(),
  removeImage,
  slug,
}: ResolveSpaceImageUrlInput) {
  const currentObjectPath = currentImageUrl
    ? getUploadsObjectPathFromPublicUrl(currentImageUrl, projectUrl)
    : null;

  if (!isUploadedFile(file)) {
    if (removeImage) {
      await removeUploadedObject(adminClient, currentObjectPath);
      return null;
    }

    return currentImageUrl ?? null;
  }

  assertValidSpaceImage(file);

  const objectPath = buildSpaceImagePath({
    fileName: file.name,
    randomId,
    slug,
  });
  const { error: uploadError } = await adminClient.storage
    .from(UPLOADS_BUCKET)
    .upload(objectPath, await file.arrayBuffer(), {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message ?? "No se pudo subir la imagen del espacio.");
  }

  await removeUploadedObject(adminClient, currentObjectPath);

  const { data } = adminClient.storage.from(UPLOADS_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
