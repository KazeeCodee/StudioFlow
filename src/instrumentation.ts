export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const [{ getEnv }, { logger }] = await Promise.all([
    import("@/lib/env"),
    import("@/lib/logger"),
  ]);

  getEnv();
  logger.info("application_started", { runtime: "nodejs" });
}
