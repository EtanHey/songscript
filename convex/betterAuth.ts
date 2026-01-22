import { betterAuth } from "better-auth/minimal";
import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import authConfig from "./auth.config";
import { components, internal } from "./_generated/api";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { Resend } from "resend";

// Auth functions for triggers (must match internal.auth exports)
const authFunctions: AuthFunctions = internal.auth;



const siteUrl = process.env.SITE_URL!;
const resendApiKey = process.env.RESEND_API_KEY;

// Initialize Resend client (only if API key is present)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
export const authComponent = createClient<DataModel>(components.betterAuth, {
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
    trustedOrigins: [
      "http://localhost:3001",
      "https://songscript-ten.vercel.app",
    ],
    database: authComponent.adapter(ctx),
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
      // Cross-domain plugin required for Convex auth
      crossDomain({ siteUrl }),
      // Magic link passwordless authentication
      magicLink({
        sendMagicLink: async ({ email, url, token }) => {
          // Check if user already exists (only if db is available in this context)
          if ("db" in ctx) {
            const dbCtx = ctx as unknown as { db: { query: (table: string) => { withIndex: (name: string, fn: (q: any) => any) => { first: () => Promise<any> } } } };
            const existingUser = await dbCtx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
            if (existingUser) {
              throw new Error("This email is already registered. Please sign in instead.");
            }
          }

          // Extract frontend origin from the callbackURL in the original URL
          // The URL looks like: .../verify?token=xxx&callbackURL=http://localhost:3001/dashboard
          const urlObj = new URL(url);
          const callbackURL = urlObj.searchParams.get("callbackURL") || "";

          // Get frontend origin from callbackURL, fallback to trusted origins
          let frontendOrigin = "https://songscript-ten.vercel.app";
          if (callbackURL) {
            try {
              frontendOrigin = new URL(callbackURL).origin;
            } catch {
              // Keep default
            }
          }

          // Build frontend verify URL - user goes directly to our app, no redirect through Convex
          const frontendVerifyUrl = `${frontendOrigin}/auth/verify?token=${token}`;

          console.log("=".repeat(60));
          console.log("MAGIC LINK FOR:", email);
          console.log("FRONTEND URL:", frontendVerifyUrl);
          console.log("=".repeat(60));

          // Send email via Resend if configured
          if (resend) {
            try {
              const { error } = await resend.emails.send({
                from: "SongScript <songscript@contact.heymans.dev>",
                to: email,
                subject: "Your SongScript Login Link",
                html: `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your SongScript Login Link</title>
                    <style>
                      /* Base styles */
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f9fafb;
                        margin: 0;
                        padding: 20px;
                      }
                      .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        overflow: hidden;
                      }
                      .header {
                        padding: 24px;
                        text-align: center;
                        background-color: #10b981;
                      }
                      .header h1 {
                        color: #ffffff;
                        margin: 0;
                        font-size: 28px;
                      }
                      .content {
                        padding: 32px;
                        text-align: center;
                      }
                      .content p {
                        margin-bottom: 24px;
                        font-size: 16px;
                      }
                      .button {
                        display: inline-block;
                        background-color: #10b981;
                        color: #ffffff;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 16px;
                      }
                      .button:hover {
                        background-color: #0f9d6a;
                      }
                      .fallback {
                        margin-top: 24px;
                        font-size: 12px;
                        color: #6b7280;
                      }
                      .fallback a {
                        color: #10b981;
                        word-break: break-all;
                      }
                      .footer {
                        padding: 24px;
                        text-align: center;
                        font-size: 12px;
                        color: #9ca3af;
                        background-color: #f3f4f6;
                      }

                      /* Dark mode styles */
                      @media (prefers-color-scheme: dark) {
                        body {
                          background-color: #111827;
                          color: #e5e7eb;
                        }
                        .container {
                          background-color: #1f2937;
                          border-color: #374151;
                        }
                        .header {
                           background-color: #10b981;
                        }
                        .header h1 {
                           color: #ffffff;
                        }
                        .content p {
                          color: #d1d5db;
                        }
                        .button {
                          background-color: #10b981;
                          color: #ffffff;
                        }
                        .button:hover {
                          background-color: #0f9d6a;
                        }
                        .fallback {
                          color: #9ca3af;
                        }
                        .fallback a {
                          color: #10b981;
                        }
                        .footer {
                          background-color: #111827;
                          color: #6b7280;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>SongScript</h1>
                      </div>
                      <div class="content">
                        <p>Click the button below to sign in to your account:</p>
                        <a href="${frontendVerifyUrl}" class="button">Sign In</a>
                        <div class="fallback">
                          <p>Or copy and paste this link into your browser:<br>
                            <a href="${frontendVerifyUrl}">${frontendVerifyUrl}</a>
                          </p>
                          <p>This link will expire in 1 hour.</p>
                        </div>
                      </div>
                      <div class="footer">
                        &copy; ${new Date().getFullYear()} SongScript. All rights reserved.
                      </div>
                    </div>
                  </body>
                  </html>
                `,
              });

              if (error) {
                console.error("Resend email error:", error);
              } else {
                console.log("Magic link email sent successfully via Resend");
              }
            } catch (err) {
              console.error("Failed to send email via Resend:", err);
            }
          } else {
            console.log("Resend not configured - check RESEND_API_KEY in .env.local");
          }
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