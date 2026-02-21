# Bug Fixes Summary

## Date: 2026-02-21

### Issues Fixed

#### 1. Admin Role Difficulty Setting
**Problem:** Admin role was using 'easy' difficulty instead of inheriting parent's 'hard' difficulty.

**Root Cause:** The difficulty mapping only checked for `userRole === 'parent'`, so admin users defaulted to child config.

**Solution:** Updated difficulty logic in both game and practice pages to check for both parent and admin roles:
```typescript
const config = (userRole === 'parent' || userRole === 'admin') ? DIFFICULTY_CONFIGS.parent : DIFFICULTY_CONFIGS.child;
```

**Files Changed:**
- `app/game/page.tsx` (lines 34, 48, 169)
- `app/practice/page.tsx` (lines 47, 156)

---

#### 2. Hardcoded Tables in Game Intro Screen
**Problem:** The game intro screen showed hardcoded "Tafels: 1, 2, 3, 4, 5, 8 en 10" instead of displaying the group's configured `supported_tables`.

**Root Cause:** The intro screen wasn't fetching or displaying the group's configured tables.

**Solution:** 
1. Added state to fetch and store `supportedTables` from the group API
2. Added loading state to fetch group settings on component mount
3. Updated the display to show dynamic tables: `Tafels: {supportedTables.join(', ')}`

**Files Changed:**
- `app/game/page.tsx` - Added `fetchGroupSettings()`, `supportedTables` state, loading state, and dynamic display
- `app/practice/page.tsx` - Similar changes, combined with existing `fetchWeakQuestions()`
- `app/exercise/page.tsx` - Added `fetchGroupSettings()`, `availableTables` state, and dynamic table selection

---

#### 3. Configured Tables Not Used in Games
**Problem:** Games were using hardcoded `ALLOWED_TABLES = [1, 2, 3, 4, 5, 8, 10]` instead of the group's configured tables.

**Root Cause:** While the game engine functions accepted `allowedTables` as a parameter, the pages were using the default config without overriding the tables.

**Solution:**
1. Fetch group's `supported_tables` from `/api/groups`
2. Override the base config's `allowedTables` before starting the game:
   ```typescript
   const config = {
     ...baseConfig,
     allowedTables: supportedTables,
   };
   ```
3. Updated table weights in `generateQuestions()` to include weights for tables 6, 7, and 9 (they were missing and defaulted to weight 1)

**Files Changed:**
- `app/game/page.tsx` - Apply `supportedTables` to config
- `app/practice/page.tsx` - Apply `supportedTables` to config
- `app/exercise/page.tsx` - Use `availableTables` for table selection
- `lib/game/engine.ts` - Added weights for tables 6, 7, 9 in `tableWeights` record

---

## Testing Recommendations

1. **Admin Difficulty:**
   - Login as admin user
   - Start a game
   - Verify difficulty shows "MOEILIJK" (hard)
   - Verify time per question is 5 seconds with decreasing time
   - Complete game and check that database saves `difficulty_level: 'hard'`

2. **Configured Tables Display:**
   - Login as any user in a group
   - Navigate to game intro screen
   - Verify "Tafels:" shows the exact tables configured for the group
   - Try changing group settings via admin dashboard
   - Reload game page and verify tables update

3. **Configured Tables in Gameplay:**
   - Set group to only use tables [3, 4, 5] via admin dashboard
   - Start a game
   - Verify all questions only use tables 3, 4, and 5
   - Check that tables 1, 2, 6, 7, 8, 9, 10 don't appear in questions
   - Repeat for practice mode and exercise mode

---

## Implementation Notes

- All three pages (game, practice, exercise) now fetch group settings on mount
- The fetching is done in `useEffect` when `session?.user` is available
- For users without a group, the default `ALLOWED_TABLES` from `DIFFICULTY_CONFIGS` is used
- The game engine already supported dynamic tables via the `allowedTables` config parameter
- Table weighting system now supports all tables 1-10 with configurable weights

---

## No Breaking Changes

- Users without groups continue to work with default tables [1, 2, 3, 4, 5, 8, 10]
- Existing game sessions are unaffected
- API endpoints remain unchanged
- Database schema unchanged
