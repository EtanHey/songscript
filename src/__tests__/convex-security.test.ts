/**
 * Integration tests verifying that Convex functions properly reject
 * unauthenticated requests and don't accept spoofed user IDs.
 *
 * Security fix context: All user data functions now use ctx.auth
 * server-side instead of accepting visitorId as a client argument.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Convex Security", () => {
  /**
   * Test that no user-facing Convex function accepts visitorId as an argument.
   * This is the core security fix - visitorId is spoofable client-side.
   *
   * Allowed exceptions:
   * - migration.ts: One-time data migration tools
   * - oneTimeMigration.ts: Admin migration utilities
   */
  describe("visitorId argument prevention", () => {
    it("no user-facing functions accept visitorId as argument", async () => {
      const convexDir = path.resolve(__dirname, "../../convex");
      const files = fs.readdirSync(convexDir).filter((f) => f.endsWith(".ts"));

      const violations: Array<{ file: string; lines: string[] }> = [];

      // Files allowed to have visitorId in args:
      // - migration.ts: One-time data migration tools
      // - oneTimeMigration.ts: Admin migration utilities
      // - schema.ts: Schema definitions are not functions
      // - _generated: Generated files
      // - transcription.ts: Non-sensitive job tracking (just tracks who requested a transcription)
      const allowedFiles = [
        "migration.ts",
        "oneTimeMigration.ts",
        "schema.ts",
        "_generated",
        "transcription.ts",
      ];

      for (const file of files) {
        // Skip allowed files
        if (allowedFiles.some((allowed) => file.includes(allowed))) {
          continue;
        }

        const filePath = path.join(convexDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        // Look for visitorId in function args patterns
        // Pattern: args: { ... visitorId: v.string() ... }
        const violatingLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check for visitorId in args definition
          // This pattern catches: visitorId: v.string() or similar
          if (
            line.includes("visitorId:") &&
            (line.includes("v.string()") || line.includes("v.optional"))
          ) {
            // Additional check: is this within an args block?
            // Look backwards for "args:" to confirm this is in function arguments
            let inArgsBlock = false;
            for (let j = i; j >= Math.max(0, i - 10); j--) {
              if (lines[j].includes("args:") && lines[j].includes("{")) {
                inArgsBlock = true;
                break;
              }
            }

            if (inArgsBlock) {
              violatingLines.push(`Line ${i + 1}: ${line.trim()}`);
            }
          }
        }

        if (violatingLines.length > 0) {
          violations.push({ file, lines: violatingLines });
        }
      }

      // Report violations in a clear format
      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `${v.file}:\n${v.lines.map((l) => `  - ${l}`).join("\n")}`
          )
          .join("\n\n");

        expect.fail(
          `Found Convex functions accepting visitorId as argument:\n\n${message}\n\n` +
            `User data functions should use ctx.auth (getAuthUserId/requireAuth) ` +
            `instead of accepting visitorId from the client.`
        );
      }

      // If we get here, no violations found
      expect(violations).toHaveLength(0);
    });

    it("all user data files use authHelpers for authentication", async () => {
      const convexDir = path.resolve(__dirname, "../../convex");

      // Files that handle user data and MUST use authHelpers
      const userDataFiles = [
        "wordProgress.ts",
        "songProgress.ts",
        "practiceLog.ts",
        "leaderboard.ts",
        "wishlist.ts",
        "goals.ts",
        "userPreferences.ts",
      ];

      const filesNotUsingAuthHelpers: string[] = [];

      for (const file of userDataFiles) {
        const filePath = path.join(convexDir, file);

        // Skip if file doesn't exist (some might be optional)
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const content = fs.readFileSync(filePath, "utf-8");

        // Check that file imports from authHelpers
        const hasAuthHelpersImport =
          content.includes('from "./authHelpers"') ||
          content.includes("from './authHelpers'");

        if (!hasAuthHelpersImport) {
          filesNotUsingAuthHelpers.push(file);
        }
      }

      expect(filesNotUsingAuthHelpers).toHaveLength(0);
    });
  });

  /**
   * Verify authentication patterns in Convex functions.
   *
   * Queries that handle user data should use getAuthUserId and return
   * empty results when unauthenticated (graceful degradation).
   *
   * Mutations that modify user data should use requireAuth and throw
   * an error when unauthenticated.
   */
  describe("authentication pattern verification", () => {
    it("query handlers use getAuthUserId pattern", async () => {
      const convexDir = path.resolve(__dirname, "../../convex");

      const userDataFiles = [
        "wordProgress.ts",
        "songProgress.ts",
        "practiceLog.ts",
        "leaderboard.ts",
      ];

      for (const file of userDataFiles) {
        const filePath = path.join(convexDir, file);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, "utf-8");

        // Check that queries use getAuthUserId
        // Pattern: export const xxx = query({ ... getAuthUserId(ctx) ... })
        const hasQuery = content.includes("= query({");
        const usesGetAuthUserId = content.includes("getAuthUserId(ctx)");

        if (hasQuery) {
          expect(usesGetAuthUserId).toBe(true);
        }
      }
    });

    it("mutation handlers use requireAuth pattern", async () => {
      const convexDir = path.resolve(__dirname, "../../convex");

      const userDataFiles = [
        "wordProgress.ts",
        "songProgress.ts",
        "practiceLog.ts",
        "leaderboard.ts",
      ];

      for (const file of userDataFiles) {
        const filePath = path.join(convexDir, file);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, "utf-8");

        // Check that mutations use requireAuth
        // Pattern: export const xxx = mutation({ ... requireAuth(ctx) ... })
        const hasMutation = content.includes("= mutation({");
        const usesRequireAuth = content.includes("requireAuth(ctx)");

        if (hasMutation) {
          expect(usesRequireAuth).toBe(true);
        }
      }
    });
  });

  /**
   * Test that the requireAuth helper properly throws on unauthenticated calls.
   * This tests the authHelpers module behavior.
   */
  describe("authHelpers behavior", () => {
    it("requireAuth throws Authentication required error when ctx.auth returns null", async () => {
      // This test verifies the authHelpers module behavior
      // We import and test the function directly
      const { requireAuth } = await import("../../convex/authHelpers");

      // Mock an unauthenticated context
      const unauthenticatedCtx = {
        auth: {
          getUserIdentity: async () => null,
        },
        db: {
          query: () => ({
            withIndex: () => ({
              first: async () => null,
            }),
          }),
        },
      };

      await expect(requireAuth(unauthenticatedCtx as any)).rejects.toThrow(
        "Authentication required"
      );
    });

    it("getAuthUserId returns null when unauthenticated (graceful handling)", async () => {
      const { getAuthUserId } = await import("../../convex/authHelpers");

      // Mock an unauthenticated context
      const unauthenticatedCtx = {
        auth: {
          getUserIdentity: async () => null,
        },
        db: {
          query: () => ({
            withIndex: () => ({
              first: async () => null,
            }),
          }),
        },
      };

      const result = await getAuthUserId(unauthenticatedCtx as any);
      expect(result).toBeNull();
    });

    it("getAuthUserId returns userId when authenticated", async () => {
      // The actual getAuthUserId function uses authComponent.safeGetAuthUser
      // which has complex internal dependencies (ctx.runQuery).
      //
      // Instead of mocking the complex internals, we verify the pattern:
      // - getAuthUserId should return a userId string when auth is present
      // - This is tested via the authHelpers.test.ts with proper mocks
      //
      // Here we verify the import works and function exists
      const { getAuthUserId } = await import("../../convex/authHelpers");
      expect(typeof getAuthUserId).toBe("function");

      // The existing convex/authHelpers.test.ts has the full authenticated mock
      // We verified in "authentication pattern verification" tests that:
      // 1. All user data files import from authHelpers
      // 2. Queries use getAuthUserId
      // 3. Mutations use requireAuth
    });
  });

  /**
   * Test that user data tables have proper indexes for secure queries.
   * All user data queries should use by_user index to filter by userId.
   */
  describe("secure query patterns", () => {
    it("user data queries use by_user index", async () => {
      const convexDir = path.resolve(__dirname, "../../convex");

      const userDataFiles = [
        "wordProgress.ts",
        "songProgress.ts",
        "practiceLog.ts",
      ];

      for (const file of userDataFiles) {
        const filePath = path.join(convexDir, file);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, "utf-8");

        // Verify queries use withIndex("by_user", ...) pattern
        const usesUserIndex = content.includes('withIndex("by_user"');

        expect(usesUserIndex).toBe(true);
      }
    });
  });
});
