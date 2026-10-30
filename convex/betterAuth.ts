import { betterAuth } from "better-auth/minimal";
import { APIError } from "better-auth/api";
import { trustedOrigins } from "./authOrigins";
import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import authConfig from "./auth.config";
import { components, internal } from "./_generated/api";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { Resend } from "resend";
import { renderMagicLinkEmail } from "./lib/magicLinkEmail";

// Auth functions for triggers (must match internal.auth exports)
const authFunctions: AuthFunctions = internal.auth;



const siteUrl = process.env.SITE_URL!;
const resendApiKey = process.env.RESEND_API_KEY;

// Better Auth's default magic-link lifetime, pinned so the email copy stays truthful.
const MAGIC_LINK_EXPIRES_IN_SECONDS = 60 * 5;

// Initialize Resend client (only if API key is present)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Provider messages may contain recipients or links. Only these fixed codes may be logged.
const safeProviderCodes = new Set([
  "validation_error", "missing_api_key", "restricted_api_key", "invalid_api_key",
  "rate_limit_exceeded", "application_error", "internal_server_error",
  "invalid_from_address", "not_found", "daily_quota_exceeded", "monthly_quota_exceeded",
]);

function deliveryFailure(code: string): never {
  console.error("Magic link delivery failed", { code });
  throw new APIError("BAD_GATEWAY", {
    code: "MAGIC_LINK_DELIVERY_FAILED",
    message: "Unable to send sign-in email. Please try again later.",
  });
}

/**
 * Better Auth Component Client
 *
 * This client integrates Better Auth with Convex and includes DATABASE TRIGGERS
 * that automatically sync data between Better Auth's `user` table and our app's `users` table.
 *
 * TRIGGERS (automatic sync - no manual code needed):
 * - onCreate: Creates app user record when Better Auth user is created
 * - onUpdate: Syncs email and displayUsername changes to app users table
 * - onDelete: Deletes app user record when Better Auth user is deleted
 *
 * DO NOT duplicate this sync logic elsewhere - these triggers handle it automatically!
 *
 * The sync fields are:
 * - Better Auth `email` ↔ App `email`
 * - Better Auth `displayUsername` ↔ App `displayName`
 * - Better Auth `_id` → App `authId` (link between tables)
 */
export const authComponent = createClient<DataModel>(components.betterAuth as any, {
  authFunctions,
  triggers: {
    user: {
      // When a new Better Auth user is created, create the app user record
      onCreate: async (ctx, authUser) => {
        // Check if app user already exists (shouldn't, but be safe)
        const existing = await ctx.db
          .query("users")
          .withIndex("authId", (q) => q.eq("authId", authUser._id))
          .first();

        if (!existing) {
          const userId = await ctx.db.insert("users", {
            email: authUser.email,
            authId: authUser._id,
            displayName: authUser.displayUsername || undefined,
            createdAt: Date.now(),
          });
          // Link the app user back to Better Auth
          await authComponent.setUserId(ctx, authUser._id, userId);
        }
      },

      // When Better Auth user is updated, sync changes to app user
      onUpdate: async (ctx, authUser, prevAuthUser) => {
        const appUser = await ctx.db
          .query("users")
          .withIndex("authId", (q) => q.eq("authId", authUser._id))
          .first();

        if (appUser) {
          const updates: { email?: string; displayName?: string } = {};

          // Sync email if changed
          if (authUser.email !== prevAuthUser.email) {
            updates.email = authUser.email;
          }

          // Sync displayUsername → displayName if changed
          if (authUser.displayUsername !== prevAuthUser.displayUsername) {
            updates.displayName = authUser.displayUsername || undefined;
          }

          if (Object.keys(updates).length > 0) {
            await ctx.db.patch(appUser._id, updates);
          }
        }
      },

      // When Better Auth user is deleted, delete the app user
      onDelete: async (ctx, authUser) => {
        const appUser = await ctx.db
          .query("users")
          .withIndex("authId", (q) => q.eq("authId", authUser._id))
          .first();

        if (appUser) {
          await ctx.db.delete(appUser._id);
        }
      },
    },
  },
});

// Export trigger API for Convex to wire up
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
      // Cross-domain plugin required for Convex auth
      crossDomain({ siteUrl }),
      // Magic link passwordless authentication
      magicLink({
        expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
        sendMagicLink: async ({ email, url, token }) => {
          // Extract frontend origin from the callbackURL in the original URL
          // The URL looks like: .../verify?token=xxx&callbackURL=http://localhost:3001/dashboard
          const urlObj = new URL(url);
          const callbackURL = urlObj.searchParams.get("callbackURL") || "";

          // Get frontend origin from callbackURL, fallback to trusted origins
          let frontendOrigin = new URL(siteUrl).origin;
          if (callbackURL) {
            try {
              frontendOrigin = new URL(callbackURL).origin;
            } catch {
              // Keep default
            }
          }

          // Build frontend verify URL - user goes directly to our app, no redirect through Convex
          const frontendVerifyUrl = `${frontendOrigin}/auth/verify?token=${token}`;

          if (!resend) deliveryFailure("not_configured");
          let failureCode: string | undefined;
          try {
            const { subject, html, text } = renderMagicLinkEmail({
              url: frontendVerifyUrl,
              expiresInSeconds: MAGIC_LINK_EXPIRES_IN_SECONDS,
            });
            const { error } = await resend.emails.send({
              from: "SongScript <songscript@contact.heymans.dev>",
              to: email,
              subject,
              html,
              text,
            });

            if (error) {
              failureCode = safeProviderCodes.has(error.name) ? error.name : "provider_error";
            }
          } catch {
            failureCode = "provider_exception";
          }
          if (failureCode) deliveryFailure(failureCode);
        },
      }),
    ],
  });
};

// Get the current authenticated user
// export const getCurrentUser = query({ // Removed this export
//   args: {},
//   handler: async (ctx) => {
//     return await authComponent.getAuthUser(ctx);
//   },
// });
