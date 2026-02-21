-- Create invite codes table for single-use invite codes
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
