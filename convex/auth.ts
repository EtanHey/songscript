/**
 * Auth Trigger Functions
 *
 * These internal functions are called by Better Auth when user records
 * are created, updated, or deleted. They keep the app's `users` table
 * in sync with Better Auth's `user` table.
 *
 * DO NOT call these directly - they are wired up automatically by the
 * triggers in betterAuth.ts
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Called when a Better Auth user is created
export const onCreate = internalMutation({
  args: {
    model: v.string(),
    doc: v.any(),
  },
  handler: async () => {
    // Trigger logic is handled in betterAuth.ts triggers
    return null;
  },
});

// Called when a Better Auth user is updated
export const onUpdate = internalMutation({
  args: {
    model: v.string(),
    doc: v.any(),
    oldDoc: v.any(),
  },
  handler: async () => {
    // Trigger logic is handled in betterAuth.ts triggers
    return null;
  },
});

// Called when a Better Auth user is deleted
export const onDelete = internalMutation({
  args: {
    model: v.string(),
    doc: v.any(),
  },
  handler: async () => {
    // Trigger logic is handled in betterAuth.ts triggers
    return null;
  },
});
