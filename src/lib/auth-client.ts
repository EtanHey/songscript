import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SITE_URL || "http://localhost:3001",
  plugins: [convexClient()],
});

// Export commonly used hooks and methods
export const { signIn, signUp, signOut, useSession } = authClient;
