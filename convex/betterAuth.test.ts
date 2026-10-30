// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inspect } from "node:util";
import { memoryAdapter } from "better-auth/adapters/memory";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";

const { send, registerRoutes } = vi.hoisted(() => ({ send: vi.fn(), registerRoutes: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));
vi.mock("@convex-dev/better-auth", () => ({
  createClient: () => ({
    adapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [], jwks: [] }),
    triggersApi: () => ({}),
    registerRoutes,
  }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("SITE_URL", "https://songscript-ten.vercel.app");
  vi.stubEnv("CONVEX_SITE_URL", "https://quixotic-stork-639.convex.site");
  vi.stubEnv("BETTER_AUTH_SECRET", "unit-test-secret-with-at-least-thirty-two-characters");
  vi.stubEnv("RESEND_API_KEY", "re_unit_test_only");
  send.mockReset().mockResolvedValue({ data: { id: "test-message" }, error: null });
  registerRoutes.mockClear();
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {});
  }
});
afterEach(() => {
  try {
    for (const method of ["log", "info", "warn", "error", "debug"] as const) {
      const logged = inspect(vi.mocked(console[method]).mock.calls, { depth: null, customInspect: false });
      for (const privateValue of ["test@example.com", "private.example", "?token="]) {
        expect(logged, `console.${method} leaked private data`).not.toContain(privateValue);
      }
    }
  } finally { vi.unstubAllEnvs(); vi.restoreAllMocks(); }
});

async function testAuth(ctx: GenericCtx<DataModel> = {} as GenericCtx<DataModel>) {
  const { createAuth } = await import("./betterAuth");
  // Only the Convex adapter is replaced; Better Auth runs its real HTTP middleware.
  return createAuth(ctx);
}

async function request(origin = "https://songscript-eight.vercel.app", ctx?: GenericCtx<DataModel>) {
  const auth = await testAuth(ctx);
  return auth.handler(new Request("https://songscript-ten.vercel.app/api/auth/sign-in/magic-link", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", callbackURL: `${origin}/dashboard` }),
  }));
}

describe("magic-link delivery HTTP contract", () => {
  it("accepts the production alias and sends exactly once", async () => {
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("keeps unknown callback origins blocked before sending", async () => {
    expect((await request("https://untrusted.example")).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects an outside Vercel subdomain before sending", async () => {
    expect((await request("https://evil-songscript.vercel.app")).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });
  it.each([false, true])("sends the same response with a db context, registered=%s", async (registered) => {
    const ctx = { db: { query: () => ({ withIndex: () => ({ first: async () => registered ? { email: "test@example.com" } : null }) }) } };
    const response = await request(undefined, ctx as unknown as GenericCtx<DataModel>);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: true });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("allows the production alias through Convex CORS", async () => {
    await import("./http");
    expect(registerRoutes.mock.calls[0][2].cors.allowedOrigins).toContain("https://songscript-eight.vercel.app");
  });
  it("returns a safe error when the provider is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const response = await request("https://songscript-ten.vercel.app");
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ code: "MAGIC_LINK_DELIVERY_FAILED", message: "Unable to send sign-in email. Please try again later." });
    expect(send).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("Magic link delivery failed", { code: "not_configured" });
  });
  it.each(["returned", "thrown"])("sanitizes %s provider failures", async (kind) => {
    const privateMessage = "recipient=test@example.com link=https://private.example/?token=secret";
    if (kind === "returned") send.mockResolvedValue({ data: null, error: { name: "validation_error", message: privateMessage } });
    else send.mockRejectedValue(new Error(privateMessage));
    const response = await request("https://songscript-ten.vercel.app");
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ code: "MAGIC_LINK_DELIVERY_FAILED", message: "Unable to send sign-in email. Please try again later." });
    expect(console.error).toHaveBeenCalledWith("Magic link delivery failed", { code: kind === "returned" ? "validation_error" : "provider_exception" });
    expect(console.error).toHaveBeenCalledTimes(1);
  });
  it("exposes the sanitized failure as the client result.error used by the login form", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "private" } });
    const auth = await testAuth();
    const { createAuthClient } = await import("better-auth/client");
    const client = createAuthClient({
      baseURL: "https://songscript-ten.vercel.app",
      plugins: [(await import("better-auth/client/plugins")).magicLinkClient()],
      fetchOptions: {
        customFetchImpl: (input, init) => auth.handler(new Request(input, init)),
      },
    });
    const result = await client.signIn.magicLink({ email: "test@example.com", callbackURL: "https://songscript-eight.vercel.app/dashboard" });
    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ status: 502, code: "MAGIC_LINK_DELIVERY_FAILED", message: "Unable to send sign-in email. Please try again later." });
  });
  it("does not log an unrecognized provider error name", async () => {
    send.mockResolvedValue({ data: null, error: { name: "test@example.com?token=secret", message: "private" } });
    expect((await request("https://songscript-ten.vercel.app")).status).toBe(502);
    expect(console.error).toHaveBeenCalledWith("Magic link delivery failed", { code: "provider_error" });
  });
});
