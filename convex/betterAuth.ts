import { betterAuth } from "better-auth/minimal";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";

// Admin email - only this email can sign up/in
const ADMIN_EMAIL = "etan@heyman.net";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
      // Magic link passwordless authentication
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          // Block non-admin emails
          if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            throw new Error("Only admin email is allowed to sign in");
          }
          // For development: log the magic link to console
          // In production, this would send an email
          console.log("=".repeat(60));
          console.log("MAGIC LINK FOR:", email);
          console.log("URL:", url);
          console.log("=".repeat(60));
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
