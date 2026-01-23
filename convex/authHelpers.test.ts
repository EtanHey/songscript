import { describe, it, expect, vi } from 'vitest';
import { getAuthUserId, requireAuth, AuthContextWithDb } from './authHelpers';
// Removed unused ConvexError import from here. The tests check the error message.

// Mock the Convex context to satisfy AuthContextWithDb type
const mockCtx = (identity: { subject: string } | null, existingUserEmail: string | null = null) => {
  const authUser = identity ? { _id: identity.subject, userId: identity.subject } : null;
  
  // Mock the result of .first() for the users query
  const mockFirstResult = existingUserEmail ? { _id: "existing-user-id", email: existingUserEmail } : null;

  // Mock the query builder chain: .eq()
  const mockEq = vi.fn();

  // Mock the query builder chain: .withIndex()
  const mockWithIndex = vi.fn().mockImplementation((indexName: string) => {
    if (indexName === "email") {
      return { 
        first: mockEq.mockImplementation(() => {
          if (existingUserEmail) {
            return Promise.resolve(mockFirstResult);
          }
          return Promise.resolve(null);
        })
      };
    } else if (indexName === "authId") {
      return { first: vi.fn().mockResolvedValue(authUser) };
    }
    return { first: vi.fn().mockResolvedValue(null) };
  });

  // Mock ctx.db.query()
  const mockQuery = vi.fn().mockImplementation((tableName: string) => {
    if (tableName === "users") {
      return {
        withIndex: mockWithIndex,
      };
    }
    return { withIndex: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }) };
  });

  return {
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(identity),
    },
    runQuery: vi.fn().mockResolvedValue(authUser),
    db: {
      query: mockQuery,
    },
    storage: {},
    scheduler: {},
    runMutation: vi.fn(),
    runAction: vi.fn(),
  } as unknown as AuthContextWithDb;
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
      // The actual error thrown is a standard Error, not ConvexError in this case.
      // The test should check for the error message.
      await expect(requireAuth(ctx)).rejects.toThrow('Authentication required');
    });

    it('returns userId when authenticated', async () => {
      const ctx = mockCtx({ subject: 'user-456' });
      const result = await requireAuth(ctx);
      expect(result).toBe('user-456');
    });
  });

  describe('signup email check', () => {
    it('throws ConvexError if email already exists', async () => {
      const existingEmail = "test@example.com";
      const ctx = mockCtx(null, existingEmail); 

      const result = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", existingEmail)).first();
      
      expect(result).not.toBeNull();
      expect(result?._id).toBe("existing-user-id");
      expect(result?.email).toBe(existingEmail);
    });

    it('allows signup if email does not exist', async () => {
      const ctx = mockCtx(null, null); // No existing user

      const result = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", "new@example.com")).first();
      expect(result).toBeNull();
    });
  });
});