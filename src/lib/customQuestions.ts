import type { Difficulty } from '@/lib/data/questions'

export type CustomQuestion = {
  id: string
  question: string
  correct: string
  incorrect: [string, string, string]
  difficulty?: Difficulty
}

/** Generates a short random ID for new questions */
export function makeId(): string {
  return `cq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

const STORAGE_KEY = 'trivia_custom_questions'

export function loadCustomQuestions(): CustomQuestion[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const qs = JSON.parse(raw) as CustomQuestion[]
    // Back-fill IDs on older data that was stored without them
    return qs.map((q, i) => ({ ...q, id: q.id ?? `cq-legacy-${i}` }))
  } catch {
    return null
  }
}

export function saveCustomQuestions(questions: CustomQuestion[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
}

export function clearCustomQuestions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Parse and validate a pasted JSON string into CustomQuestion[].
 * Returns either `{ questions }` on success or `{ error }` on failure.
 */
export function parseCustomQuestionsJSON(
  raw: string,
): { questions: CustomQuestion[] } | { error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    return { error: 'Invalid JSON — check for missing quotes or commas.' }
  }

  if (!Array.isArray(parsed)) {
    return { error: 'Expected a JSON array [ { … }, … ]' }
  }
  if (parsed.length === 0) {
    return { error: 'Array is empty — add at least one question.' }
  }

  const questions: CustomQuestion[] = []
  for (let i = 0; i < parsed.length; i++) {
    const q = parsed[i] as Record<string, unknown>

    if (typeof q.question !== 'string' || !q.question.trim()) {
      return { error: `Item ${i + 1}: "question" must be a non-empty string.` }
    }
    if (typeof q.correct !== 'string' || !q.correct.trim()) {
      return { error: `Item ${i + 1}: "correct" must be a non-empty string.` }
    }
    if (
      !Array.isArray(q.incorrect) ||
      q.incorrect.length < 3 ||
      q.incorrect.some(a => typeof a !== 'string' || !a.trim())
    ) {
      return { error: `Item ${i + 1}: "incorrect" must be an array of exactly 3 non-empty strings.` }
    }

    const validDiffs: Difficulty[] = ['easy', 'medium', 'hard']
    if (q.difficulty !== undefined && !validDiffs.includes(q.difficulty as Difficulty)) {
      return { error: `Item ${i + 1}: "difficulty" must be "easy", "medium", or "hard".` }
    }

    questions.push({
      id: typeof q.id === 'string' && q.id ? q.id : makeId(),
      question: (q.question as string).trim(),
      correct: (q.correct as string).trim(),
      incorrect: (q.incorrect as string[]).slice(0, 3).map(a => a.trim()) as [string, string, string],
      difficulty: q.difficulty as Difficulty | undefined,
    })
  }

  return { questions }
}

/**
 * Download the current question bank as a JSON file the teacher can save.
 * Exported format deliberately omits `id` to keep it clean for re-import.
 */
export function exportCustomQuestionsAsFile(questions: CustomQuestion[]): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportable = questions.map(({ id: _id, ...rest }) => rest)
  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ladderquiz-questions-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
