# Invite-Only System with Parent-Led Group Creation

## Overview

Users need an invite code to sign up. Parents create groups and invite family members. This ensures proper setup and controlled access.

---

## User Flow

### 1. New Parent Signup
1. **Landing Page** → Enter invite code + name + PIN + role (parent/admin)
2. **Validate Code** → Check if invite code exists and is unused
3. **Create Account** → User created WITHOUT a group yet
4. **Setup Wizard** → Parent creates their family group
5. **Dashboard** → Parent can now add children and configure settings

### 2. Adding Family Members (Children)
1. **Parent generates child account** from admin dashboard
2. **Child gets name + PIN** (no invite code needed for children)
3. **Child joins parent's existing group** automatically

---

## Database Schema

### New Table: `invite_codes`

```sql
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  used_at TIMESTAMP
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_used_by ON invite_codes(used_by);
CREATE INDEX idx_invite_codes_is_used ON invite_codes(is_used);
```

### Migration File: `0006_add_invite_codes.sql`

```sql
-- Create invite codes table
CREATE TABLE IF NOT EXISTS "invite_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text UNIQUE NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "used_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "is_used" boolean DEFAULT FALSE NOT NULL,
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "used_at" timestamp
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_invite_codes_code" ON "invite_codes"("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invite_codes_used_by" ON "invite_codes"("used_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invite_codes_is_used" ON "invite_codes"("is_used");
--> statement-breakpoint

-- Insert some initial invite codes for testing
INSERT INTO "invite_codes" ("code")
VALUES 
  ('FAMILY-2024-ALPHA'),
  ('FAMILY-2024-BETA'),
  ('FAMILY-2024-GAMMA'),
  ('DEMO-CODE-001'),
  ('DEMO-CODE-002'),
  ('DEMO-CODE-003')
ON CONFLICT DO NOTHING;
```

---

## Schema Updates

### Update `lib/db/schema.ts`

```typescript
// Add invite codes table
export const inviteCodes = pgTable('invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  usedBy: uuid('used_by').references(() => users.id, { onDelete: 'set null' }),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
}, (table) => ({
  codeIdx: index('idx_invite_codes_code').on(table.code),
  usedByIdx: index('idx_invite_codes_used_by').on(table.usedBy),
  isUsedIdx: index('idx_invite_codes_is_used').on(table.isUsed),
}));

// Relations
export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  creator: one(users, {
    fields: [inviteCodes.createdBy],
    references: [users.id],
  }),
  usedByUser: one(users, {
    fields: [inviteCodes.usedBy],
    references: [users.id],
  }),
}));
```

### Update `lib/db/client.ts`

```typescript
export interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  is_used: boolean;
  created_at: Date;
  used_at: Date | null;
}
```

---

## Database Queries

### New file: `lib/db/invite-queries.ts`

```typescript
import { sql } from './client';
import type { InviteCode } from './client';

// Validate an invite code (single-use)
export async function validateInviteCode(code: string): Promise<boolean> {
  const result = await sql`
    SELECT * FROM invite_codes
    WHERE code = ${code}
      AND is_used = FALSE
  `;
  return result.length > 0;
}

// Get invite code details
export async function getInviteCode(code: string): Promise<InviteCode | null> {
  const result = await sql`
    SELECT * FROM invite_codes
    WHERE code = ${code}
  `;
  return result[0] as InviteCode | null;
}

// Mark invite code as used (single-use only)
export async function markInviteCodeUsed(code: string, userId: string): Promise<void> {
  await sql`
    UPDATE invite_codes
    SET 
      is_used = TRUE,
      used_by = ${userId},
      used_at = NOW()
    WHERE code = ${code}
      AND is_used = FALSE
  `;
}
```

**Note:** Removed `createInviteCode()` and `generateInviteCode()` functions - you'll add codes manually via SQL.

---

## Updated User Creation Flow

### Update `lib/db/queries.ts`

```typescript
// Modified createUser - now takes optional groupId
export async function createUser(
  name: string, 
  pin: string, 
  role: 'admin' | 'parent' | 'child' = 'child',
  groupId: string | null = null  // Optional group ID
) {
  const hashedPin = await bcrypt.hash(pin, 10);
  
  if (groupId) {
    // User is being added to an existing group (e.g., child added by parent)
    const result = await sql`
      INSERT INTO users (name, pin, role, group_id)
      VALUES (${name}, ${hashedPin}, ${role}, ${groupId})
      RETURNING *
    `;
    return result[0] as User;
  } else {
    // Parent/admin signing up - no group yet, will create one in setup wizard
    const result = await sql`
      INSERT INTO users (name, pin, role)
      VALUES (${name}, ${hashedPin}, ${role})
      RETURNING *
    `;
    return result[0] as User;
  }
}
```

