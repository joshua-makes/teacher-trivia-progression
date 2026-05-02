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
  timeTakenMs?: number
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
  timerSeconds: number | null       // null = use grade-level default
  buzzTimerSeconds: number | null   // null = fall back to timerSeconds (team mode only)
  customSetId?: string              // which question set to play (categoryId === 0 only)
  adaptiveDifficulty?: boolean      // dynamically adjust difficulty based on performance
}

const SESSION_KEY = 'trivia_session'

export function createSession(
  categoryId: number,
  mode: GameMode,
  gradeLevel: GradeLevel,
  teams: Team[] | null = null,
  questionCount = 15,
  timerSeconds: number | null = null,
  buzzTimerSeconds: number | null = null,
  customSetId?: string,
  adaptiveDifficulty = false,
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
    timerSeconds,
    buzzTimerSeconds,
    customSetId,
    adaptiveDifficulty,
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

// ── Seen-question rotation ────────────────────────────────────────────────────
// Stores recently-seen question IDs per "category-grade" key so the next game
// deprioritises questions that were shown recently.

const SEEN_KEY = 'trivia_seen_questions'
const SEEN_MAX = 120  // cap total stored IDs to keep localStorage lean

type SeenMap = Record<string, string[]>  // key: `${categoryId}-${gradeLevel}`

export function getSeenIds(categoryId: number, gradeLevel: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const map: SeenMap = raw ? (JSON.parse(raw) as SeenMap) : {}
    return new Set(map[`${categoryId}-${gradeLevel}`] ?? [])
  } catch { return new Set() }
}

export function recordSeenIds(categoryId: number, gradeLevel: string, ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const map: SeenMap = raw ? (JSON.parse(raw) as SeenMap) : {}
    const key = `${categoryId}-${gradeLevel}`
    // Append new ids, deduplicate, trim to cap
    const combined = [...new Set([...(map[key] ?? []), ...ids])]
    map[key] = combined.slice(-SEEN_MAX)
    localStorage.setItem(SEEN_KEY, JSON.stringify(map))
  } catch { /* ignore storage errors */ }
}

// ── Personal best ─────────────────────────────────────────────────────────────
// Stores the best solo score per "category-grade" key.

const BEST_KEY = 'trivia_personal_bests'

type BestMap = Record<string, number>

export function getPersonalBest(categoryId: number, gradeLevel: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BEST_KEY)
    const map: BestMap = raw ? (JSON.parse(raw) as BestMap) : {}
    return map[`${categoryId}-${gradeLevel}`] ?? null
  } catch { return null }
}

export function savePersonalBest(categoryId: number, gradeLevel: string, score: number): boolean {
  // Returns true if this IS a new personal best
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(BEST_KEY)
    const map: BestMap = raw ? (JSON.parse(raw) as BestMap) : {}
    const key = `${categoryId}-${gradeLevel}`
    const prev = map[key] ?? 0
    if (score > prev) {
      map[key] = score
      localStorage.setItem(BEST_KEY, JSON.stringify(map))
      return true
    }
    return false
  } catch { return false }
}

// ── Live question (teacher view) ──────────────────────────────────────────────
// Written by quiz/page.tsx whenever the rung advances; read-polled by /teacher.

const LIVE_KEY = 'trivia_live_question'

export type LiveQuestion = {
  questionNumber: number
  totalQuestions: number
  questionText: string
  answers: string[]
  correctAnswer: string
  categoryName: string
  difficulty: string
}

export function saveLiveQuestion(q: LiveQuestion): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LIVE_KEY, JSON.stringify(q))
}

export function loadLiveQuestion(): LiveQuestion | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LIVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LiveQuestion
  } catch { return null }
}

export function clearLiveQuestion(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LIVE_KEY)
}
