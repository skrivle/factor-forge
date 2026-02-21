import { sql } from './client';
import type { User, GameSession, UserStats, QuestionStat, WeakQuestion, Group, Test, TestAttempt } from './client';
import { getTodayString, toLocalDateString, daysDiff } from '@/lib/date-utils';
import type { Question } from '@/lib/game/engine';
import bcrypt from 'bcryptjs';

// User queries
export async function createUser(
  name: string, 
  pin: string, 
  role: 'admin' | 'parent' | 'child' = 'child',
  groupId: string | null = null
) {
  const hashedPin = await bcrypt.hash(pin, 10);
  
  if (groupId) {
    // User is being added to an existing group (e.g., child added by parent)
    const result = await sql`
      INSERT INTO users (name, pin, role, group_id)
      VALUES (${name}, ${hashedPin}, ${role}, ${groupId})
      RETURNING *
    `;
    return result[0] as User;
  } else {
    // Parent/admin signing up - no group yet, will create one in setup wizard
    const result = await sql`
      INSERT INTO users (name, pin, role)
      VALUES (${name}, ${hashedPin}, ${role})
      RETURNING *
    `;
    return result[0] as User;
  }
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
    SELECT * FROM users WHERE name = ${name}
  `;
  const user = result[0] as User | undefined;
  
  if (!user) {
    return undefined;
  }
  
  const isValid = await bcrypt.compare(pin, user.pin);
  return isValid ? user : undefined;
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

// Streak calculation (now calculated from sessions, not stored)
export async function calculateStreak(userId: string): Promise<number> {
  // Get all unique play dates for this user (converted to local timezone)
  const sessions = await sql`
    SELECT DISTINCT
      TO_CHAR(completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Brussels', 'YYYY-MM-DD') as play_date
    FROM sessions
    WHERE user_id = ${userId}
    ORDER BY play_date DESC
  `;

  if (sessions.length === 0) {
    return 0;
  }

  // Get unique dates as YYYY-MM-DD strings (already in correct format from TO_CHAR)
  const uniqueDates = sessions.map((s: any) => s.play_date);

  // Check if the most recent play was today or yesterday
  const todayStr = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  const mostRecentPlay = uniqueDates[0];

  // Streak only counts if last play was today or yesterday
  if (mostRecentPlay !== todayStr && mostRecentPlay !== yesterdayStr) {
    return 0;
  }

  // Count consecutive days backwards from most recent play
  let streak = 1;
  let currentDateStr = mostRecentPlay;

  for (let i = 1; i < uniqueDates.length; i++) {
    // Calculate what the previous day should be
    const currentDate = new Date(currentDateStr + 'T12:00:00'); // Use noon to avoid timezone issues
    currentDate.setDate(currentDate.getDate() - 1);
    const expectedPrevStr = currentDate.toISOString().split('T')[0];
    
    const actualPrevStr = uniqueDates[i];

    if (actualPrevStr === expectedPrevStr) {
      streak++;
      currentDateStr = actualPrevStr;
    } else {
      break; // Streak is broken
    }
  }

  return streak;
}

// Leaderboard queries (can be filtered by group)
export async function getLeaderboard(limit: number = 10, groupId?: string | null) {
  let result;
  
  if (groupId) {
    result = await sql`
      SELECT 
        u.id,
        u.name,
        u.role,
        COALESCE(s.best_score, 0) as best_score,
        COALESCE(s.total_correct_answers, 0) as total_correct_answers
      FROM users u
      LEFT JOIN user_stats s ON u.id = s.user_id
      WHERE u.group_id = ${groupId}
      ORDER BY s.best_score DESC NULLS LAST, s.total_correct_answers DESC NULLS LAST
      LIMIT ${limit}
    `;
  } else {
    result = await sql`
      SELECT 
        u.id,
        u.name,
        u.role,
        COALESCE(s.best_score, 0) as best_score,
        COALESCE(s.total_correct_answers, 0) as total_correct_answers
      FROM users u
      LEFT JOIN user_stats s ON u.id = s.user_id
      ORDER BY s.best_score DESC NULLS LAST, s.total_correct_answers DESC NULLS LAST
      LIMIT ${limit}
    `;
  }
  
  // Calculate streaks for each user
  const withStreaks = await Promise.all(
    result.map(async (user: any) => ({
      ...user,
      current_streak: await calculateStreak(user.id),
    }))
  );
  
  return withStreaks;
}

export async function getWeeklyLeaderboard(groupId?: string | null) {
  let result;
  
  if (groupId) {
    result = await sql`
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
      WHERE u.group_id = ${groupId}
      GROUP BY u.id, u.name, u.role
      ORDER BY weekly_score DESC NULLS LAST
      LIMIT 10
    `;
  } else {
    result = await sql`
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
  }
  
  return result;
}

