import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

import { convexDeployment } from "./convex-deployment";

// Initialize with all server utilities
export const {
  handler, // HTTP route handler for auth endpoints
  getToken, // Extract JWT token from cookies
  fetchAuthQuery, // Fetch authenticated queries
  fetchAuthMutation, // Execute authenticated mutations
  fetchAuthAction, // Execute authenticated actions
} = convexBetterAuthReactStart({
  convexUrl: convexDeployment.cloudUrl,
  convexSiteUrl: convexDeployment.siteUrl,
});
