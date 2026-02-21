# All Users Must Have a Group - Implementation Plan

## Current State Analysis

### What Works Now
- Users can exist without a group (`group_id` is nullable in schema)
- Games work with hardcoded default tables when no group exists
- Admin dashboard requires a group to function
- Tests require a group (only parents/admins in groups can create tests)

### Problems with Current Approach
1. **Inconsistent Configuration:** Users without groups use hardcoded defaults while grouped users use configured tables
2. **Feature Limitations:** Key features (tests, admin dashboard) don't work for ungrouped users
3. **Complexity:** Need conditional logic everywhere to handle "no group" case
4. **Poor UX:** New users may not understand why some features are unavailable

---

## Proposed Solution: All Users Must Have a Group

### Benefits
1. **Consistent Configuration:** All users always have configured multiplication tables
2. **Simplified Codebase:** Remove all null-group checks and fallback logic
3. **Better UX:** All features available to all users from day one
4. **Easier Onboarding:** Auto-create personal groups for new users
5. **Future-Proof:** Easier to add group-level features (settings, permissions, etc.)

---

## Implementation Strategy

### Phase 1: Database Schema Changes

#### 1.1 Make `group_id` Required (NOT NULL)
```sql
-- Migration: 0006_require_group_membership.sql

-- First ensure all users have a group
UPDATE users 
SET group_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE group_id IS NULL;

-- Then make the column NOT NULL
ALTER TABLE users 
ALTER COLUMN group_id SET NOT NULL;
```

#### 1.2 Update Schema Definition
```typescript
// lib/db/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  pin: text('pin').notNull(),
  role: text('role').default('child').notNull().$type<'admin' | 'parent' | 'child'>(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(), // NOW REQUIRED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Important:** Change `onDelete: 'set null'` to `onDelete: 'cascade'` since users MUST have a group.

---

### Phase 2: User Creation Flow Updates

#### 2.1 Update `createUser()` Function
```typescript
// lib/db/queries.ts

// NEW: Create user with automatic group creation
export async function createUser(
  name: string, 
  pin: string, 
  role: 'admin' | 'parent' | 'child' = 'child'
) {
  const hashedPin = await bcrypt.hash(pin, 10);
  
  // Create a personal group for the user
  const groupName = role === 'child' 
    ? `${name}'s Practice Space`
    : `${name}'s Family`;
    
  const group = await createGroup(groupName);
  
  // Create user and assign to their new group
  const result = await sql`
    INSERT INTO users (name, pin, role, group_id)
    VALUES (${name}, ${hashedPin}, ${role}, ${group.id})
    RETURNING *
  `;
  
  return result[0] as User;
}
```

**Alternative Approach:** Create a shared "Personal Users" group for all individual users
```typescript
// Check if "Personal Users" group exists, create if not
const personalGroupId = await getOrCreatePersonalGroup();

const result = await sql`
  INSERT INTO users (name, pin, role, group_id)
  VALUES (${name}, ${hashedPin}, ${role}, ${personalGroupId})
  RETURNING *
`;
```

#### 2.2 Remove "Create Group" Requirement
Currently parents need to create a group to use certain features. With auto-groups, remove this barrier.

---

### Phase 3: Code Cleanup

#### 3.1 Remove Null Checks for Groups
**Files to Update:**
- `app/game/page.tsx` - Remove `supportedTables` default fallback
- `app/practice/page.tsx` - Remove default fallback
- `app/exercise/page.tsx` - Remove default fallback
- `app/admin/page.tsx` - Remove "no group" UI state
- `app/tests/create/page.tsx` - Remove "no group" UI state

**Before:**
```typescript
const [supportedTables, setSupportedTables] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]); // Fallback

const fetchGroupSettings = async () => {
  try {
    const response = await fetch('/api/groups');
    if (response.ok) {
      const data = await response.json();
      if (data.group?.supported_tables) {
        setSupportedTables(data.group.supported_tables);
      }
    }
  } catch (error) {
    console.error('Error fetching group settings:', error);
  }
};
```

**After:**
```typescript
const [supportedTables, setSupportedTables] = useState<number[]>([]); // Will always be populated
const [loading, setLoading] = useState(true);

