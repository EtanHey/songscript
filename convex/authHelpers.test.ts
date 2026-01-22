import { describe, it, expect, vi } from 'vitest';
import { getAuthUserId, requireAuth } from './authHelpers'; // Assuming authHelpers is in the same directory

// Mock the Convex context
const mockCtx = (identity: { subject: string } | null) => {
  const authUser = identity ? { _id: identity.subject, userId: identity.subject } : null;
  return {
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(identity),
    },
    // Mock runQuery as it is likely called by safeGetAuthUser
    runQuery: vi.fn().mockResolvedValue(authUser),
    // Also mock db.query in case it's called indirectly or by other parts of the logic
    db: {
      query: vi.fn().mockImplementation((tableName: string) => {
        if (tableName === "users") {
          return {
            withIndex: vi.fn().mockImplementation((indexName: string, queryFn: (q: any) => any) => {
              if (identity && indexName === "authId") {
                return {
                  first: vi.fn().mockResolvedValue(authUser),
                };
              }
              return { first: vi.fn().mockResolvedValue(null) };
            }),
          };
        }
        return { first: vi.fn().mockResolvedValue(null) }; // Default for other tables
      }),
    },
  };
};

describe('authHelpers', () => {
  describe('getAuthUserId', () => {
    it('returns userId when authenticated', async () => {
      const ctx = mockCtx({ subject: 'user-123' });
      const result = await getAuthUserId(ctx);
      expect(result).toBe('user-123');
    });

    it('returns null when not authenticated', async () => {
      const ctx = mockCtx(null);
      const result = await getAuthUserId(ctx);
      expect(result).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('throws ConvexError when not authenticated', async () => {
      const ctx = mockCtx(null);
      // Using a direct assertion for the expected error type if possible, otherwise check message
      await expect(requireAuth(ctx)).rejects.toThrow('Authentication required');
    });

    it('returns userId when authenticated', async () => {
      const ctx = mockCtx({ subject: 'user-456' });
      const result = await requireAuth(ctx);
      expect(result).toBe('user-456');
    });
  });
});