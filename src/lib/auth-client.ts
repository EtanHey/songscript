import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [
    convexClient(),
    magicLinkClient(),
    crossDomainClient({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storagePrefix: "songscript",
    }),
  ],
});

// Export commonly used hooks and methods
export const { signIn, signOut, useSession } = authClient;
