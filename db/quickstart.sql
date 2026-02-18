-- Factor Forge - Quick Start SQL
-- This script creates the schema AND adds sample users for testing

-- Drop tables if they exist (for clean restart)
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  role TEXT DEFAULT 'child' CHECK (role IN ('parent', 'child')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  accuracy DECIMAL NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Streaks & Stats
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_played_date DATE,
  best_score INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Insert sample users
-- NOTE: In production, these PINs should be hashed!
INSERT INTO users (name, pin, role) VALUES
  ('Dad', '1234', 'parent'),
  ('Mom', '5678', 'parent'),
  ('Alice', '1111', 'child'),
  ('Bob', '2222', 'child');

-- Initialize stats for all users
INSERT INTO user_stats (user_id)
SELECT id FROM users;

-- Success message
SELECT 'Database setup complete! 🎉' as message;
SELECT COUNT(*) as user_count FROM users;
