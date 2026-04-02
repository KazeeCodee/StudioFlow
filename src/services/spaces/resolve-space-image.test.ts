import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getUploadsObjectPathFromPublicUrl,
  resolveSpaceImageUrl,
} from "@/services/spaces/resolve-space-image";

describe("getUploadsObjectPathFromPublicUrl", () => {
  it("extrae el path interno cuando la URL pertenece al bucket publico del proyecto", () => {
    const result = getUploadsObjectPathFromPublicUrl(
      "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala/a.jpg",
      "https://rmkngkkuglexnzzuvdgb.supabase.co",
    );

    expect(result).toBe("spaces/sala/a.jpg");
  });

  it("ignora URLs externas o de otro bucket", () => {
    expect(
      getUploadsObjectPathFromPublicUrl(
        "https://example.com/image.jpg",
        "https://rmkngkkuglexnzzuvdgb.supabase.co",
      ),
    ).toBeNull();

    expect(
      getUploadsObjectPathFromPublicUrl(
        "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/avatars/a.jpg",
        "https://rmkngkkuglexnzzuvdgb.supabase.co",
      ),
    ).toBeNull();
  });
});

describe("resolveSpaceImageUrl", () => {
  const upload = vi.fn();
  const remove = vi.fn();
  const getPublicUrl = vi.fn((path: string) => ({
    data: {
      publicUrl: `https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/${path}`,
    },
  }));

  const storageClient = {
    storage: {
      from: vi.fn(() => ({
        upload,
        remove,
        getPublicUrl,
      })),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
  });

  it("mantiene la imagen actual cuando no llega un archivo nuevo", async () => {
    const result = await resolveSpaceImageUrl({
      adminClient: storageClient as never,
      currentImageUrl:
        "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala/actual.jpg",
      file: null,
      projectUrl: "https://rmkngkkuglexnzzuvdgb.supabase.co",
      removeImage: false,
      slug: "sala-podcast",
    });

    expect(result).toBe(
      "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala/actual.jpg",
    );
    expect(upload).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("sube la nueva imagen y elimina la anterior del mismo bucket", async () => {
    const result = await resolveSpaceImageUrl({
      adminClient: storageClient as never,
      currentImageUrl:
        "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala/actual.jpg",
      file: new File(["fake"], "foto.png", { type: "image/png" }),
      projectUrl: "https://rmkngkkuglexnzzuvdgb.supabase.co",
      removeImage: false,
      slug: "sala-podcast",
      randomId: "abc123",
    });

    expect(upload).toHaveBeenCalled();
    expect(getPublicUrl).toHaveBeenCalledWith("spaces/sala-podcast/abc123-foto.png");
    expect(remove).toHaveBeenCalledWith(["spaces/sala/actual.jpg"]);
    expect(result).toBe(
      "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala-podcast/abc123-foto.png",
    );
  });

  it("permite eliminar la imagen actual sin subir una nueva", async () => {
    const result = await resolveSpaceImageUrl({
      adminClient: storageClient as never,
      currentImageUrl:
        "https://rmkngkkuglexnzzuvdgb.supabase.co/storage/v1/object/public/uploads/spaces/sala/actual.jpg",
      file: null,
      projectUrl: "https://rmkngkkuglexnzzuvdgb.supabase.co",
      removeImage: true,
      slug: "sala-podcast",
    });

    expect(result).toBeNull();
    expect(remove).toHaveBeenCalledWith(["spaces/sala/actual.jpg"]);
    expect(upload).not.toHaveBeenCalled();
  });
});
