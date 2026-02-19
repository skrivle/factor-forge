-- Migration: Remove streak tracking fields from user_stats
-- These are now calculated dynamically from session data
-- Run this on Vercel Postgres

ALTER TABLE user_stats 
  DROP COLUMN IF EXISTS current_streak,
  DROP COLUMN IF EXISTS last_played_date;
