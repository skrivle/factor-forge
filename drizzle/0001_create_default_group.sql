-- Create a default group for existing users
INSERT INTO "groups" ("id", "name", "created_at")
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Family', NOW())
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Assign all existing users (without a group) to the default group
UPDATE "users"
SET "group_id" = '00000000-0000-0000-0000-000000000001'::uuid
WHERE "group_id" IS NULL;