// Activity queries
export async function getUserActivities(userIds: string[], days: number = 14) {
  if (userIds.length === 0) return {};

  const result = await sql`
    SELECT 
      user_id,
      completed_at
    FROM sessions
    WHERE user_id = ANY(${userIds}::uuid[])
      AND completed_at >= NOW() - INTERVAL '1 day' * ${days}
    ORDER BY user_id, completed_at ASC
  `;

  // Group by user_id and date (in UTC for now, will be converted client-side)
  const activities: Record<string, any[]> = {};
  result.forEach((row: any) => {
    if (!activities[row.user_id]) {
      activities[row.user_id] = [];
    }
    activities[row.user_id].push({
      timestamp: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at
    });
  });

  return activities;
}

// Question Stats queries for adaptive learning
export async function saveQuestionStats(
  userId: string,
  sessionId: string | null, // null for practice mode (doesn't count toward stats)
  questions: Question[],
  userAnswers: (number | null)[],
  isCorrectArray: boolean[],
  timeTakenArray: (number | null)[]
) {
  // Batch insert all question stats
  const values = questions.map((q, i) => ({
    user_id: userId,
    session_id: sessionId,
    num1: q.num1,
    num2: q.num2,
    operation: q.operation,
    correct_answer: q.answer,
    user_answer: userAnswers[i],
    is_correct: isCorrectArray[i],
    time_taken: timeTakenArray[i],
  }));

  // Insert all in one query
  for (const stat of values) {
    await sql`
      INSERT INTO question_stats 
        (user_id, session_id, num1, num2, operation, correct_answer, user_answer, is_correct, time_taken)
      VALUES 
        (${stat.user_id}, ${stat.session_id}, ${stat.num1}, ${stat.num2}, ${stat.operation}, 
         ${stat.correct_answer}, ${stat.user_answer}, ${stat.is_correct}, ${stat.time_taken})
    `;
  }
}

export async function getUserWeakQuestions(userId: string, limit: number = 20): Promise<WeakQuestion[]> {
  const result = await sql`
    SELECT 
      user_id,
      num1,
      num2,
      operation,
      COUNT(*) as times_seen,
      SUM(CASE WHEN is_correct THEN 0 ELSE 1 END) as times_incorrect,
      AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy_rate,
      AVG(time_taken) as avg_time_taken
    FROM question_stats
    WHERE user_id = ${userId}
    GROUP BY user_id, num1, num2, operation
    HAVING COUNT(*) >= 2
    ORDER BY accuracy_rate ASC, times_incorrect DESC
    LIMIT ${limit}
  `;
  
  return result.map((row: any) => ({
    user_id: row.user_id,
    num1: parseInt(row.num1),
    num2: parseInt(row.num2),
    operation: row.operation,
    times_seen: parseInt(row.times_seen),
    times_incorrect: parseInt(row.times_incorrect),
    accuracy_rate: parseFloat(row.accuracy_rate),
    avg_time_taken: row.avg_time_taken ? parseFloat(row.avg_time_taken) : null,
  }));
}

export async function getQuestionStats(
  userId: string,
  num1: number,
  num2: number,
  operation: 'multiplication' | 'division'
) {
  const result = await sql`
    SELECT 
      COUNT(*) as times_seen,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as times_correct,
      SUM(CASE WHEN is_correct THEN 0 ELSE 1 END) as times_incorrect,
      AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy_rate
    FROM question_stats
    WHERE user_id = ${userId}
      AND num1 = ${num1}
      AND num2 = ${num2}
      AND operation = ${operation}
  `;
  
  if (result.length === 0) return null;
  
  const row = result[0] as any;
  return {
    times_seen: parseInt(row.times_seen),
    times_correct: parseInt(row.times_correct),
    times_incorrect: parseInt(row.times_incorrect),
    accuracy_rate: parseFloat(row.accuracy_rate),
  };
}

// Group queries
export async function createGroup(name: string) {
  const result = await sql`
    INSERT INTO groups (name)
    VALUES (${name})
    RETURNING *
  `;
  return result[0] as Group;
}

export async function getGroup(groupId: string) {
  const result = await sql`
    SELECT * FROM groups WHERE id = ${groupId}
  `;
  return result[0] as Group | undefined;
}

export async function addUserToGroup(userId: string, groupId: string) {
  await sql`
    UPDATE users
    SET group_id = ${groupId}
    WHERE id = ${userId}
  `;
}

export async function getGroupMembers(groupId: string) {
  const result = await sql`
    SELECT id, name, role, created_at
    FROM users
    WHERE group_id = ${groupId}
    ORDER BY role DESC, name ASC
  `;
  return result as Omit<User, 'pin' | 'group_id'>[];
}

export async function removeUserFromGroup(userId: string) {
  await sql`
    UPDATE users
    SET group_id = NULL
    WHERE id = ${userId}
  `;
}

export async function updateGroupSettings(groupId: string, supportedTables: number[]) {
  await sql`
    UPDATE groups
    SET supported_tables = ${supportedTables}
    WHERE id = ${groupId}
  `;
}

export async function getUsersNotInGroup() {
  const result = await sql`
    SELECT id, name, role, created_at
    FROM users
    WHERE group_id IS NULL
    ORDER BY role DESC, name ASC
  `;
  return result as Omit<User, 'pin' | 'group_id'>[];
}

