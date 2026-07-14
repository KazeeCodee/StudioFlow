type ClosableSqlClient = {
  end: (options: { timeout: number }) => Promise<unknown>;
};

export async function closeSqlAfterCleanup(
  sql: ClosableSqlClient,
  cleanup: () => Promise<void>,
) {
  try {
    await cleanup();
  } finally {
    await sql.end({ timeout: 5 });
  }
}
