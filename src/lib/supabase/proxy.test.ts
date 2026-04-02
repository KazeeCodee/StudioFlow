import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const createServerClient = vi.fn(() => ({
  auth: {
    getUser,
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://studioflow.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  }),
}));

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("revalida la sesion consultando auth.getUser", async () => {
    const { updateSession } = await import("@/lib/supabase/proxy");
    const request = new NextRequest("https://studioflow.test/admin");

    const response = await updateSession(request);

    expect(createServerClient).toHaveBeenCalled();
    expect(getUser).toHaveBeenCalled();
    expect(response).toBeDefined();
  });
});