const fetchGroupSettings = async () => {
  try {
    const response = await fetch('/api/groups');
    if (!response.ok) throw new Error('Failed to fetch group');
    
    const data = await response.json();
    setSupportedTables(data.group.supported_tables);
  } catch (error) {
    console.error('Error fetching group settings:', error);
    // Show error UI - this should never happen now
  } finally {
    setLoading(false);
  }
};
```

#### 3.2 Update API Endpoints
**Files to Update:**
- `app/api/groups/route.ts` - Simplify logic (users always have groups)
- `app/api/leaderboard/route.ts` - Remove null group handling

#### 3.3 Remove Hardcoded Table Constants
Since all users now have configured tables, we can remove hardcoded defaults:
```typescript
// lib/game/engine.ts

// REMOVE THIS:
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 8, 10];

// Keep DIFFICULTY_CONFIGS but with empty arrays (will be populated from group settings)
export const DIFFICULTY_CONFIGS = {
  child: {
    allowedTables: [], // Must be set from group settings
    questionCount: 20,
    timePerQuestion: 60,
    decreaseTime: false,
    operations: ['multiplication', 'division'] as OperationType[],
  } as GameConfig,
  parent: {
    allowedTables: [], // Must be set from group settings
    questionCount: 20,
    timePerQuestion: 5,
    decreaseTime: true,
    operations: ['multiplication', 'division'] as OperationType[],
  } as GameConfig,
};
```

---

### Phase 4: Group Management Enhancements

#### 4.1 Allow Users to Switch Groups
Currently, group membership is managed by admins. Consider allowing users to:
- Leave their current group
- Create a new group
- Join existing groups (with invite codes?)

#### 4.2 Default Group Settings
When auto-creating groups, set sensible defaults:
```typescript
const DEFAULT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // All tables

export async function createGroup(name: string, supportedTables: number[] = DEFAULT_TABLES) {
  const result = await sql`
    INSERT INTO groups (name, supported_tables)
    VALUES (${name}, ${supportedTables})
    RETURNING *
  `;
  return result[0] as Group;
}
```

---

## Migration Plan

### Step 1: Data Migration ✅
Already done via `0001_create_default_group.sql` - all existing users have groups

### Step 2: Schema Migration
Create new migration:
```bash
npm run db:generate
# Name it: 0006_require_group_membership
```

### Step 3: Code Updates (In Order)
1. Update `createUser()` to auto-create groups
2. Update schema definition (`lib/db/schema.ts`)
3. Run migration to make `group_id` NOT NULL
4. Remove null checks from all pages
5. Simplify API endpoints
6. Update tests and error handling

### Step 4: Testing
- Test new user creation (should auto-create group)
- Test that games load with group tables
- Test admin dashboard (should always work)
- Test tests feature (should always work)
- Test that no "no group" UI states appear

---

## Rollback Plan

If issues arise:
1. Revert schema migration (make `group_id` nullable again)
2. Restore fallback logic in pages
3. Keep auto-group creation (it's still useful)

---

## Alternative Approaches

### Option A: Personal Groups for Each User
**Pros:** True isolation, full control per user
**Cons:** May create many groups, harder to manage families

### Option B: Shared "Personal Users" Group
**Pros:** Simple, one group for all individual users
**Cons:** All personal users see same leaderboard, can see each other

### Option C: Family-Only Groups (Recommended)
**Pros:** Best for intended use case (family practice), clean separation
**Cons:** Need good onboarding flow to group people

---

## Recommendation

Implement **Option C (Family-Only Groups)** with these specifics:

1. **Auto-create personal group on signup** with user's name
2. **Allow parents/admins to merge users into families** via invite system
3. **Make `group_id` required** in schema for data integrity
4. **Remove all null-group fallbacks** to simplify code
5. **Default to all tables (1-10)** for new groups

This provides the best balance of simplicity, family-focus, and flexibility.

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Create database migration for NOT NULL constraint
3. ⏳ Update `createUser()` function
4. ⏳ Update schema definition
5. ⏳ Run migration
6. ⏳ Remove null checks from pages
7. ⏳ Test thoroughly
8. ⏳ Update documentation

---

## Questions to Resolve

1. **Should we prevent users from being in a group alone long-term?**
   - e.g., nudge them to invite family members after N days?

2. **Should children be able to leave groups or create new ones?**
   - Probably not - only parents/admins should manage groups

3. **What happens to a group when the last member leaves?**
   - Auto-delete empty groups?
   - Keep them for historical data?

4. **Should we show a setup wizard for new parents/admins?**
   - Guide them through: create account → create family group → add members → configure tables

5. **How should leaderboards work for single-user groups?**
   - Hide leaderboard if only one member?
   - Show "Invite family members to compete!" message?
