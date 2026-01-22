import { betterAuth } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import type { AuthContextWithDb } from "./authHelpers";
import type { DataModel } from "./_generated/dataModel";
import { Resend } from "resend";



const siteUrl = process.env.SITE_URL!;
const resendApiKey = process.env.RESEND_API_KEY;

// Initialize Resend client (only if API key is present)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: AuthContextWithDb) => {
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
          // Check if user already exists
          const existingUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
          if (existingUser) {
            // Throw error if user already exists
            throw new Error("This email is already registered. Please sign in instead.");
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