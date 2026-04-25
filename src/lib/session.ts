import type { Difficulty } from '@/lib/data/questions'
import type { Answer } from '@/lib/scoring'

export type QuizSession = {
  categoryId: number
  difficulty: Difficulty
  answers: Answer[]
  currentQuestionIndex: number
  completed: boolean
  startedAt: number
}

const SESSION_KEY = 'trivia_session'

export function createSession(categoryId: number, difficulty: Difficulty): QuizSession {
  return {
    categoryId,
    difficulty,
    answers: [],
    currentQuestionIndex: 0,
    completed: false,
    startedAt: Date.now(),
  }
}

export function saveSession(session: QuizSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): QuizSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as QuizSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}
