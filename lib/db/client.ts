import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export { sql };

// Database types based on schema
export interface User {
  id: string;
  name: string;
  pin: string;
  role: 'parent' | 'child';
  created_at: Date;
}

export interface GameSession {
  id: string;
  user_id: string;
  score: number;
  accuracy: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  completed_at: Date;
}

export interface UserStats {
  user_id: string;
  best_score: number;
  total_correct_answers: number;
  // Note: current_streak is calculated dynamically from sessions, not stored
}

export interface QuestionStat {
  id: string;
  user_id: string;
  session_id: string;
  num1: number;
  num2: number;
  operation: 'multiplication' | 'division';
  correct_answer: number;
  user_answer: number | null;
  is_correct: boolean;
  time_taken: number | null;
  created_at: Date;
}

export interface WeakQuestion {
  user_id: string;
  num1: number;
  num2: number;
  operation: 'multiplication' | 'division';
  times_seen: number;
  times_incorrect: number;
  accuracy_rate: number;
  avg_time_taken: number | null;
}
