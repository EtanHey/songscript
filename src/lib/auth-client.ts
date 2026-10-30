import { convexDeployment } from "./convex-deployment";
import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: convexDeployment.siteUrl,
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
