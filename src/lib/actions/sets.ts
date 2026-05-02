'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { questionSets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { QuestionSet } from '@/lib/customQuestions'

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
