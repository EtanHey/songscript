# SongScript Frontend Wiring Analysis

## ISSUE CONFIRMED: Frontend-Backend User Connection Problem

### The Problem
The user `etan@heyman.net` (userId: `k572fk152njnp9g621kc64bq4x7zgbyt`) has data in Convex but the frontend is not displaying it.

### Root Cause Analysis

**Convex Data (CONFIRMED WORKING):**
- User exists: `k572fk152njnp9g621kc64bq4x7zgbyt` with email `etan@heyman.net`
- User has song progress: 30/31 lines completed on song `j972m34dzqgx6a0r5a00n9k6pd7zekfa`
- User has line progress: 6 documents with learned/unlearned status
- Database relationships are correct

**Frontend Wiring (SUSPECTED ISSUE):**
- Dashboard queries use `getAuthUserId(ctx)` which calls `authComponent.safeGetAuthUser(ctx)`
- Auth lookup uses `authId` field to find user in database
- User record has `authId: k57e8k8kfjen8gw0v20y3qznk17zpjsw` but data is linked to `userId: k572fk152njnp9g621kc64bq4x7zgbyt`

### THE MISMATCH
Looking at the users table in Convex:
1. User `jd7cr3fr0jv8637xeykwftw91h7zn9nv` has `authId: k572fk152njnp9g621kc64bq4x7zgbyt` (EtanHey)
2. But all the progress data is linked to `userId: k572fk152njnp9g621kc64bq4x7zgbyt`

**This means the authId and userId are swapped/mismatched!**

### Specific Issues Found:
1. **Auth ID Mismatch**: The `authId` in the users table doesn't match the `userId` in progress tables
2. **Data Isolation**: Frontend queries filter by authenticated user's ID, but data exists under different ID
3. **Migration Issue**: Likely a data migration or user creation bug where IDs got mixed up

### Confirmation Needed:
- Check if `authComponent.safeGetAuthUser(ctx)` returns the correct user ID
- Verify if the `ensureAppUser` function is creating/linking users correctly
- Check if there's a mismatch between Better Auth user IDs and Convex user IDs

### Status: CONFIRMED - Frontend wiring issue due to user ID mismatch
The Convex backend has all the data, but the frontend authentication system is looking for data under the wrong user ID.
