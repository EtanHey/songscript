import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const betterAuthSource = readFileSync(
  resolve(process.cwd(), "convex/betterAuth.ts"),
  "utf8",
);

describe("magic-link logging", () => {
  it("never sends the recipient email or token-bearing URL to console.log", () => {
    const loggedArguments = [...betterAuthSource.matchAll(/console\.log\(([\s\S]*?)\);/g)]
      .map((match) => match[1].replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ""));

    expect(loggedArguments.filter((args) => /\b(?:email|token|frontendVerifyUrl)\b/.test(args))).toEqual([]);
  });
});
