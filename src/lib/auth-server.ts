import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

// Initialize with all server utilities
export const {
  handler, // HTTP route handler for auth endpoints
  getToken, // Extract JWT token from cookies
  fetchAuthQuery, // Fetch authenticated queries
  fetchAuthMutation, // Execute authenticated mutations
  fetchAuthAction, // Execute authenticated actions
} = convexBetterAuthReactStart({
  convexUrl: import.meta.env.VITE_CONVEX_URL!,
  convexSiteUrl:
    import.meta.env.VITE_CONVEX_SITE_URL || "http://localhost:3001",
});
