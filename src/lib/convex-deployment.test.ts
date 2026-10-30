import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("pins production builds to the production Convex pair despite stale Vercel values", async () => {
  vi.stubEnv("PROD", true);
  vi.stubEnv("VITE_CONVEX_URL", "https://harmless-husky-580.convex.cloud");
  vi.stubEnv("VITE_CONVEX_SITE_URL", "https://harmless-husky-580.convex.site");
  const { convexDeployment } = await import("./convex-deployment");
  expect(convexDeployment).toEqual({ cloudUrl: "https://quixotic-stork-639.convex.cloud", siteUrl: "https://quixotic-stork-639.convex.site" });
});
it("keeps development deployments configurable", async () => {
  vi.stubEnv("PROD", false);
  vi.stubEnv("VITE_CONVEX_URL", "https://development.convex.cloud");
  vi.stubEnv("VITE_CONVEX_SITE_URL", "https://development.convex.site");
  const { convexDeployment } = await import("./convex-deployment");
  expect(convexDeployment).toEqual({ cloudUrl: "https://development.convex.cloud", siteUrl: "https://development.convex.site" });
});
