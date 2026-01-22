import { describe, it, expect, vi } from 'vitest';
import { getAuthUserId, requireAuth } from './authHelpers';

const mockCtx = (identity: { subject: string } | null) => {
  // Create a functional chain mock
  const chain = {
    withIndex: vi.fn(() => chain),
    filter: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    first: vi.fn().mockImplementation(async () => {
      return identity && identity.subject ? { _id: identity.subject, email: 'test@example.com' } : null;
    }),
    collect: vi.fn().mockResolvedValue([]),
  };

  return {
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(identity),
    },
    db: {
      query: vi.fn(() => chain),
    },
    // authComponent.safeGetAuthUser calls runQuery internally
    runQuery: vi.fn().mockImplementation(async () => {
      return identity ? { _id: identity.subject, email: 'test@example.com' } : null;
    }),
    runMutation: vi.fn(),
  };
};

describe('authHelpers', () => {
  describe('getAuthUserId', () => {
    it('should return userId when authenticated', async () => {
      const ctx = mockCtx({ subject: 'user_123' });
      const result = await getAuthUserId(ctx as any);
      expect(result).toBe('user_123');
    });

    it('should return null when not authenticated', async () => {
      const ctx = mockCtx(null);
      const result = await getAuthUserId(ctx as any);
      expect(result).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return userId when authenticated', async () => {
      const ctx = mockCtx({ subject: 'user_123' });
      const result = await requireAuth(ctx as any);
      expect(result).toBe('user_123');
    });

    it('should throw error when not authenticated', async () => {
      const ctx = mockCtx(null);
      await expect(requireAuth(ctx as any)).rejects.toThrow('Authentication required');
    });
  });
});