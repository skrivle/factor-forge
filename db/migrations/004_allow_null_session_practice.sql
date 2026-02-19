-- Allow null session_id for practice mode (doesn't count toward stats)
-- This migration updates the question_stats table to make session_id nullable

ALTER TABLE question_stats ALTER COLUMN session_id DROP NOT NULL;
