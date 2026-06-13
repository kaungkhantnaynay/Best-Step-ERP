import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const scannedTrackedFiles = execFileSync("git", [
  "ls-files",
  "*.env.example",
  "*.yml",
  "*.yaml",
  "package.json",
  "backend/package.json",
  "frontend/package.json",
], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const scannedFiles = [...new Set([...scannedTrackedFiles, "backend/.env.example"])];

const secretPatterns = [
  {
    name: "real Supabase direct database password",
    pattern: /postgresql:\/\/postgres:(?!\[PASSWORD\])[^@\s]+@db\.[^/\s]+\.supabase\.co/g,
  },
  {
    name: "real Supabase pooled database password",
    pattern: /postgresql:\/\/postgres\.[^:\s]+:(?!\[PASSWORD\])[^@\s]+@aws-\d-[^/\s]+\.pooler\.supabase\.com/g,
  },
  {
    name: "real Upstash Redis password",
    pattern: /rediss:\/\/default:(?!\[PASSWORD\])[^@\s]+@[^/\s]+\.upstash\.io/g,
  },
  {
    name: "Upstash REST token",
    pattern: /UPSTASH_REDIS_REST_TOKEN\s*=\s*["']?[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: "hardcoded JWT secret",
    pattern: /JWT_(?:ACCESS|REFRESH)_SECRET\s*=\s*(?!replace-with)(?!\[)[A-Za-z0-9_-]{16,}/g,
  },
];

describe("secret safety", () => {
  it("keeps tracked env examples and config files free of obvious real secrets", () => {
    const findings = scannedFiles.flatMap((filePath) => {
      const content = readFileSync(join(repoRoot, filePath), "utf8");

      return secretPatterns.flatMap(({ name, pattern }) => {
        const matches = content.match(pattern) ?? [];

        return matches.map(() => `${filePath}: ${name}`);
      });
    });

    expect(findings).toEqual([]);
  });
});
