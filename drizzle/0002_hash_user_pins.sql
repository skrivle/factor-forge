-- This migration is handled by a custom TypeScript script
-- See: scripts/migrations/0002_hash_user_pins.ts
-- The script hashes all existing plain-text PINs using bcrypt

-- No SQL changes needed, all work done in the TypeScript migration
SELECT 1;
