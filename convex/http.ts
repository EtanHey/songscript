import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./betterAuth";
import { trustedOrigins } from "./authOrigins";

const http = httpRouter();

// CORS handling is required for client-side frameworks
// Note: allowCredentials: true is set internally by @convex-dev/better-auth
authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: trustedOrigins,
    allowedHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
  },
});

export default http;
