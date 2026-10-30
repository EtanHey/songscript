// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPracticeHistory } from "./practiceLog";
import { getAuthUserId } from "./authHelpers";
import type { Doc } from "./_generated/dataModel";
import type { api } from "./_generated/api";
import type { FunctionReturnType } from "convex/server";

vi.mock("./authHelpers", () => ({ getAuthUserId: vi.fn(), requireAuth: vi.fn() }));

type PracticeLog = Pick<Doc<"userPracticeLog">,
  "userId" | "date" | "practiceCount" | "totalSeconds" | "totalPoints">;

const log = (date: string, userId = "test-user"): PracticeLog => ({
  userId, date, practiceCount: 2, totalSeconds: 120, totalPoints: 4,
});

// Only the database boundary is faked; execute the exported Convex query handler.
async function history(logs: PracticeLog[], days = 90): Promise<FunctionReturnType<typeof api.practiceLog.getPracticeHistory>> {
  const ctx = {
    db: {
      query: (table: string) => {
        expect(table).toBe("userPracticeLog");
        return {
          withIndex: (index: string, range: (q: unknown) => unknown) => {
            expect(index).toBe("by_user");
            let owner: string;
            const q = { eq: (field: string, value: string) => {
              expect(field).toBe("userId");
              owner = value;
              return q;
            } };
            range(q);
            return { collect: async () => logs.filter(l => l.userId === owner) };
          },
        };
      },
    },
  };
  // Convex exposes the handler at runtime but strips it from its public types.
  const handler = Reflect.get(getPracticeHistory, "_handler");
  if (typeof handler !== "function") throw new Error("Missing Convex query handler");
  return Reflect.apply(handler, undefined, [ctx, { days }]);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-30T12:00:00Z"));
  vi.mocked(getAuthUserId).mockResolvedValue("test-user");
});
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

describe("practice history", () => {
  it("keeps the lifetime longest after every practice day leaves the heatmap", async () => {
    const result = await history([log("2025-02-10"), log("2025-02-11")]);
    expect(result).toMatchObject({
      currentStreak: 0, longestStreak: 2, practiceData: [],
      totalSessions: 0, totalTimeSeconds: 0, totalPoints: 0,
    });
  });

  it("does not truncate an ongoing streak at the requested history boundary", async () => {
    const result = await history([
      log("2026-10-26"), log("2026-10-27"), log("2026-10-28"),
      log("2026-10-29"), log("2026-10-30"),
    ], 1);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.practiceData.map((d: PracticeLog) => d.date)).toEqual(["2026-10-29", "2026-10-30"]);
    expect(result).toMatchObject({ totalSessions: 4, totalTimeSeconds: 240, totalPoints: 8 });
  });

  it("counts unique dates, breaks at gaps, and excludes another user's logs", async () => {
    const result = await history([
      log("2025-02-11"), log("2025-02-10"), log("2025-02-10"),
      log("2025-02-13"), log("2025-02-12", "other-user"),
      log("2026-10-30", "other-user"),
    ]);
    expect(result.longestStreak).toBe(2);
    expect(result.currentStreak).toBe(0);
    expect(result.practiceData).toEqual([]);
  });

  it("allows the current streak to end yesterday in UTC", async () => {
    vi.setSystemTime(new Date("2026-10-30T00:30:00Z"));
    const result = await history([log("2026-10-28"), log("2026-10-29")]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it("walks UTC days across a daylight-saving change", async () => {
    vi.stubEnv("TZ", "America/New_York");
    vi.setSystemTime(new Date("2026-11-02T00:30:00Z"));
    const result = await history([
      log("2026-10-31"), log("2026-11-01"), log("2026-11-02"),
    ], 1);
    expect(result.currentStreak).toBe(3);
    expect(result.practiceData.map((d: PracticeLog) => d.date)).toEqual(["2026-11-01", "2026-11-02"]);
  });

  it("returns the full 18-week heatmap range when requested", async () => {
    const result = await history([log("2026-07-03"), log("2026-07-04")], 126);
    expect(result.practiceData).toHaveLength(2);
    expect(result.daysTracked).toBe(126);
  });

  it("keeps a new account empty", async () => {
    expect(await history([])).toMatchObject({ currentStreak: 0, longestStreak: 0, practiceData: [] });
  });

  it("returns no history to an unauthenticated caller", async () => {
    vi.mocked(getAuthUserId).mockResolvedValue(null);
    expect(await history([log("2026-10-30")])).toMatchObject({
      currentStreak: 0, longestStreak: 0, practiceData: [],
    });
  });
});
