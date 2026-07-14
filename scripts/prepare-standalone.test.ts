import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyStandaloneAssets } from "./prepare-standalone.mjs";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("copyStandaloneAssets", () => {
  it("copia public y .next/static dentro del bundle standalone", async () => {
    const projectDirectory = await mkdtemp(path.join(os.tmpdir(), "studioflow-standalone-"));
    temporaryDirectories.push(projectDirectory);
    await mkdir(path.join(projectDirectory, "public"), { recursive: true });
    await mkdir(path.join(projectDirectory, ".next", "static", "chunks"), {
      recursive: true,
    });
    await mkdir(path.join(projectDirectory, ".next", "standalone"), { recursive: true });
    await writeFile(path.join(projectDirectory, "public", "logo.svg"), "logo");
    await writeFile(
      path.join(projectDirectory, ".next", "static", "chunks", "app.js"),
      "chunk",
    );

    await copyStandaloneAssets(projectDirectory);

    await expect(
      readFile(path.join(projectDirectory, ".next", "standalone", "public", "logo.svg"), "utf8"),
    ).resolves.toBe("logo");
    await expect(
      readFile(
        path.join(
          projectDirectory,
          ".next",
          "standalone",
          ".next",
          "static",
          "chunks",
          "app.js",
        ),
        "utf8",
      ),
    ).resolves.toBe("chunk");
  });
});
