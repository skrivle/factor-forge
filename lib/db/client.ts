import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.POSTGRES_URL!);

// Export raw SQL client for existing queries
export { sql };

// Export Drizzle instance for new type-safe queries
export const db = drizzle(sql, { schema });

// Database types based on schema
export interface User {
  id: string;
  name: string;
  pin: string;
  role: 'parent' | 'child';
  group_id: string | null;
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

export interface Group {
  id: string;
  name: string;
  created_at: Date;
}

export interface Test {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  question_count: number;
  time_limit_seconds: number | null;
  tables_included: number[];
  include_division: boolean;
  created_at: Date;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  accuracy: number;
  time_taken_seconds: number | null;
  questions: any;
  status: 'completed' | 'in_progress';
  started_at: Date;
  completed_at: Date | null;
}