**Note:** Keep `group_id` nullable for now to support the signup → setup wizard flow. Once they complete setup, they'll have a group.

---

## API Endpoints

### 1. Validate Invite Code API

**File:** `app/api/invite/validate/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { validateInviteCode, getInviteCode } from '@/lib/db/invite-queries';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invite code is required' 
      }, { status: 400 });
    }
    
    const isValid = await validateInviteCode(code);
    
    if (!isValid) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid, expired, or fully used invite code' 
      }, { status: 400 });
    }
    
    const inviteCode = await getInviteCode(code);
    
    return NextResponse.json({ 
      valid: true,
      code: inviteCode
    });
    
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
```

### 2. User Signup API (with invite code)

**File:** `app/api/auth/signup/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db/queries';
import { validateInviteCode, markInviteCodeUsed } from '@/lib/db/invite-queries';

export async function POST(req: Request) {
  try {
    const { name, pin, role, inviteCode } = await req.json();
    
    // Validate inputs
    if (!name || !pin || !inviteCode) {
      return NextResponse.json({ 
        error: 'Name, PIN, and invite code are required' 
      }, { status: 400 });
    }
    
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ 
        error: 'PIN must be exactly 4 digits' 
      }, { status: 400 });
    }
    
    // Only allow parent/admin roles to sign up (children are added by parents)
    if (role !== 'parent' && role !== 'admin') {
      return NextResponse.json({ 
        error: 'Invalid role' 
      }, { status: 400 });
    }
    
    // Validate invite code
    const isValidCode = await validateInviteCode(inviteCode);
    if (!isValidCode) {
      return NextResponse.json({ 
        error: 'Invalid or expired invite code' 
      }, { status: 400 });
    }
    
    // Create user (without group for now)
    const user = await createUser(name, pin, role, null);
    
    // Mark invite code as used
    await markInviteCodeUsed(inviteCode, user.id);
    
    // Initialize user stats
    await initializeUserStats(user.id);
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      message: 'Account created! Please complete setup by creating a family group.'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message?.includes('unique')) {
      return NextResponse.json({ 
        error: 'Username already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create account' 
    }, { status: 500 });
  }
}
```

### 3. ~~Admin: Generate Invite Codes~~ (REMOVED - Manual Only)

**You'll add codes manually via SQL instead. No UI needed.**

See "Adding Codes Manually" section above for SQL examples.

---

## Frontend Components

### 1. Updated Signup Page with Invite Code

