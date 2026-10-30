// Public identity shared by browser and SSR. The live data remains on this
// secured deployment; migrating to the empty prod deployment is a separate decision.
export const convexDeployment = import.meta.env.PROD
  ? {
      cloudUrl: "https://harmless-husky-580.convex.cloud",
      siteUrl: "https://harmless-husky-580.convex.site",
    }
  : {
      cloudUrl: import.meta.env.VITE_CONVEX_URL,
      siteUrl: import.meta.env.VITE_CONVEX_SITE_URL,
    };
