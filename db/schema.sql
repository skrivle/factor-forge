-- Factor Forge Database Schema
-- Run this on Vercel Postgres after deployment

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL, -- 4 digit string
  role TEXT DEFAULT 'child' CHECK (role IN ('parent', 'child')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  accuracy DECIMAL NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Streaks & Stats
-- Note: current_streak is now calculated dynamically from sessions table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  best_score INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
