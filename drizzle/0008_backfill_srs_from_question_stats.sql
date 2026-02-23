-- Backfill spaced_repetition_schedule from question_stats (one-time data migration)
-- For each (user_id, num1, num2, operation): use last response by created_at.
-- Last correct within 7 days -> interval 3, next review in 3 days; else -> due today.
INSERT INTO "spaced_repetition_schedule" (
  "id",
  "user_id",
  "num1",
  "num2",
  "operation",
  "interval_days",
  "easiness_factor",
  "next_review_date",
  "repetitions",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  "user_id",
  "num1",
  "num2",
  "operation",
  CASE
    WHEN "is_correct" AND ("created_at"::date >= CURRENT_DATE - INTERVAL '7 days') THEN 3
    ELSE 1
  END,
  2.5,
  CASE
    WHEN "is_correct" AND ("created_at"::date >= CURRENT_DATE - INTERVAL '7 days') THEN ("created_at"::date + 3)
    ELSE CURRENT_DATE
  END,
  CASE WHEN "is_correct" AND ("created_at"::date >= CURRENT_DATE - INTERVAL '7 days') THEN 1 ELSE 0 END,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT ON ("user_id", "num1", "num2", "operation")
    "user_id", "num1", "num2", "operation", "is_correct", "created_at"
  FROM "question_stats"
  ORDER BY "user_id", "num1", "num2", "operation", "created_at" DESC
) last_per_fact
ON CONFLICT ("user_id", "num1", "num2", "operation") DO NOTHING;
