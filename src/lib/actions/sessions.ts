'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { gameSessions } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import type { QuestionHistoryItem } from '@/lib/session'

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export type GameSessionRecord = {
  id: string
  playedAt: number          // ms timestamp
  mode: string
  gradeLevel: string
  categoryId: number
  categoryName: string
  customSetName: string | null
  finalPoints: number | null
  completed: boolean
  rungReached: number
  questionCount: number
  correctCount: number
  accuracy: number
  questionHistory: QuestionHistoryItem[]
}

export type SaveGameSessionInput = Omit<GameSessionRecord, 'id' | 'playedAt'>

export async function saveGameSession(input: SaveGameSessionInput): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) return

  const id = crypto.randomUUID()
  await db.insert(gameSessions).values({
    id,
    userId,
    playedAt: new Date(),
    mode: input.mode,
    gradeLevel: input.gradeLevel,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    customSetName: input.customSetName ?? null,
    finalPoints: input.finalPoints ?? null,
    completed: input.completed,
    rungReached: input.rungReached,
    questionCount: input.questionCount,
    correctCount: input.correctCount,
    accuracy: input.accuracy,
    questionHistory: input.questionHistory,
  })
}

export const getGameSessions = cache(async (): Promise<GameSessionRecord[]> => {
  const userId = await getAuthUserId()
  if (!userId) return []

  const rows = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.userId, userId))
    .orderBy(desc(gameSessions.playedAt))
    .limit(200)

  return rows.map(r => ({
    id: r.id,
    playedAt: r.playedAt.getTime(),
    mode: r.mode,
    gradeLevel: r.gradeLevel,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    customSetName: r.customSetName,
    finalPoints: r.finalPoints,
    completed: r.completed,
    rungReached: r.rungReached,
    questionCount: r.questionCount,
    correctCount: r.correctCount,
    accuracy: r.accuracy,
    questionHistory: r.questionHistory as QuestionHistoryItem[],
  }))
})

export async function deleteGameSession(id: string): Promise<void> {
  const userId = await getAuthUserId()
  if (!userId) return

  // Only delete own sessions
  await db
    .delete(gameSessions)
    .where(and(eq(gameSessions.id, id), eq(gameSessions.userId, userId)))
}
