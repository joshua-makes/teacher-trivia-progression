'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { questionSets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { QuestionSet } from '@/lib/customQuestions'

export type SharedSetPreview = {
  name: string
  emoji: string
  questionCount: number
  questions: QuestionSet['questions']
}

/** Fetch all question sets for the signed-in user */
export async function getCloudSets(): Promise<QuestionSet[]> {
  const { userId } = await auth()
  if (!userId) return []

  const rows = await db
    .select()
    .from(questionSets)
    .where(eq(questionSets.userId, userId))

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    questions: r.questions as QuestionSet['questions'],
    createdAt: r.createdAt.getTime(),
  }))
}

/**
 * Upsert a single question set for the signed-in user.
 * Called whenever the user saves/edits a set while signed in.
 */
export async function upsertCloudSet(set: QuestionSet): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  await db
    .insert(questionSets)
    .values({
      id: set.id,
      userId,
      name: set.name,
      emoji: set.emoji,
      questions: set.questions,
      createdAt: new Date(set.createdAt),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: questionSets.id,
      set: {
        name: set.name,
        emoji: set.emoji,
        questions: set.questions,
        updatedAt: new Date(),
      },
    })
}

/** Delete a question set from cloud (called when user deletes a set) */
export async function deleteCloudSet(setId: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  await db
    .delete(questionSets)
    .where(eq(questionSets.id, setId))
}

/**
 * Merge local sets with cloud sets after sign-in.
 * Strategy: cloud wins for existing IDs (newer updatedAt),
 * local-only sets get pushed up to cloud.
 * Returns the merged array to store back into localStorage.
 */
export async function mergeSetsOnSignIn(localSets: QuestionSet[]): Promise<QuestionSet[]> {
  const { userId } = await auth()
  if (!userId) return localSets

  const cloudSets = await getCloudSets()
  const cloudById = new Map(cloudSets.map(s => [s.id, s]))

  // Push any local-only sets up to cloud
  const localOnlySets = localSets.filter(s => !cloudById.has(s.id))
  await Promise.all(localOnlySets.map(s => upsertCloudSet(s)))

  // Merge: start with all cloud sets, then add local-only
  const merged = [...cloudSets, ...localOnlySets]
  merged.sort((a, b) => b.createdAt - a.createdAt)
  return merged
}

/**
 * Generate (or return existing) a share token for a set the user owns.
 * Returns the share token string.
 */
export async function shareSet(setId: string): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  // Check ownership
  const [row] = await db
    .select({ shareToken: questionSets.shareToken, userId: questionSets.userId })
    .from(questionSets)
    .where(eq(questionSets.id, setId))
  if (!row || row.userId !== userId) return null

  // Reuse existing token or create a new one
  if (row.shareToken) return row.shareToken

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
  await db
    .update(questionSets)
    .set({ shareToken: token, updatedAt: new Date() })
    .where(eq(questionSets.id, setId))
  return token
}

/**
 * Revoke the share token for a set the user owns.
 */
export async function unshareSet(setId: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  const [row] = await db
    .select({ userId: questionSets.userId })
    .from(questionSets)
    .where(eq(questionSets.id, setId))
  if (!row || row.userId !== userId) return

  await db
    .update(questionSets)
    .set({ shareToken: null, updatedAt: new Date() })
    .where(eq(questionSets.id, setId))
}

/**
 * Public — look up a shared set by token (no auth required).
 * Returns null if not found.
 */
export async function getSharedSet(token: string): Promise<SharedSetPreview | null> {
  if (!token || token.length > 40) return null

  const [row] = await db
    .select({
      name: questionSets.name,
      emoji: questionSets.emoji,
      questions: questionSets.questions,
    })
    .from(questionSets)
    .where(eq(questionSets.shareToken, token))

  if (!row) return null
  const questions = row.questions as QuestionSet['questions']
  return {
    name: row.name,
    emoji: row.emoji,
    questionCount: questions.length,
    questions,
  }
}
