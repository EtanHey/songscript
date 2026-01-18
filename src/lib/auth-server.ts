import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

// Use process.env for server-side code (import.meta.env is client-side only)
const convexUrl = process.env.VITE_CONVEX_URL!;
const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL || "http://localhost:3001";

// Initialize with all server utilities
export const {
  handler, // HTTP route handler for auth endpoints
  getToken, // Extract JWT token from cookies
  fetchAuthQuery, // Fetch authenticated queries
  fetchAuthMutation, // Execute authenticated mutations
  fetchAuthAction, // Execute authenticated actions
} = convexBetterAuthReactStart({
  convexUrl,
  convexSiteUrl,
});
