import { betterAuth } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { Resend } from "resend";

// Admin email - only this email can sign up/in
const ADMIN_EMAIL = "etan@heyman.net";

const siteUrl = process.env.SITE_URL!;
const resendApiKey = process.env.RESEND_API_KEY;

// Initialize Resend client (only if API key is present)
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

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
      // Cross-domain plugin enables OTT (one-time token) flow for session persistence
      // This is required because auth server (Convex) and frontend are on different domains
      crossDomain({ siteUrl }),
      // Magic link passwordless authentication
      magicLink({
        sendMagicLink: async ({ email, url, token }) => {
          // Block non-admin emails
          if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            throw new Error("Only admin email is allowed to sign in");
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
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10b981;">SongScript</h1>
                    <p>Click the button below to sign in to your account:</p>
                    <a href="${frontendVerifyUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                      Sign In
                    </a>
                    <p style="color: #666; font-size: 14px;">Or copy this link: ${frontendVerifyUrl}</p>
                    <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
                  </div>
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
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});

// Check if the current user is an admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return false;
    return user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  },
});
