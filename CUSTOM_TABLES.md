# Custom Multiplication Tables Configuration

## Change Summary

The game now uses a **custom set of multiplication tables** instead of a range.

### Tables Used
- **1, 2, 3, 4, 5, 8, and 10**

This applies to **both Child and Parent modes**.

## What Changed

### 1. Game Engine (`lib/game/engine.ts`)
- Changed from `minTable`/`maxTable` range to `allowedTables` array
- Updated `generateQuestion()` to pick random numbers from the allowed tables
- Both difficulty configs now use: `[1, 2, 3, 4, 5, 8, 10]`

### 2. Game UI (`app/game/page.tsx`)
- Added "Tables: 1, 2, 3, 4, 5, 8 en 10" to game rules display

### 3. Documentation (`README.md`)
- Updated Game Modes section to reflect custom tables

## How It Works

```typescript
// Instead of generating numbers in a range (e.g., 1-12):
const num1 = Math.random() * (max - min + 1) + min;

// We now pick from specific tables:
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 8, 10];
const num1 = ALLOWED_TABLES[Math.floor(Math.random() * ALLOWED_TABLES.length)];
```

## Example Questions

With tables [1, 2, 3, 4, 5, 8, 10], you might see:
- 1 × 8 = 8
- 2 × 5 = 10
- 3 × 4 = 12
- 5 × 8 = 40
- 8 × 8 = 64
- 10 × 5 = 50
- 10 × 10 = 100

You will **NOT** see tables 6, 7, 9, 11, 12, etc.

## Customizing Further

To change which tables are used, edit the `ALLOWED_TABLES` constant in `lib/game/engine.ts`:

```typescript
// Current configuration
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 8, 10];

// Example: Add table 6
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 6, 8, 10];

// Example: Focus on harder tables
const ALLOWED_TABLES = [6, 7, 8, 9, 10];
```

## Testing

After making changes:
1. Refresh your browser (http://localhost:3000)
2. Start a new game
3. Verify questions only use the specified tables

---

**Status**: ✅ Implemented and tested
**Applies to**: All users (Child and Parent modes)
