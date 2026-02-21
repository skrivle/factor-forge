import { pgTable, uuid, text, integer, decimal, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  pin: text('pin').notNull(),
  role: text('role').default('child').notNull().$type<'parent' | 'child'>(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  accuracy: decimal('accuracy').notNull(),
  difficultyLevel: text('difficulty_level').$type<'easy' | 'medium' | 'hard'>(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  completedAtIdx: index('idx_sessions_completed_at').on(table.completedAt),
}));

// User stats table
export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  bestScore: integer('best_score').default(0).notNull(),
  totalCorrectAnswers: integer('total_correct_answers').default(0).notNull(),
}, (table) => ({
  userIdIdx: index('idx_user_stats_user_id').on(table.userId),
}));

// Question stats table
export const questionStats = pgTable('question_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  num1: integer('num1').notNull(),
  num2: integer('num2').notNull(),
  operation: text('operation').notNull().$type<'multiplication' | 'division'>(),
  correctAnswer: integer('correct_answer').notNull(),
  userAnswer: integer('user_answer'),
  isCorrect: boolean('is_correct').notNull(),
  timeTaken: integer('time_taken'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_question_stats_user_id').on(table.userId),
  sessionIdIdx: index('idx_question_stats_session_id').on(table.sessionId),
}));

// Tests table
export const tests = pgTable('tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  questionCount: integer('question_count').notNull(),
  timeLimitSeconds: integer('time_limit_seconds'),
  tablesIncluded: integer('tables_included').array().notNull(),
  includeDivision: boolean('include_division').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index('idx_tests_group_id').on(table.groupId),
  createdByIdx: index('idx_tests_created_by').on(table.createdBy),
}));

// Test attempts table
export const testAttempts = pgTable('test_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  testId: uuid('test_id').references(() => tests.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  accuracy: decimal('accuracy').notNull(),
  timeTakenSeconds: integer('time_taken_seconds'),
  questions: jsonb('questions').notNull(),
  status: text('status').default('completed').notNull().$type<'completed' | 'in_progress'>(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  testIdIdx: index('idx_test_attempts_test_id').on(table.testId),
  userIdIdx: index('idx_test_attempts_user_id').on(table.userId),
  statusIdx: index('idx_test_attempts_status').on(table.status),
}));

// Relations
export const groupsRelations = relations(groups, ({ many }) => ({
  users: many(users),
  tests: many(tests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  group: one(groups, {
    fields: [users.groupId],
    references: [groups.id],
  }),
  sessions: many(sessions),
  stats: one(userStats),
  questionStats: many(questionStats),
  createdTests: many(tests),
  testAttempts: many(testAttempts),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  group: one(groups, {
    fields: [tests.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [tests.createdBy],
    references: [users.id],
  }),
  attempts: many(testAttempts),
}));

export const testAttemptsRelations = relations(testAttempts, ({ one }) => ({
  test: one(tests, {
    fields: [testAttempts.testId],
    references: [tests.id],
  }),
  user: one(users, {
    fields: [testAttempts.userId],
    references: [users.id],
  }),
}));
