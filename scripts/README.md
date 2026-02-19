# Database Scripts

Historical database migration scripts.

## Migration History

### `migrate-remove-streak-fields.js`
**[ALREADY RUN - Feb 19, 2026]**

Removes `current_streak` and `last_played_date` columns from `user_stats`.

**Purpose**: Migrated from storing streaks in the database to calculating them dynamically from session data.

**Status**: Already executed. Kept for historical reference.

---

## Notes

All test and debug scripts have been cleaned up. Streaks are now calculated dynamically from the `sessions` table in `/lib/db/queries.ts`.
