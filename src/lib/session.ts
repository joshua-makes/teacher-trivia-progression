import type { Difficulty } from '@/lib/data/questions'
import type { Answer } from '@/lib/scoring'
import type { GradeLevel } from '@/lib/ladder'

export type GameMode = 'solo' | 'team'

export type Team = {
  id: number
  name: string
  color: string
  score: number
}

export type QuestionHistoryItem = {
  questionNumber: number
  questionText: string
  correctAnswer: string
  answeredBy: string | null
  correct: boolean
}

export type QuizSession = {
  categoryId: number
  difficulty: Difficulty
  answers: Answer[]
  currentQuestionIndex: number
  completed: boolean
  startedAt: number
  mode: GameMode
  gradeLevel: GradeLevel
  currentRung: number
  teams: Team[] | null
  currentTeamIndex: number
  finalPoints: number | null
  questionCount: number
  questionHistory: QuestionHistoryItem[]
}

const SESSION_KEY = 'trivia_session'

export function createSession(
  categoryId: number,
  mode: GameMode,
  gradeLevel: GradeLevel,
  teams: Team[] | null = null,
  questionCount = 15,
): QuizSession {
  return {
    categoryId,
    difficulty: 'easy',
    answers: [],
    currentQuestionIndex: 0,
    completed: false,
    startedAt: Date.now(),
    mode,
    gradeLevel,
    currentRung: 1,
    teams,
    currentTeamIndex: 0,
    finalPoints: null,
    questionCount,
    questionHistory: [],
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
