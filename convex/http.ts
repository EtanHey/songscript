import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./betterAuth";

const http = httpRouter();

// CORS handling is required for client-side frameworks
// Note: allowCredentials: true is set internally by @convex-dev/better-auth
authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [
      "http://localhost:3001",
      "https://songscript-ten.vercel.app",
    ],
    allowedHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
  },
});

export default http;
