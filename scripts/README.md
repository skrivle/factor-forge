# Database Scripts

Utility scripts for database operations and debugging.

## Usage

All scripts require the `POSTGRES_URL` environment variable:

```bash
POSTGRES_URL='your_postgres_url' node scripts/script-name.js
```

## Available Scripts

### `test-streaks.js`
Tests the dynamic streak calculation for all users.

**Purpose**: Verify that the streak calculation logic is working correctly.

**Output**: Shows calculated streaks for each user based on their session data.

```bash
node scripts/test-streaks.js
```

### `migrate-remove-streak-fields.js`
**[ALREADY RUN]** Removes `current_streak` and `last_played_date` columns from `user_stats`.

**Purpose**: Migration script for the streak refactoring (Feb 19, 2026).

**Status**: Already executed. Kept for reference.

---

## Archived Scripts

These scripts were used during development and are no longer needed:

- `debug-streak.js` - Used to debug the original streak bug
- `fix-streaks.js` - Used to recalculate streaks before refactoring

You can safely delete these archived scripts.
