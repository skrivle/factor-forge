# Streak Refactoring - Final Implementation

## What Changed

We refactored the streak tracking system to **calculate streaks dynamically from session data** instead of storing them in the database.

### Before
- `current_streak` and `last_played_date` were stored in `user_stats` table
- Risk of data getting out of sync
- Complex logic to maintain consistency
- Every game had to update the streak field

### After
- Streaks are calculated on-demand from the `sessions` table
- **Single source of truth** - no data duplication
- No risk of sync issues
- Simpler, more maintainable code

## Benefits

✅ **Always accurate** - Streak is always calculated from actual play history  
✅ **No sync issues** - Can't get out of sync because there's only one data source  
✅ **Easier to debug** - Just look at sessions to understand a user's streak  
✅ **Flexible** - Can change streak calculation logic without data migration  
✅ **Cleaner schema** - Fewer redundant columns in the database  

## How It Works

### Streak Calculation Logic (`lib/db/queries.ts`)

```typescript
export async function calculateStreak(userId: string): Promise<number>
```

1. Fetches all unique play dates for the user from `sessions` table
2. Converts timestamps to local timezone (Europe/Brussels)
3. Checks if most recent play was today or yesterday
4. If yes, counts consecutive days backwards
5. If no, returns 0 (streak expired)

### Performance

The `calculateStreak()` function runs:
- When a user views their stats (home page)
- After completing a game (to show the updated streak)
- When loading the leaderboard (for all users)

The query is efficient:
- Uses `DISTINCT DATE()` to get unique play dates
- Has an index on `sessions(user_id)` for fast lookups
- Typically processes < 100 dates per user

For the leaderboard (10 users), this means ~10 extra queries, but they're fast and cacheable.

## Database Changes

### Removed Columns
- `user_stats.current_streak` ❌ (calculated dynamically)
- `user_stats.last_played_date` ❌ (not needed)

### Remaining Columns
- `user_stats.best_score` ✅ (aggregated value, makes sense to store)
- `user_stats.total_correct_answers` ✅ (aggregated value, makes sense to store)

## Files Changed

### Core Logic
1. `/lib/db/queries.ts` - Added `calculateStreak()` function, removed `updateStreak()`
2. `/lib/db/client.ts` - Updated `UserStats` interface to remove streak fields
3. `/app/api/game/save/route.ts` - Now calls `calculateStreak()` instead of `updateStreak()`
4. `/app/api/user/stats/route.ts` - Calculates streak dynamically when returning stats

### Database
5. `/db/schema.sql` - Updated to reflect new schema
6. `/db/migrations/002_remove_streak_fields.sql` - Migration to remove columns
7. `/scripts/migrate-remove-streak-fields.js` - Script to run the migration

### Documentation
8. `/lib/date-utils.ts` - Timezone utility functions (kept for future use)
9. `STREAK_FIX_SUMMARY.md` - Original bug fix documentation
10. `STREAK_REFACTORING.md` - This document

## Migration

Ran the migration script:
```bash
node scripts/migrate-remove-streak-fields.js
```

Result:
- ✅ Removed `current_streak` column from `user_stats`
- ✅ Removed `last_played_date` column from `user_stats`
- ✅ Verified streak calculation works correctly
- ✅ All existing data (scores, total_correct_answers) preserved

## Testing

Verified with `scripts/test-streaks.js`:
- Jelle: 2 days streak ✅
- Tilda: 0 (last played 2 days ago) ✅
- Karen: 0 (last played 2 days ago) ✅

## Future Improvements

If performance becomes an issue (unlikely), we could:
- Cache streak calculations (e.g., Redis)
- Add a materialized view in the database
- Calculate streaks once per minute and cache the result

But for now, the current implementation is simple and performant enough.

---

**Summary**: Streaks are now calculated from session data, eliminating data duplication and sync issues. This is a more robust and maintainable solution. 🎉
