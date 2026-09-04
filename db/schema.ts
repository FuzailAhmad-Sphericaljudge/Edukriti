import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const learners = sqliteTable('learners', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  level: text('level', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
  preferredLanguage: text('preferred_language', { enum: ['english', 'hindi', 'hinglish'] }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const learningSources = sqliteTable(
  'learning_sources',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    status: text('status', { enum: ['uploaded', 'processing', 'ready', 'failed'] }).notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_learning_sources_learner_id').on(table.learnerId)],
);

export const lessons = sqliteTable(
  'lessons',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    sourceId: text('source_id').references(() => learningSources.id),
    topic: text('topic'),
    title: text('title').notNull(),
    language: text('language', { enum: ['english', 'hindi', 'hinglish'] }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    status: text('status', { enum: ['planning', 'ready', 'teaching', 'completed', 'failed'] }).notNull(),
    planJson: text('plan_json'),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
  },
  (table) => [index('idx_lessons_learner_created').on(table.learnerId, table.createdAt)],
);

export const checkpointAttempts = sqliteTable(
  'checkpoint_attempts',
  {
    id: text('id').primaryKey(),
    lessonId: text('lesson_id').notNull().references(() => lessons.id),
    checkpointId: text('checkpoint_id').notNull(),
    response: text('response').notNull(),
    evaluationJson: text('evaluation_json').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_attempts_lesson_id').on(table.lessonId)],
);

export const learningReports = sqliteTable(
  'learning_reports',
  {
    id: text('id').primaryKey(),
    lessonId: text('lesson_id').notNull().references(() => lessons.id),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    scorePercent: integer('score_percent').notNull(),
    reportJson: text('report_json').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_reports_learner_created').on(table.learnerId, table.createdAt),
    index('idx_reports_lesson_id').on(table.lessonId),
  ],
);
