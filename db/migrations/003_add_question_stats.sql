-- Track individual question performance for adaptive learning
-- This allows us to identify which questions users struggle with

CREATE TABLE IF NOT EXISTS question_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Question details
  num1 INTEGER NOT NULL,
  num2 INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('multiplication', 'division')),
  correct_answer INTEGER NOT NULL,
  
  -- User response
  user_answer INTEGER,
  is_correct BOOLEAN NOT NULL,
  time_taken DECIMAL, -- seconds taken to answer (null if timed out)
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_question_stats_user_id ON question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_question_stats_session_id ON question_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_question_stats_question ON question_stats(user_id, num1, num2, operation);

-- View to get question difficulty for each user
-- Shows questions ordered by how often they're answered incorrectly
CREATE OR REPLACE VIEW user_weak_questions AS
SELECT 
  user_id,
  num1,
  num2,
  operation,
  COUNT(*) as times_seen,
  SUM(CASE WHEN is_correct THEN 0 ELSE 1 END) as times_incorrect,
  AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) as accuracy_rate,
  AVG(time_taken) as avg_time_taken
FROM question_stats
GROUP BY user_id, num1, num2, operation
HAVING COUNT(*) >= 2  -- Only consider questions seen at least twice
ORDER BY accuracy_rate ASC, times_incorrect DESC;
