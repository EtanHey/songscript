// Production identity is public configuration, shared by browser and SSR consumers.
// Vercel's stale VITE_CONVEX_* values previously routed production sign-ins to dev.
export const convexDeployment = import.meta.env.PROD
  ? {
      cloudUrl: "https://quixotic-stork-639.convex.cloud",
      siteUrl: "https://quixotic-stork-639.convex.site",
    }
  : {
      cloudUrl: import.meta.env.VITE_CONVEX_URL,
      siteUrl: import.meta.env.VITE_CONVEX_SITE_URL,
    };