**File:** `app/auth/signup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const [step, setStep] = useState<'invite' | 'details'>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'parent' | 'admin'>('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setStep('details');
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (err) {
      setError('Er ging iets mis bij het valideren van de code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!/^\d{4}$/.test(pin)) {
      setError('Pincode moet exact 4 cijfers zijn');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, role, inviteCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sign in the user
        const result = await signIn('credentials', {
          name,
          pin,
          redirect: false,
        });

        if (result?.ok) {
          // Redirect to setup wizard
          router.push('/setup');
        } else {
          setError('Account aangemaakt, maar inloggen mislukt');
        }
      } else {
        setError(data.error || 'Er ging iets mis');
      }
    } catch (err) {
      setError('Er ging iets mis bij het aanmaken van je account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <Card className="w-full max-w-md border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Factor Forge ⚡
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            {step === 'invite' 
              ? 'Voer je uitnodigingscode in'
              : 'Maak je account aan'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'invite' ? (
            <form onSubmit={handleValidateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite" className="text-white">Uitnodigingscode</Label>
                <Input
                  id="invite"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 font-mono"
                />
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-12"
              >
                {loading ? 'Valideren...' : 'Volgende'}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push('/auth/signin')}
                  className="text-gray-400 hover:text-white"
                >
                  Al een account? Aanmelden
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Naam</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Voer je naam in"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-white">4-cijferige pincode</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="bg-gray-900/50 border-purple-500/30 text-white text-2xl tracking-widest text-center focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">Rol</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'parent' | 'admin')}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded text-white focus:border-purple-500"
                >
                  <option value="parent">Ouder</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-12"
              >
                {loading ? 'Account aanmaken...' : 'Account Aanmaken'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('invite')}
                className="w-full text-gray-400 hover:text-white"
              >
                Terug
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Setup Wizard

**File:** `app/setup/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export default function SetupWizardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingGroup, setCheckingGroup] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [selectedTables, setSelectedTables] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]);

  useEffect(() => {
    // Check if user already has a group
    const checkGroup = async () => {
      try {
        const response = await fetch('/api/groups');
        if (response.ok) {
          const data = await response.json();
          if (data.group) {
            // User already has a group, redirect to home
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error checking group:', error);
      } finally {
        setCheckingGroup(false);
      }
    };

    if (session?.user) {
      checkGroup();
    }
  }, [session, router]);

  const toggleTable = (table: number) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Voer een groepsnaam in!');
      return;
    }

    if (selectedTables.length === 0) {
      alert('Selecteer minimaal één tafel!');
      return;
    }

    setLoading(true);

    try {
      // Create group
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
        }),
      });

      if (response.ok) {
        const { group } = await response.json();
        
        // Update group settings with selected tables
        await fetch('/api/admin/group-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: group.id,
            supportedTables: selectedTables.sort((a, b) => a - b),
          }),
        });

        alert('Groep succesvol aangemaakt!');
        router.push('/');
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Er ging iets mis bij het aanmaken van de groep.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Laden...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
              <Users className="inline-block h-10 w-10 mb-2" />
              <div>Welkom, {session.user.name}! 👋</div>
            </CardTitle>
            <p className="text-gray-300 text-lg">
              Laten we je gezinsgroep instellen
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-lg font-bold mb-3">
                  Groepsnaam
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white text-lg"
                  placeholder="Bijv: Familie Jansen"
                />
              </div>

              <div>
                <label className="block text-white text-lg font-bold mb-3">
                  Kies welke tafels jullie willen oefenen
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((table) => (
                    <button
                      key={table}
                      type="button"
                      onClick={() => toggleTable(table)}
                      className={`
                        p-3 rounded font-bold text-lg transition-all
                        ${
                          selectedTables.includes(table)
                            ? 'bg-purple-600 text-white border-2 border-purple-400'
                            : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
                        }
                        hover:scale-105 cursor-pointer
                      `}
                    >
                      {table}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Je kunt dit later aanpassen in het admin dashboard
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                <div className="text-blue-400 font-bold mb-2">ℹ️ Over je groep</div>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Je wordt automatisch lid van de groep</li>
                  <li>• Je kunt gezinsleden toevoegen via het admin dashboard</li>
                  <li>• Alleen groepsleden kunnen elkaars voortgang zien</li>
                  <li>• Het klassement wordt gefilterd op je groep</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading || !groupName.trim() || selectedTables.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl h-14"
              >
                {loading ? 'Groep aanmaken...' : 'Start Oefenen! 🚀'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Implementation Strategy - SIMPLIFIED

**Key Decision:** No app-level admin UI needed. Just manually add codes to the database.

### What We Build:
1. ✅ Invite codes table
2. ✅ Validation during signup
3. ✅ Mark codes as used when claimed
4. ❌ **No admin UI for generating codes** (you'll do it manually)
5. ❌ **No super admin role** (keeps codebase clean)

### Adding Codes Manually

When you need new invite codes, just run SQL:

```sql
-- Add a single code
INSERT INTO invite_codes (code) 
VALUES ('FAMILY-2024-001');

-- Add multiple codes at once
INSERT INTO invite_codes (code) 
VALUES 
  ('FAMILY-2024-001'),
  ('FAMILY-2024-002'),
  ('FAMILY-2024-003'),
  ('DEMO-CODE-001'),
  ('DEMO-CODE-002');

-- Generate codes with a pattern
INSERT INTO invite_codes (code) 
VALUES 
  ('ALPHA-001'), ('ALPHA-002'), ('ALPHA-003'),
  ('BETA-001'), ('BETA-002'), ('BETA-003');
```

### Check Unused Codes

```sql
-- See all unused codes
SELECT code, created_at 
FROM invite_codes 
WHERE is_used = FALSE
ORDER BY created_at DESC;

-- Count unused codes
SELECT COUNT(*) as unused_count 
FROM invite_codes 
WHERE is_used = FALSE;
```

### Check Used Codes

```sql
-- See who used which codes
SELECT 
  ic.code,
  ic.used_at,
  u.name as used_by_name,
  u.role
FROM invite_codes ic
LEFT JOIN users u ON ic.used_by = u.id
WHERE ic.is_used = TRUE
ORDER BY ic.used_at DESC;
```

---

### Current Schema
The `users` table has a `role` field: `'admin' | 'parent' | 'child'`

### Recommended Role Usage

**1. `admin` = App-Level Administrator**
- Full system access
- Can generate invite codes
- Can view all groups (optional feature)
- Manages the entire app
- **Use case:** You, as the app owner

**2. `parent` = Group Admin/Parent**
- Manages their own family group
- Can add children to their group
- Can configure group settings
- **Cannot** generate invite codes
- **Use case:** Parents managing their family

**3. `child` = Regular User**
- Can only use the app
- No administrative features
- **Use case:** Children in families

### Helper Function to Check App Admin

Add to `lib/db/queries.ts`:

```typescript
// Check if user is an app-level admin (not just group admin)
export async function isAppAdmin(userId: string): Promise<boolean> {
  const result = await sql`
    SELECT role FROM users WHERE id = ${userId}
  `;
  
  if (result.length === 0) return false;
  
  const user = result[0];
  return user.role === 'admin';
}
```

### Alternative: Add Separate `is_app_admin` Flag

If you want to separate app-level admin from group admin more explicitly:

```sql
ALTER TABLE users ADD COLUMN is_app_admin BOOLEAN DEFAULT FALSE;

-- Make your user an app admin
UPDATE users SET is_app_admin = TRUE WHERE id = 'your-user-id';
```

Then check:
```typescript
export async function isAppAdmin(userId: string): Promise<boolean> {
  const result = await sql`
    SELECT is_app_admin FROM users WHERE id = ${userId}
  `;
  return result[0]?.is_app_admin === true;
}
```

**Recommendation:** Keep it simple with the `role = 'admin'` check for now. You can always add the flag later if needed.

---

## Implementation Checklist - SIMPLIFIED

### Database
- [ ] Create migration `0006_add_invite_codes.sql`
- [ ] Add invite_codes table schema to `lib/db/schema.ts`
- [ ] Add InviteCode type to `lib/db/client.ts`
- [ ] Run migration
- [ ] **Manually insert initial invite codes via SQL**

### Backend
- [ ] Create `lib/db/invite-queries.ts` with invite code functions:
  - `validateInviteCode(code)` - check if code is unused
  - `markInviteCodeUsed(code, userId)` - mark as used
  - `getInviteCode(code)` - get code details
- [ ] Update `createUser()` in `lib/db/queries.ts` to accept optional groupId
- [ ] Create `/api/invite/validate` endpoint
- [ ] Create `/api/auth/signup` endpoint

### Frontend
- [ ] Create `app/auth/signup/page.tsx` (2-step: invite code → details)
- [ ] Create `app/setup/page.tsx` (setup wizard for parents)
- [ ] Update `app/auth/signin/page.tsx` to add "Sign Up" link
- [ ] Update group admin dashboard (`app/admin/page.tsx`) to show "Add Child" functionality

### Testing
- [ ] Test invite code validation
- [ ] Test signup flow with valid/invalid codes
- [ ] Test that used codes can't be reused
- [ ] Test setup wizard
- [ ] Test adding children to group

**Note:** No admin UI needed - just add codes manually via SQL when needed!

---

## Initial Invite Codes (Manual Insert)

Run this SQL to add some test codes:

```sql
-- Single-use codes for testing
INSERT INTO invite_codes (code)
VALUES 
  ('FAMILY-2024-ALPHA'),
  ('FAMILY-2024-BETA'),
  ('FAMILY-2024-GAMMA'),
  ('DEMO-CODE-001'),
  ('DEMO-CODE-002'),
  ('DEMO-CODE-003'),
  ('DEMO-CODE-004'),
  ('DEMO-CODE-005');
```

Or generate them programmatically in a one-time script:

```typescript
// scripts/generate-invite-codes.ts
import { sql } from '@/lib/db/client';

async function generateCodes() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codes: string[] = [];
  
  // Generate 20 codes
  for (let i = 0; i < 20; i++) {
    const code = Array.from({ length: 3 }, () => 
      Array.from({ length: 4 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    ).join('-');
    
    codes.push(code);
  }
  
  // Insert all codes
  for (const code of codes) {
    await sql`INSERT INTO invite_codes (code) VALUES (${code})`;
    console.log(`✅ Created: ${code}`);
  }
}

generateCodes().then(() => console.log('Done!'));
```

Run once: `npx tsx scripts/generate-invite-codes.ts`

---

## Future Enhancements

1. **Bulk invite code generation script** (optional one-time script)
2. **Export unused codes** to text file for distribution
3. **Simple admin page** to view code usage (read-only, no generation)
4. **Code prefix patterns** (FAMILY-*, DEMO-*, etc.)

---

## Summary

### What Users Do:
1. Get invite code from you (manually distributed)
2. Sign up with code at `/auth/signup`
3. Create their family group in setup wizard
4. Add children from their admin dashboard

### What You Do:
1. Manually add codes to database via SQL when needed
2. Check usage via SQL queries
3. No app-level admin UI needed - keeps codebase clean!

## Questions Resolved

✅ Parents create groups during setup wizard
✅ Invite codes required for parent signup only
✅ Single-use codes stored in database
✅ **Codes added manually via SQL (no admin UI)**
✅ **No app-level admin role needed**
✅ Children added by parents (no invite code needed)
