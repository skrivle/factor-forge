# Streak Bug Fix Summary

## The Problem

### Issue 1: Streak Incrementing on Every Game
The `current_streak` field was incrementing on **every game played** instead of only once per day. This caused:
- Jelle's streak to reach 19 after playing ~24 games over 2 days
- Expected: streak of 2 (played on Feb 18 and Feb 19)
- Actual: streak of 19 (incremented on each of the 24 games)

### Issue 2: Timezone Confusion
Date comparisons were mixing UTC and local timezones:
- The database `DATE` type stores dates in UTC
- The code was comparing these UTC dates with local dates
- This caused off-by-one day errors in streak calculations
- Example: `2026-02-18T23:00:00.000Z` (Feb 18 at 11pm UTC) is actually Feb 19 at midnight in CET timezone

### Issue 3: Tilda's Correct Streak
Tilda's streak of 1 was actually **correct** - she only played on one unique day (Feb 18), even though she had 9 game sessions that day. The streak correctly showed 1.

## Root Cause

The bug occurred in `app/api/game/save/route.ts`:

```typescript
// OLD CODE (BUGGY)
const daysDiff = Math.floor((today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));

if (daysDiff === 0) {
  newStreak = stats.current_streak; // Keep streak
} else if (daysDiff === 1) {
  newStreak = stats.current_streak + 1; // Increment - BUG HERE!
}
```

When you played multiple games in one day:
1. Game 1: Sees yesterday's date → increments streak ✅
2. Game 2: **Still** sees yesterday's date (due to timezone issues) → increments again ❌
3. Game 3: Same problem → increments again ❌
...and so on for each game.

## The Fix

### 1. Created Date Utility Functions (`lib/date-utils.ts`)
- `getTodayString()`: Gets current date in Europe/Brussels timezone as YYYY-MM-DD
- `toLocalDateString(date)`: Converts any date to YYYY-MM-DD in local timezone
- `daysDiff(date1, date2)`: Calculates difference between two dates in days

### 2. Updated Streak Calculation Logic
- Now properly compares dates in the **same timezone** (Europe/Brussels)
- Correctly handles the "same day" check to prevent multiple increments
- Only increments streak once per day, regardless of how many games are played

### 3. Fixed Database Storage
- Updated `updateStreak()` to properly store dates using `::date` cast
- Ensures consistent date format in the database

### 4. Recalculated Existing Data
Created `scripts/fix-streaks.js` to recalculate all users' streaks based on their actual session history:
- Jelle: 19 → 2 (played on Feb 18 and Feb 19)
- Tilda: 1 → 1 (played only on Feb 18)
- Karen: 1 → 1 (played only on Feb 18)

## Testing

After the fix, the streak behavior is now correct:
- ✅ Playing multiple games on the same day = streak stays the same
- ✅ Playing on consecutive days = streak increments by 1
- ✅ Skipping 2+ days = streak resets to 1
- ✅ Timezone handling is consistent (Europe/Brussels)

## Files Changed

1. `/app/api/game/save/route.ts` - Fixed streak calculation logic
2. `/lib/db/queries.ts` - Fixed date storage in `updateStreak()`
3. `/lib/date-utils.ts` - **NEW** - Date utility functions for timezone handling
4. `/scripts/fix-streaks.js` - **NEW** - One-time script to fix existing data
5. `/scripts/debug-streak.js` - **NEW** - Debug script (can be kept for future debugging)

## What Happens When a User Cancels a Game?

When a user clicks the "Exit" button (✕) during a game:
- The `onExit` handler is called
- **No session is saved** to the database
- **No API call** is made to `/api/game/save`
- The streak is **not affected** at all (neither incremented nor reset)

This is the correct behavior - incomplete games don't count toward stats.
