import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const questionSets = pgTable('question_sets', {
  id:        text('id').primaryKey(),           // matches QuestionSet.id (qs-xxx)
  userId:    text('user_id').notNull(),          // Clerk userId
  name:      text('name').notNull(),
  emoji:     text('emoji').notNull().default('📝'),
  questions: jsonb('questions').notNull(),       // QuestionSet['questions'] array
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
