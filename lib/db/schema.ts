import { pgTable, uuid, text, integer, decimal, timestamp, boolean, jsonb, index, date, real, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  supportedTables: integer('supported_tables').array().default([1,2,3,4,5,6,7,8,9,10]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  pin: text('pin').notNull(),
  role: text('role').default('child').notNull().$type<'admin' | 'parent' | 'child'>(),
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

// Spaced repetition schedule (one row per user per fact)
export const spacedRepetitionSchedule = pgTable('spaced_repetition_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  num1: integer('num1').notNull(),
  num2: integer('num2').notNull(),
  operation: text('operation').notNull().$type<'multiplication' | 'division'>(),
  intervalDays: integer('interval_days').default(1).notNull(),
  easinessFactor: real('easiness_factor').default(2.5).notNull(),
  nextReviewDate: date('next_review_date').notNull(),
  repetitions: integer('repetitions').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userNextIdx: index('idx_srs_user_next').on(table.userId, table.nextReviewDate),
  userFactUnique: uniqueIndex('srs_user_fact_unique').on(table.userId, table.num1, table.num2, table.operation),
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

// Invite codes table
export const inviteCodes = pgTable('invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  usedBy: uuid('used_by').references(() => users.id, { onDelete: 'set null' }),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
}, (table) => ({
  codeIdx: index('idx_invite_codes_code').on(table.code),
  usedByIdx: index('idx_invite_codes_used_by').on(table.usedBy),
  isUsedIdx: index('idx_invite_codes_is_used').on(table.isUsed),
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
  spacedRepetitionSchedule: many(spacedRepetitionSchedule),
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

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  creator: one(users, {
    fields: [inviteCodes.createdBy],
    references: [users.id],
  }),
  usedByUser: one(users, {
    fields: [inviteCodes.usedBy],
    references: [users.id],
  }),
}));

export const spacedRepetitionScheduleRelations = relations(spacedRepetitionSchedule, ({ one }) => ({
  user: one(users, {
    fields: [spacedRepetitionSchedule.userId],
    references: [users.id],
  }),
}));
