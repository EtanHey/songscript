// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const convexRoot = fileURLToPath(new URL("../../convex/", import.meta.url));
const logMethods = new Set(["log", "info", "warn", "error", "debug"]);
const sensitiveName = /email|token|url|authUser/i;
const userLikeName = /user|profile|account|name/i;

function references(node: ts.Node, pattern: RegExp): boolean {
  // Convex document IDs are permitted, even when the owner is an auth user.
  if (ts.isPropertyAccessExpression(node) && node.name.text === "_id") {
    return false;
  }
  return (
    (ts.isIdentifier(node) && pattern.test(node.text)) ||
    (ts.isElementAccessExpression(node) &&
      ts.isStringLiteral(node.argumentExpression) &&
      pattern.test(node.argumentExpression.text)) ||
    (ts.forEachChild(node, (child) => references(child, pattern) || undefined) ?? false)
  );
}

function containsPii(node: ts.Node): boolean {
  if (ts.isPropertyAccessExpression(node) && node.name.text === "_id") {
    return false;
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "JSON" &&
    node.expression.name.text === "stringify" &&
    node.arguments.some((arg) => references(arg, userLikeName))
  ) {
    return true;
  }
  return references(node, sensitiveName) ||
    (ts.forEachChild(node, (child) => containsPii(child) || undefined) ?? false);
}

function piiLogLines(source: string): number[] {
  const file = ts.createSourceFile("convex.ts", source, ts.ScriptTarget.Latest, true);
  const lines: number[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const method = ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : ts.isElementAccessExpression(callee) && ts.isStringLiteral(callee.argumentExpression)
          ? callee.argumentExpression.text
          : undefined;
      if (
        (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)) &&
        ts.isIdentifier(callee.expression) && callee.expression.text === "console" &&
        method && logMethods.has(method) && node.arguments.some(containsPii)
      ) {
        lines.push(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return lines;
}

function convexFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "_generated") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? convexFiles(path) : entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("Convex logs do not expose PII or authentication links", () => {
  it.each([
    'console.log("recipient", email)',
    'console.info(`recipient: ${args.email}`)',
    'console.warn("link", url)',
    'console.error("token", token)',
    'console.debug("URL", urlObj)',
    'console.log("link", verifyUrl)',
    'console.log(`link: ${frontendVerifyUrl}`)',
    'console.log("user", authUser)',
    'console.log("user", JSON.stringify(authUser))',
    'console.log("user", JSON.stringify(user))',
    'console.log("profile", JSON.stringify(profile))',
    'console.log("account", JSON.stringify({ name: displayName }))',
    'console.log(\n "recipient",\n args.email.toLowerCase()\n)',
    'console["log"]("recipient", args["email"])',
  ])("detects sensitive arguments: %s", (source) => {
    expect(piiLogLines(source)).toHaveLength(1);
  });

  it.each([
    'console.log("Magic link email sent successfully via Resend")',
    'console.log("User created", userId)',
    'console.log("User found", existingByEmail._id)',
    'console.log("User found", authUser._id)',
    'console.log("Report", JSON.stringify(deletionReport))',
    '// console.log(email)\nconst message = "console.log(token)"',
  ])("allows non-identifying logs and ignores comments/strings: %s", (source) => {
    expect(piiLogLines(source)).toEqual([]);
  });

  it.each(convexFiles(convexRoot).map((path) => [relative(convexRoot, path), path]))(
    "%s has no sensitive console arguments",
    (_name, path) => {
      expect(piiLogLines(readFileSync(path, "utf8"))).toEqual([]);
    },
  );
});
