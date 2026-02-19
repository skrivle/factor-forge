# Smart Practice Mode Update

## Summary

Updated the smart practice mode to work like regular exercise mode:
- ✅ **No time limits** - users can take as long as they need
- ✅ **Continuous practice** - cycles through adaptive questions
- ✅ **Does NOT affect stats** - doesn't count toward streak, best score, or total correct answers
- ✅ **Still tracks learning data** - saves question-level stats for adaptive algorithm

## Changes Made

### 1. New Component: `AdaptiveExerciseArena`
**File:** `components/exercise/AdaptiveExerciseArena.tsx`

Similar to the regular `ExerciseArena` but:
- Uses adaptive question generation based on weak areas
- Cycles through questions continuously (no fixed game length)
- No timer countdown
- Saves stats to `/api/practice/save-stats` (new endpoint)
- Shows "🎯 Slim" mode indicator
- Displays info: "Geen tijdslimiet - Focus op je zwakke punten - Telt niet mee voor streak"

### 2. New API Endpoint: `/api/practice/save-stats`
**File:** `app/api/practice/save-stats/route.ts`

- Saves question stats with `session_id = null`
- This marks the data as practice-only
- Does NOT:
  - Create a game session
  - Update `best_score`
  - Increment `total_correct_answers`
  - Affect streak calculation (since no session is created)

### 3. Database Migration
**File:** `db/migrations/004_allow_null_session_practice.sql`

```sql
ALTER TABLE question_stats ALTER COLUMN session_id DROP NOT NULL;
```

This allows `session_id` to be `NULL` for practice mode entries.

### 4. Updated Functions

**`lib/db/queries.ts`:**
- Modified `saveQuestionStats` to accept `sessionId: string | null`
- `null` = practice mode (doesn't count toward stats)
- Non-null = real game session (counts toward stats)

**`app/practice/page.tsx`:**
- Removed old game completion flow that saved to `/api/game/save`
- Now uses `AdaptiveExerciseArena` component
- Simplified to just start/stop practice
- No more "game over" screen with stats

## How It Works Now

### Smart Practice Mode (`/practice`):
1. Loads user's weak questions
2. Generates adaptive question set (70% weak, 30% random)
3. User practices continuously with no time limit
4. Stats auto-save every 5 questions (for adaptive learning only)
5. Does NOT create sessions or update user stats
6. Does NOT affect streak calculation

### Regular Exercise Mode (`/exercise`):
- Choose specific multiplication table
- Practice continuously with no time limit
- Local stats only (never saves to database)
- Does NOT affect streak or score

### Regular Game Mode (`/game`):
- Timed questions (60s for child, 5s for parent)
- Fixed 20 questions per game
- Creates session in database
- Updates best_score, total_correct_answers
- Affects streak calculation
- Game over screen with results

## Database Impact

### `question_stats` table:
- `session_id = NULL` → Practice mode (doesn't count toward stats)
- `session_id = <UUID>` → Real game session (counts toward stats)

### Streak calculation:
Streaks are calculated from the `sessions` table:
```sql
SELECT DISTINCT TO_CHAR(completed_at, 'YYYY-MM-DD') as play_date
FROM sessions
WHERE user_id = ${userId}
ORDER BY play_date DESC
```

Since practice mode doesn't create sessions, it cannot affect streaks. ✓

### Best score tracking:
```sql
UPDATE user_stats 
SET best_score = GREATEST(best_score, ${score})
WHERE user_id = ${userId}
```

Only called from `/api/game/save`, not from practice mode. ✓

## Migration Instructions

To apply the database changes, run:

```bash
node scripts/migrate.js
```

Or if using Vercel Postgres directly:

```sql
-- Execute this in your database
ALTER TABLE question_stats ALTER COLUMN session_id DROP NOT NULL;
```

## Testing Checklist

- [ ] Practice mode loads and shows adaptive questions
- [ ] No timer appears during practice
- [ ] Questions cycle continuously
- [ ] Stats save every 5 questions (check network tab)
- [ ] Exiting practice saves remaining stats
- [ ] Weak questions refresh after practice session
- [ ] Playing practice mode does NOT:
  - [ ] Create entries in `sessions` table
  - [ ] Update `best_score`
  - [ ] Update `total_correct_answers`
  - [ ] Affect streak calculation
- [ ] Regular game mode still:
  - [ ] Creates sessions
  - [ ] Updates stats
  - [ ] Affects streaks
  - [ ] Has timers

## UI Updates

The practice mode now clearly indicates it's different:
- Header shows "🎯 Slim" mode
- Bottom banner: "⏱️ Geen tijdslimiet - 🎯 Focus op je zwakke punten - 📊 Telt niet mee voor streak"
- Shows question counter: "Vraag X van Y" (cycles back to 1 after Y)

## Files Modified

1. ✨ NEW: `components/exercise/AdaptiveExerciseArena.tsx`
2. ✨ NEW: `app/api/practice/save-stats/route.ts`
3. ✨ NEW: `db/migrations/004_allow_null_session_practice.sql`
4. 📝 MODIFIED: `lib/db/queries.ts` (sessionId can be null)
5. 📝 MODIFIED: `app/practice/page.tsx` (uses new component)
6. 📝 MODIFIED: `db/migrations/003_add_question_stats.sql` (updated comment)
