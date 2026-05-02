'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { gameSessions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { QuestionHistoryItem } from '@/lib/session'

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
  const { userId } = await auth()
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

export async function getGameSessions(): Promise<GameSessionRecord[]> {
  const { userId } = await auth()
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
}

export async function deleteGameSession(id: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  // Only delete own sessions
  await db
    .delete(gameSessions)
    .where(eq(gameSessions.id, id))
}
