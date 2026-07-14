import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

describe("local quality gate configuration", () => {
  it("excludes nested worktrees from ESLint and Vitest discovery", async () => {
    const [eslintConfig, vitestConfig] = await Promise.all([
      readFile(path.join(projectRoot, "eslint.config.mjs"), "utf8"),
      readFile(path.join(projectRoot, "vitest.config.ts"), "utf8"),
    ]);

    expect(eslintConfig).toContain('".worktrees/**"');
    expect(vitestConfig).toContain('".worktrees/**"');
  });
});
