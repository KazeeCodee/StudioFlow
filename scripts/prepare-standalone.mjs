import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function copyStandaloneAssets(projectDirectory = process.cwd()) {
  const standaloneDirectory = path.join(projectDirectory, ".next", "standalone");
  const publicDestination = path.join(standaloneDirectory, "public");
  const staticDestination = path.join(standaloneDirectory, ".next", "static");

  await Promise.all([
    rm(publicDestination, { force: true, recursive: true }),
    rm(staticDestination, { force: true, recursive: true }),
  ]);
  await mkdir(path.dirname(staticDestination), { recursive: true });
  await Promise.all([
    cp(path.join(projectDirectory, "public"), publicDestination, { recursive: true }),
    cp(path.join(projectDirectory, ".next", "static"), staticDestination, {
      recursive: true,
    }),
  ]);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (invokedPath === import.meta.url) {
  copyStandaloneAssets()
    .then(() => {
      console.info(
        JSON.stringify({
          event: "standalone_assets_copied",
          severity: "info",
          timestamp: new Date().toISOString(),
        }),
      );
    })
    .catch(() => {
      console.error(
        JSON.stringify({
          event: "standalone_asset_copy_failed",
          severity: "error",
          timestamp: new Date().toISOString(),
        }),
      );
      process.exitCode = 1;
    });
}