export async function isUserAdminOfGroup(userId: string, groupId: string): Promise<boolean> {
  const result = await sql`
    SELECT role
    FROM users
    WHERE id = ${userId} AND group_id = ${groupId} AND role = 'admin'
  `;
  return result.length > 0;
}

// Test queries
export async function createTest(
  groupId: string,
  createdBy: string,
  title: string,
  questionCount: number,
  tablesIncluded: number[],
  includeDivision: boolean,
  timeLimitSeconds: number | null = null,
  description: string | null = null
) {
  const result = await sql`
    INSERT INTO tests (
      group_id, created_by, title, description, question_count, 
      time_limit_seconds, tables_included, include_division
    )
    VALUES (
      ${groupId}, ${createdBy}, ${title}, ${description}, ${questionCount},
      ${timeLimitSeconds}, ${tablesIncluded}, ${includeDivision}
    )
    RETURNING *
  `;
  return result[0] as Test;
}

export async function getTest(testId: string) {
  const result = await sql`
    SELECT * FROM tests WHERE id = ${testId}
  `;
  return result[0] as Test | undefined;
}

export async function getGroupTests(groupId: string) {
  const result = await sql`
    SELECT 
      t.*,
      u.name as creator_name
    FROM tests t
    JOIN users u ON t.created_by = u.id
    WHERE t.group_id = ${groupId}
    ORDER BY t.created_at DESC
  `;
  return result as (Test & { creator_name: string })[];
}

export async function deleteTest(testId: string) {
  await sql`
    DELETE FROM tests WHERE id = ${testId}
  `;
}

// Test attempt queries
export async function createTestAttempt(
  testId: string,
  userId: string,
  totalQuestions: number
) {
  const result = await sql`
    INSERT INTO test_attempts (
      test_id, user_id, score, total_questions, accuracy, 
      questions, status, started_at
    )
    VALUES (
      ${testId}, ${userId}, 0, ${totalQuestions}, 0, 
      '[]'::jsonb, 'in_progress', NOW()
    )
    RETURNING *
  `;
  return result[0] as TestAttempt;
}

export async function getTestAttempt(attemptId: string) {
  const result = await sql`
    SELECT * FROM test_attempts WHERE id = ${attemptId}
  `;
  return result[0] as TestAttempt | undefined;
}

export async function getUserTestAttempt(testId: string, userId: string) {
  const result = await sql`
    SELECT * FROM test_attempts 
    WHERE test_id = ${testId} AND user_id = ${userId}
    ORDER BY completed_at DESC NULLS FIRST
    LIMIT 1
  `;
  return result[0] as TestAttempt | undefined;
}

export async function completeTestAttempt(
  attemptId: string,
  score: number,
  accuracy: number,
  timeTakenSeconds: number | null,
  questions: any
) {
  const result = await sql`
    UPDATE test_attempts
    SET 
      score = ${score},
      accuracy = ${accuracy},
      time_taken_seconds = ${timeTakenSeconds},
      questions = ${JSON.stringify(questions)}::jsonb,
      status = 'completed',
      completed_at = NOW()
    WHERE id = ${attemptId}
    RETURNING *
  `;
  return result[0] as TestAttempt;
}

export async function getTestAttempts(testId: string) {
  const result = await sql`
    SELECT 
      ta.*,
      u.name as user_name,
      u.role as user_role
    FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    WHERE ta.test_id = ${testId}
    ORDER BY ta.completed_at DESC NULLS FIRST, ta.started_at DESC
  `;
  return result as (TestAttempt & { user_name: string; user_role: string })[];
}

export async function getUserTestAttempts(userId: string) {
  const result = await sql`
    SELECT 
      ta.*,
      t.title as test_title,
      t.question_count,
      t.time_limit_seconds
    FROM test_attempts ta
    JOIN tests t ON ta.test_id = t.id
    WHERE ta.user_id = ${userId}
    ORDER BY ta.completed_at DESC NULLS FIRST, ta.started_at DESC
  `;
  return result as (TestAttempt & { 
    test_title: string; 
    question_count: number; 
    time_limit_seconds: number | null 
  })[];
}

// Save question stats from test attempts
export async function saveTestQuestionStats(
  userId: string,
  testAttemptId: string,
  questions: any[]
) {
  // Extract question data from test attempt format
  const values = questions.map(item => ({
    user_id: userId,
    session_id: testAttemptId, // Use test attempt ID as session reference
    num1: item.question.num1,
    num2: item.question.num2,
    operation: item.question.operation,
    correct_answer: item.question.answer,
    user_answer: item.userAnswer,
    is_correct: item.isCorrect,
    time_taken: null, // Tests don't track per-question time yet
  }));

  // Insert all in one transaction
  for (const stat of values) {
    await sql`
      INSERT INTO question_stats 
        (user_id, session_id, num1, num2, operation, correct_answer, user_answer, is_correct, time_taken)
      VALUES 
        (${stat.user_id}, ${stat.session_id}, ${stat.num1}, ${stat.num2}, ${stat.operation}, 
         ${stat.correct_answer}, ${stat.user_answer}, ${stat.is_correct}, ${stat.time_taken})
    `;
  }
}
