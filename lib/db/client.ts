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
