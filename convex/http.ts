import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./betterAuth";

const http = httpRouter();

// CORS handling is required for client-side frameworks
authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;
