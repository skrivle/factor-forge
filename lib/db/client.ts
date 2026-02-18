import { sql } from '@vercel/postgres';

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
  current_streak: number;
  last_played_date: Date | null;
  best_score: number;
  total_correct_answers: number;
}
