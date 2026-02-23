-- Spaced repetition schedule: one row per user per fact (num1, num2, operation)
CREATE TABLE IF NOT EXISTS "spaced_repetition_schedule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "num1" integer NOT NULL,
  "num2" integer NOT NULL,
  "operation" text NOT NULL,
  "interval_days" integer DEFAULT 1 NOT NULL,
  "easiness_factor" real DEFAULT 2.5 NOT NULL,
  "next_review_date" date NOT NULL,
  "repetitions" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "updated_at" timestamp DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "srs_user_fact_unique" ON "spaced_repetition_schedule" ("user_id", "num1", "num2", "operation");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_srs_user_next" ON "spaced_repetition_schedule" ("user_id", "next_review_date");
