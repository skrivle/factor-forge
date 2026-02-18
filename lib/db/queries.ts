import { sql } from './client';
import type { User, GameSession, UserStats } from './client';

// User queries
export async function createUser(name: string, pin: string, role: 'parent' | 'child' = 'child') {
  const result = await sql`
    INSERT INTO users (name, pin, role)
    VALUES (${name}, ${pin}, ${role})
    RETURNING *
  `;
  return result[0] as User;
}

export async function getUserByName(name: string) {
  const result = await sql`
    SELECT * FROM users WHERE name = ${name}
  `;
  return result[0] as User | undefined;
}

export async function getAllUsers() {
  const result = await sql`
    SELECT id, name, role, created_at FROM users ORDER BY created_at DESC
  `;
  return result as Omit<User, 'pin'>[];
}

export async function verifyUserPin(name: string, pin: string) {
  const result = await sql`
    SELECT * FROM users WHERE name = ${name} AND pin = ${pin}
  `;
  return result[0] as User | undefined;
}

// Session queries
export async function createSession(
  userId: string,
  score: number,
  accuracy: number,
  difficultyLevel: 'easy' | 'medium' | 'hard'
) {
  const result = await sql`
    INSERT INTO sessions (user_id, score, accuracy, difficulty_level)
    VALUES (${userId}, ${score}, ${accuracy}, ${difficultyLevel})
    RETURNING *
  `;
  return result[0] as GameSession;
}

export async function getUserSessions(userId: string, limit: number = 10) {
  const result = await sql`
    SELECT * FROM sessions 
    WHERE user_id = ${userId}
    ORDER BY completed_at DESC
    LIMIT ${limit}
  `;
  return result as GameSession[];
}

// Stats queries
export async function getUserStats(userId: string) {
  const result = await sql`
    SELECT * FROM user_stats WHERE user_id = ${userId}
  `;
  return result[0] as UserStats | undefined;
}

export async function initializeUserStats(userId: string) {
  const result = await sql`
    INSERT INTO user_stats (user_id)
    VALUES (${userId})
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *
  `;
  return result[0] as UserStats;
}

export async function updateStreak(userId: string, currentStreak: number, lastPlayedDate: Date) {
  await sql`
    UPDATE user_stats
    SET current_streak = ${currentStreak},
        last_played_date = ${lastPlayedDate.toISOString().split('T')[0]}
    WHERE user_id = ${userId}
  `;
}

export async function updateBestScore(userId: string, score: number) {
  await sql`
    UPDATE user_stats
    SET best_score = GREATEST(best_score, ${score})
    WHERE user_id = ${userId}
  `;
}

export async function incrementCorrectAnswers(userId: string, count: number) {
  await sql`
    UPDATE user_stats
    SET total_correct_answers = total_correct_answers + ${count}
    WHERE user_id = ${userId}
  `;
}

// Leaderboard queries
export async function getLeaderboard(limit: number = 10) {
  const result = await sql`
    SELECT 
      u.id,
      u.name,
      u.role,
      COALESCE(s.current_streak, 0) as current_streak,
      COALESCE(s.best_score, 0) as best_score,
      COALESCE(s.total_correct_answers, 0) as total_correct_answers
    FROM users u
    LEFT JOIN user_stats s ON u.id = s.user_id
    ORDER BY s.best_score DESC NULLS LAST, s.current_streak DESC NULLS LAST
    LIMIT ${limit}
  `;
  return result;
}

export async function getWeeklyLeaderboard() {
  const result = await sql`
    SELECT 
      u.id,
      u.name,
      u.role,
      SUM(sess.score) as weekly_score,
      COUNT(sess.id) as games_played,
      AVG(sess.accuracy) as avg_accuracy
    FROM users u
    LEFT JOIN sessions sess ON u.id = sess.user_id
      AND sess.completed_at >= NOW() - INTERVAL '7 days'
    GROUP BY u.id, u.name, u.role
    ORDER BY weekly_score DESC NULLS LAST
    LIMIT 10
  `;
  return result;
}

// Activity queries
export async function getUserActivities(userIds: string[], days: number = 14) {
  if (userIds.length === 0) return {};

  const result = await sql`
    SELECT 
      user_id,
      DATE(completed_at) as date,
      COUNT(*) as game_count
    FROM sessions
    WHERE user_id = ANY(${userIds}::uuid[])
      AND completed_at >= NOW() - INTERVAL '1 day' * ${days}
    GROUP BY user_id, DATE(completed_at)
    ORDER BY user_id, date ASC
  `;

  // Group by user_id and convert dates to strings for serialization
  const activities: Record<string, any[]> = {};
  result.forEach((row: any) => {
    if (!activities[row.user_id]) {
      activities[row.user_id] = [];
    }
    activities[row.user_id].push({
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
      game_count: Number(row.game_count)
    });
  });

  return activities;
}
