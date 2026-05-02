import { pgTable, text, timestamp, jsonb, integer, boolean, real } from 'drizzle-orm/pg-core'

export const questionSets = pgTable('question_sets', {
  id:         text('id').primaryKey(),
  userId:     text('user_id').notNull(),
  name:       text('name').notNull(),
  emoji:      text('emoji').notNull().default('📝'),
  questions:  jsonb('questions').notNull(),
  shareToken: text('share_token'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gameSessions = pgTable('game_sessions', {
  id:              text('id').primaryKey(),          // random uuid
  userId:          text('user_id').notNull(),         // Clerk userId (teacher)
  playedAt:        timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
  mode:            text('mode').notNull(),            // 'solo' | 'team'
  gradeLevel:      text('grade_level').notNull(),
  categoryId:      integer('category_id').notNull(), // 0 = custom set
  categoryName:    text('category_name').notNull(),
  customSetName:   text('custom_set_name'),          // null unless categoryId === 0
  finalPoints:     integer('final_points'),          // solo only
  completed:       boolean('completed').notNull().default(false),
  rungReached:     integer('rung_reached').notNull(),
  questionCount:   integer('question_count').notNull(),
  correctCount:    integer('correct_count').notNull(),
  accuracy:        real('accuracy').notNull(),       // 0.0–1.0
  questionHistory: jsonb('question_history').notNull(),
})
