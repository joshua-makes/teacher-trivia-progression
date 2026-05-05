'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { LadderDisplay } from '@/components/quiz/LadderDisplay'
import { TeamScoreboard } from '@/components/quiz/TeamScoreboard'
import { Timer } from '@/components/quiz/Timer'
import { DifficultyBadge } from '@/components/quiz/DifficultyBadge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { loadSession, saveSession, saveLiveQuestion, clearLiveQuestion, type Team, type QuestionHistoryItem, getSeenIds, recordSeenIds } from '@/lib/session'
import { playCorrect, playWrong, playComplete } from '@/lib/sounds'
import { loadQuestionSets } from '@/lib/customQuestions'
import { QUESTIONS } from '@/lib/data/questions'
import { CATEGORIES } from '@/lib/data/categories'
import { buildLadder, getSafeZonePoints, getTimerSeconds, formatPoints, type Rung } from '@/lib/ladder'
import { shuffleArray } from '@/lib/shuffle'
import { loadSettings } from '@/lib/settings'
import { nextDifficulty } from '@/lib/progression'
import type { Difficulty } from '@/lib/data/questions'
import type { QuizSession } from '@/lib/session'

type QuizQuestion = {
  id: string
  question: string
  answers: string[]
  correctAnswer: string
  difficulty: Difficulty
  imageUrl?: string
}

type GameState =
  | 'loading'
  | 'playing'
  | 'answered'
  | 'complete'
  | 'error'

const TEAM_BG: Record<string, string> = {
  red:    'bg-red-500 dark:bg-red-600',
  orange: 'bg-orange-500 dark:bg-orange-600',
  amber:  'bg-amber-500 dark:bg-amber-600',
  green:  'bg-green-500 dark:bg-green-600',
  teal:   'bg-teal-500 dark:bg-teal-600',
  blue:   'bg-blue-500 dark:bg-blue-600',
  indigo: 'bg-indigo-500 dark:bg-indigo-600',
  purple: 'bg-purple-600 dark:bg-purple-700',
  violet: 'bg-violet-500 dark:bg-violet-600',
  pink:   'bg-pink-500 dark:bg-pink-600',
  rose:   'bg-rose-500 dark:bg-rose-600',
}

const TEAM_BORDER: Record<string, string> = {
  red:    'border-red-400',
  orange: 'border-orange-400',
  amber:  'border-amber-400',
  green:  'border-green-400',
  teal:   'border-teal-400',
  blue:   'border-blue-400',
  indigo: 'border-indigo-400',
  purple: 'border-purple-400',
  violet: 'border-violet-400',
  pink:   'border-pink-400',
  rose:   'border-rose-400',
}

const TEAM_TEXT: Record<string, string> = {
  red:    'text-red-600 dark:text-red-400',
  orange: 'text-orange-600 dark:text-orange-400',
  amber:  'text-amber-600 dark:text-amber-400',
  green:  'text-green-600 dark:text-green-400',
  teal:   'text-teal-600 dark:text-teal-400',
  blue:   'text-blue-600 dark:text-blue-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  purple: 'text-purple-600 dark:text-purple-400',
  violet: 'text-violet-600 dark:text-violet-400',
  pink:   'text-pink-600 dark:text-pink-400',
  rose:   'text-rose-600 dark:text-rose-400',
}

const TEAM_QUESTION_POINTS: Record<string, number> = (() => {
  const s = loadSettings()
  return { easy: s.teamPoints.easy, medium: s.teamPoints.medium, hard: s.teamPoints.hard }
})()

const TEAM_WRONG_PENALTY_ENABLED: boolean = (() => {
  const s = loadSettings()
  return s.wrongAnswerPenalty ?? false
})()

// ── Adaptive difficulty helpers ───────────────────────────────────────────────
const ADAPTIVE_WINDOW = 5  // rolling window size for difficulty recalculation

function buildAdaptivePools(
  catId: number,
  gradeLevel: string,
  questionCount: number,
  customSetId?: string,
): Record<Difficulty, QuizQuestion[]> {
  const poolSize = Math.max(questionCount, 10)
  const diffs: Difficulty[] = ['easy', 'medium', 'hard']
  const pools: Record<Difficulty, QuizQuestion[]> = { easy: [], medium: [], hard: [] }

  if (catId === 0) {
    const sets = loadQuestionSets()
    const set = sets.find(s => s.id === customSetId) ?? sets[0]
    const customs = set?.questions ?? []
    for (const q of shuffleArray([...customs])) {
      const diff: Difficulty = q.difficulty ?? 'medium'
      pools[diff].push({
        id: `custom-${q.id}`,
        question: q.question,
        answers: shuffleArray([q.correct, ...q.incorrect]),
        correctAnswer: q.correct,
        difficulty: diff,
        imageUrl: q.imageUrl,
      })
    }
    return pools
  }

  const seenIds = getSeenIds(catId, gradeLevel)
  const usedIds = new Set<string>()
  for (const diff of diffs) {
    const fresh = QUESTIONS.filter(q => q.category === catId && q.difficulty === diff && q.grades.includes(gradeLevel as never) && !seenIds.has(q.id) && !usedIds.has(q.id))
    const all = QUESTIONS.filter(q => q.category === catId && q.difficulty === diff && q.grades.includes(gradeLevel as never) && !usedIds.has(q.id))
    const freshGrade = QUESTIONS.filter(q => q.difficulty === diff && q.grades.includes(gradeLevel as never) && !seenIds.has(q.id) && !usedIds.has(q.id))
    const allGrade = QUESTIONS.filter(q => q.difficulty === diff && q.grades.includes(gradeLevel as never) && !usedIds.has(q.id))
    const best = fresh.length >= 3 ? fresh : all.length >= 3 ? all : freshGrade.length >= 3 ? freshGrade : allGrade
    const selected = shuffleArray([...best]).slice(0, poolSize)
    selected.forEach(q => usedIds.add(q.id))
    pools[diff] = selected.map(q => ({
      id: q.id,
      question: q.question,
      answers: shuffleArray([q.correct, ...q.incorrect]),
      correctAnswer: q.correct,
      difficulty: diff,
    }))
  }
  return pools
}

function pickFromPool(pool: Record<Difficulty, QuizQuestion[]>, diff: Difficulty): QuizQuestion | null {
  const order: Difficulty[] =
    diff === 'easy' ? ['easy', 'medium', 'hard']
    : diff === 'medium' ? ['medium', 'easy', 'hard']
    : ['hard', 'medium', 'easy']
  for (const d of order) {
    if (pool[d].length > 0) return pool[d].shift()!
  }
  return null
}

export default function QuizPage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('loading')
  const [session, setSession] = useState<QuizSession | null>(null)
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [currentRung, setCurrentRung] = useState(1)
  const [teams, setTeams] = useState<Team[]>([])
  // Team buzz-in mode state
  const [buzzedTeamIndex, setBuzzedTeamIndex] = useState<number | null>(null)
  const [triedTeamIndices, setTriedTeamIndices] = useState<number[]>([])
  const [isQuestionRevealed, setIsQuestionRevealed] = useState(false)
  const [readingTimerRemaining, setReadingTimerRemaining] = useState(0)
  const [buzzTimerRemaining, setBuzzTimerRemaining] = useState(0)
  const teamLastResultRef = useRef<{ correct: true; teamName: string; pts: number } | { correct: false; correctAnswer: string } | null>(null)
  const soloLastResultRef = useRef<{ correct: boolean; correctAnswer: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buzzFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ladderRef = useRef<Rung[]>(buildLadder(15))
  const questionHistoryRef = useRef<QuestionHistoryItem[]>([])
  const [buzzFlashTeam, setBuzzFlashTeam] = useState<Team | null>(null)
  // Lifelines (solo mode)
  const [fiftyfiftyUsed, setFiftyfiftyUsed] = useState(false)
  const [eliminatedAnswers, setEliminatedAnswers] = useState<string[]>([])
  const [isSoloRevealed, setIsSoloRevealed] = useState(false)
  // Team: countdown shown on the answered flash screen
  const [answeredCountdown, setAnsweredCountdown] = useState<number | null>(null)
  // Pause state (any mode)
  const [isPaused, setIsPaused] = useState(false)
  // Keyboard shortcut overlay
  const [showShortcuts, setShowShortcuts] = useState(false)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // ── Adaptive difficulty state ─────────────────────────────────────────────
  const [adaptiveSequence, setAdaptiveSequence] = useState<QuizQuestion[]>([])
  const adaptiveSequenceRef = useRef<QuizQuestion[]>([])
  const adaptivePoolRef = useRef<Record<Difficulty, QuizQuestion[]>>({ easy: [], medium: [], hard: [] })
  const adaptiveDiffRef = useRef<Difficulty>('easy')
  const adaptiveWindowRef = useRef<boolean[]>([])

  const queueNextAdaptive = useCallback((wasCorrect: boolean) => {
    adaptiveWindowRef.current = [...adaptiveWindowRef.current, wasCorrect].slice(-ADAPTIVE_WINDOW)
    const wins = adaptiveWindowRef.current.filter(Boolean).length
    const newDiff = nextDifficulty(adaptiveDiffRef.current, wins, adaptiveWindowRef.current.length)
    adaptiveDiffRef.current = newDiff
    const nextQ = pickFromPool(adaptivePoolRef.current, newDiff)
    if (nextQ) {
      const next = [...adaptiveSequenceRef.current, nextQ]
      adaptiveSequenceRef.current = next
      setAdaptiveSequence(next)
    }
  }, [])

  const loadAllQuestions = useCallback((catId: number, gradeLevel: string, mode: 'solo' | 'team', questionCount: number, customSetId?: string): QuizQuestion[] => {
    const diffs: Difficulty[] = ['easy', 'medium', 'hard']

    const toQuizQ = (q: { id: string; question: string; correct: string; incorrect: string[] }, diff: Difficulty): QuizQuestion => ({
      id: q.id,
      question: q.question,
      answers: shuffleArray([q.correct, ...q.incorrect]),
      correctAnswer: q.correct,
      difficulty: diff,
    })

    // ── Custom questions mode ─────────────────────────────
    if (catId === 0) {
      const sets = loadQuestionSets()
      const set = sets.find(s => s.id === customSetId) ?? sets[0]
      const customs = set?.questions ?? []
      const qs: QuizQuestion[] = customs.slice(0, questionCount).map((q, idx) => ({
        id: `custom-${q.id}`,
        question: q.question,
        answers: shuffleArray([q.correct, ...q.incorrect]),
        correctAnswer: q.correct,
        difficulty: q.difficulty ?? diffs[idx % 3],
        imageUrl: q.imageUrl,
      }))
      return mode === 'team' ? shuffleArray(qs) : qs
    }

    const perDiff = Math.ceil(questionCount / diffs.length)

    // Load recently-seen IDs so we can deprioritise them
    const seenIds = getSeenIds(catId, gradeLevel)

    // Track used IDs across all difficulty loops to guarantee no duplicates
    const usedIds = new Set<string>()

    // Build a bucket for each difficulty, falling back from category-specific → grade-wide if needed
    let pools: QuizQuestion[] = []
    for (const diff of diffs) {
      // Fresh (unseen) questions for this category + difficulty
      const freshByCat = QUESTIONS.filter(q =>
        q.category === catId && q.difficulty === diff && q.grades.includes(gradeLevel as never) && !usedIds.has(q.id) && !seenIds.has(q.id)
      )
      // All questions for this category + difficulty (including seen, as fallback)
      const allByCat = QUESTIONS.filter(q =>
        q.category === catId && q.difficulty === diff && q.grades.includes(gradeLevel as never) && !usedIds.has(q.id)
      )
      // Grade-wide fresh fallback
      const freshGrade = QUESTIONS.filter(q =>
        q.difficulty === diff && q.grades.includes(gradeLevel as never) && !usedIds.has(q.id) && !seenIds.has(q.id)
      )
      // Grade-wide full fallback
      const allGrade = QUESTIONS.filter(q =>
        q.difficulty === diff && q.grades.includes(gradeLevel as never) && !usedIds.has(q.id)
      )

      // Pick the best available pool: prefer fresh-by-category, then fresh-grade, then allow repeats
      let pool: typeof QUESTIONS
      if (freshByCat.length >= Math.min(perDiff, 3)) pool = freshByCat
      else if (allByCat.length >= Math.min(perDiff, 3)) pool = allByCat
      else if (freshGrade.length >= Math.min(perDiff, 3)) pool = freshGrade
      else pool = allGrade

      const selected = shuffleArray(pool).slice(0, perDiff)
      selected.forEach(q => usedIds.add(q.id))
      pools.push(...selected.map(q => toQuizQ(q, diff)))
    }

    // If still short (e.g. K-2 has few medium/hard), fill from any grade-appropriate questions
    if (pools.length < questionCount) {
      const usedIds = new Set(pools.map(q => q.id))
      const diffOrder: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 }
      const fillPool = QUESTIONS.filter(q =>
        q.grades.includes(gradeLevel as never) && !usedIds.has(q.id)
      )
      const extras = shuffleArray(fillPool)
        .slice(0, questionCount - pools.length)
        .map(q => toQuizQ(q, q.difficulty))
      pools = [...pools, ...extras].sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty])
    }

    const ordered = mode === 'team' ? shuffleArray(pools) : pools
    return ordered.slice(0, questionCount)
  }, [])

  useEffect(() => {
    const sess = loadSession()
    if (!sess) { router.push('/'); return }
    setSession(sess)
    setCurrentRung(sess.currentRung ?? 1)
    setTeams(sess.teams ? [...sess.teams] : [])
    setBuzzedTeamIndex(null)
    if (sess.adaptiveDifficulty) {
      const pools = buildAdaptivePools(sess.categoryId, sess.gradeLevel, sess.questionCount ?? 15, sess.customSetId)
      adaptivePoolRef.current = pools
      adaptiveDiffRef.current = 'easy'
      adaptiveWindowRef.current = []
      const firstQ = pickFromPool(pools, 'easy')
      if (firstQ) {
        adaptiveSequenceRef.current = [firstQ]
        setAdaptiveSequence([firstQ])
      }
      setAllQuestions([])
    } else {
      const qs = loadAllQuestions(sess.categoryId, sess.gradeLevel, sess.mode, sess.questionCount ?? 15, sess.customSetId)
      setAllQuestions(qs)
    }
    setGameState('playing')
    return () => clearTimer()
  }, [router, loadAllQuestions])

  const currentQuestion = session?.adaptiveDifficulty
    ? (adaptiveSequence[currentRung - 1] ?? null)
    : (allQuestions[currentRung - 1] ?? null)
  const totalQCount = session?.adaptiveDifficulty
    ? (session?.questionCount ?? 15)
    : allQuestions.length
  const ladder = buildLadder(Math.max(1, totalQCount))
  ladderRef.current = ladder
  const currentRungData = ladder[currentRung - 1]
  const timerSeconds = session?.timerSeconds ?? (session ? getTimerSeconds(session.gradeLevel) : 30)
  const buzzTimerSeconds = session?.buzzTimerSeconds ?? timerSeconds
  const categoryName = (() => {
    if (session?.categoryId !== 0) return CATEGORIES.find(c => c.id === session?.categoryId)?.name ?? ''
    const sets = loadQuestionSets()
    return sets.find(s => s.id === session?.customSetId)?.name ?? 'Custom Questions'
  })()

  const finishGame = useCallback((pts: number, winTeams: Team[], completed: boolean) => {
    const sess = loadSession()
    if (sess) {
      sess.completed = completed
      sess.gameOver = true
      sess.currentRung = currentRung
      sess.finalPoints = session?.mode === 'solo' ? pts : null
      sess.teams = winTeams.length > 0 ? winTeams : sess.teams
      sess.questionHistory = questionHistoryRef.current
      saveSession(sess)
      // Record seen question IDs for smart rotation next game
      const seqToRecord = adaptiveSequenceRef.current.length > 0 ? adaptiveSequenceRef.current : allQuestions
      recordSeenIds(sess.categoryId, sess.gradeLevel, seqToRecord.map(q => q.id))
    }
    setGameState('complete')
    timerRef.current = setTimeout(() => router.push('/results'), 1200)
  }, [currentRung, session?.mode, router, allQuestions])

  const handleAnswer = useCallback(
    (correct: boolean, timeTakenMs = 0) => {
      if (gameState !== 'playing') return
      if (!session) return

      // Team-mode guard comes BEFORE clearTimer so a stale timer callback
      // with buzzedTeamIndex=null can't cancel a legitimate pending timeout
      if (session.mode === 'team' && buzzedTeamIndex === null) return

      clearTimer()

      if (session.mode === 'solo') {
        soloLastResultRef.current = { correct, correctAnswer: currentQuestion?.correctAnswer ?? '' }
        // Track question history for solo mode (shown on results page)
        if (currentQuestion) {
          questionHistoryRef.current = [...questionHistoryRef.current, {
            questionNumber: currentRung,
            questionText: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            answeredBy: correct ? 'You' : null,
            correct,
            timeTakenMs,
          }]
        }
        setGameState('answered')
        if (correct) {
          playCorrect()
          timerRef.current = setTimeout(() => {
            const qCount = session?.adaptiveDifficulty ? (session.questionCount ?? 15) : allQuestions.length
            if (currentRung >= qCount) {
              finishGame(1_000_000, [], true)
            } else {
              if (session?.adaptiveDifficulty) queueNextAdaptive(true)
              setCurrentRung(r => r + 1)
              setGameState('playing')
            }
          }, 1000)
        } else {
          playWrong()
          timerRef.current = setTimeout(() => {
            finishGame(getSafeZonePoints(currentRung, ladderRef.current), [], false)
          }, 2500)
        }
      } else {
        // ── Team buzz-in mode ──────────────────────────────────────────
        // buzzedTeamIndex is guaranteed non-null by the guard above clearTimer
        const bidx = buzzedTeamIndex as number
        const q = currentQuestion

        if (correct) {
          playCorrect()
          const pts = TEAM_QUESTION_POINTS[q?.difficulty ?? 'easy']
          const newTeams = teams.map((t, i) =>
            i === bidx ? { ...t, score: t.score + pts } : t
          )
          setTeams(newTeams)
          teamLastResultRef.current = { correct: true, teamName: teams[bidx]?.name ?? '', pts }
          questionHistoryRef.current = [...questionHistoryRef.current, {
            questionNumber: currentRung,
            questionText: q?.question ?? '',
            correctAnswer: q?.correctAnswer ?? '',
            answeredBy: teams[bidx]?.name ?? null,
            correct: true,
            timeTakenMs,
          }]
          setGameState('answered')
          timerRef.current = setTimeout(() => {
            const qCount = session?.adaptiveDifficulty ? (session.questionCount ?? 15) : allQuestions.length
            if (currentRung >= qCount) {
              finishGame(0, newTeams, true)
            } else {
              if (session?.adaptiveDifficulty) queueNextAdaptive(true)
              setCurrentRung(r => r + 1)
              setBuzzedTeamIndex(null)
              setTriedTeamIndices([])
              setIsQuestionRevealed(false)
              setGameState('playing')
            }
          }, 1800)
        } else {
          const newTried = [...triedTeamIndices, bidx]
          setTriedTeamIndices(newTried)

          // Apply wrong answer penalty (deduct the question's point value)
          const penalty = TEAM_WRONG_PENALTY_ENABLED ? (TEAM_QUESTION_POINTS[q?.difficulty ?? 'easy'] ?? 0) : 0
          const penalizedTeams = penalty > 0
            ? teams.map((t, i) => i === bidx ? { ...t, score: Math.max(0, t.score - penalty) } : t)
            : teams
          if (penalty > 0) setTeams(penalizedTeams)

          if (newTried.length >= teams.length) {
            // All teams failed — show answer and move on
            playWrong()
            setBuzzedTeamIndex(null)
            teamLastResultRef.current = { correct: false, correctAnswer: q?.correctAnswer ?? '' }
            questionHistoryRef.current = [...questionHistoryRef.current, {
              questionNumber: currentRung,
              questionText: q?.question ?? '',
              correctAnswer: q?.correctAnswer ?? '',
              answeredBy: null,
              correct: false,
              timeTakenMs,
            }]
            setGameState('answered')
            timerRef.current = setTimeout(() => {
              const qCount = session?.adaptiveDifficulty ? (session.questionCount ?? 15) : allQuestions.length
              if (currentRung >= qCount) {
                finishGame(0, penalizedTeams, true)
              } else {
                if (session?.adaptiveDifficulty) queueNextAdaptive(false)
                setCurrentRung(r => r + 1)
                setTriedTeamIndices([])
                setIsQuestionRevealed(false)
                setGameState('playing')
              }
            }, 2800)
          } else {
            // Steal opportunity — penalty already applied above; let remaining teams buzz
            const remaining = teams.map((_, i) => i).filter(i => !newTried.includes(i))
            if (remaining.length === 1) {
              // Only one team left — auto-buzz them in so the game keeps moving
              const autoIdx = remaining[0]!
              setBuzzedTeamIndex(autoIdx)
              setBuzzTimerRemaining(buzzTimerSeconds)
            } else {
              setBuzzedTeamIndex(null)
            }
          }
        }
      }
    },
    [gameState, session, currentRung, allQuestions, buzzedTeamIndex, triedTeamIndices, teams, finishGame, buzzTimerSeconds, currentQuestion, queueNextAdaptive],
  )

  const handleWalkAway = useCallback(() => {
    if (!session || session.mode !== 'solo') return
    clearTimer()
    finishGame(getSafeZonePoints(currentRung, ladderRef.current), [], false)
  }, [session, currentRung, finishGame])

  const handleFiftyFifty = useCallback(() => {
    if (fiftyfiftyUsed || gameState !== 'playing' || !currentQuestion) return
    const wrongs = currentQuestion.answers.filter(a => a !== currentQuestion.correctAnswer)
    const toRemove = shuffleArray(wrongs).slice(0, 2)
    setEliminatedAnswers(toRemove)
    setFiftyfiftyUsed(true)
  }, [fiftyfiftyUsed, gameState, currentQuestion])

  const handleSkip = useCallback(() => {
    if (gameState !== 'playing' || !session || session.mode !== 'solo') return
    clearTimer()
    setEliminatedAnswers([])
    setGameState('answered')
    timerRef.current = setTimeout(() => {
      const qCount = session?.adaptiveDifficulty ? (session.questionCount ?? 15) : allQuestions.length
      if (currentRung >= qCount) {
        finishGame(getSafeZonePoints(currentRung, ladderRef.current), [], false)
      } else {
        if (session?.adaptiveDifficulty) queueNextAdaptive(false)
        setCurrentRung(r => r + 1)
        setGameState('playing')
      }
    }, 600)
  }, [gameState, session, currentRung, allQuestions.length, finishGame, queueNextAdaptive])

  const handleTeamSkip = useCallback(() => {
    if (gameState !== 'playing' || !session || session.mode !== 'team') return
    clearTimer()
    setBuzzedTeamIndex(null)
    setTriedTeamIndices([])
    setIsQuestionRevealed(false)
    const qCount = session.adaptiveDifficulty ? (session.questionCount ?? 15) : allQuestions.length
    if (currentRung >= qCount) {
      finishGame(0, teams, true)
    } else {
      if (session.adaptiveDifficulty) queueNextAdaptive(false)
      setCurrentRung(r => r + 1)
      setGameState('playing')
    }
  }, [gameState, session, currentRung, allQuestions.length, finishGame, teams, queueNextAdaptive])

  // Reset eliminated answers when question changes
  useEffect(() => {
    setEliminatedAnswers([])
    setIsSoloRevealed(false)
  }, [currentRung])

  // Keep live question in localStorage so /teacher page can poll it
  useEffect(() => {
    if (!currentQuestion || gameState !== 'playing') return
    saveLiveQuestion({
      questionNumber: currentRung,
      totalQuestions: totalQCount,
      questionText: currentQuestion.question,
      answers: currentQuestion.answers,
      correctAnswer: currentQuestion.correctAnswer,
      categoryName,
      difficulty: currentQuestion.difficulty,
    })
  }, [currentRung, currentQuestion, gameState, totalQCount, categoryName])

  // Clear live question when game is over
  useEffect(() => {
    if (gameState === 'complete') clearLiveQuestion()
  }, [gameState])

  // Countdown on the team answered flash
  useEffect(() => {
    if (gameState !== 'answered' || session?.mode !== 'team') {
      setAnsweredCountdown(null)
      return
    }
    const startVal = teamLastResultRef.current?.correct === true ? 2 : 3
    setAnsweredCountdown(startVal)
    const id = setInterval(() => {
      setAnsweredCountdown(c => (c !== null && c > 1 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [gameState, session?.mode])

  // Spacebar / Enter to reveal question (solo mode)
  useEffect(() => {
    if (session?.mode !== 'solo' || isSoloRevealed || gameState !== 'playing') return
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        setIsSoloRevealed(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session?.mode, isSoloRevealed, gameState])

  // Spacebar to reveal question (team mode)
  useEffect(() => {
    if (session?.mode !== 'team' || isQuestionRevealed || gameState !== 'playing') return
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        setReadingTimerRemaining(timerSeconds)
        setIsQuestionRevealed(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session?.mode, isQuestionRevealed, gameState, timerSeconds])

  // Keyboard shortcuts 1–4 to buzz in teams (team mode only)
  useEffect(() => {
    if (session?.mode !== 'team') return
    if (!isQuestionRevealed || gameState !== 'playing' || buzzedTeamIndex !== null) return
    function onKey(e: KeyboardEvent) {
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < teams.length) {
        if (!triedTeamIndices.includes(idx)) {
          setBuzzTimerRemaining(buzzTimerSeconds)
          setBuzzedTeamIndex(idx)
          setBuzzFlashTeam(teams[idx] ?? null)
          if (buzzFlashRef.current) clearTimeout(buzzFlashRef.current)
          buzzFlashRef.current = setTimeout(() => setBuzzFlashTeam(null), 900)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session?.mode, isQuestionRevealed, gameState, buzzedTeamIndex, teams, triedTeamIndices, timerSeconds, buzzTimerSeconds])

  // Play completion fanfare once when game finishes
  useEffect(() => {
    if (gameState === 'complete') playComplete()
  }, [gameState])

  // Global keyboard: P to pause/unpause, T to open teacher window, ? to toggle shortcut overlay, Escape to dismiss overlay
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't intercept if the user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(s => !s); return }
      if (e.key === 'Escape') { setShowShortcuts(false); return }
      if (e.code === 'KeyT' && gameState !== 'complete') {
        e.preventDefault()
        window.open('/teacher', 'ladderquiz-teacher', 'width=900,height=600,noopener')
        return
      }
      if (e.code === 'KeyP' && gameState === 'playing') {
        e.preventDefault()
        setIsPaused(p => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameState])

  // Close teacher view on each new question (no longer needed — teacher window polls)
  // useEffect(() => { setShowTeacherView(false) }, [currentRung])

  // ── Loading ──────────────────────────────────────────
  if (gameState === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🪜</div>
            <p className="text-gray-600 dark:text-gray-300 font-semibold text-lg">Loading questions…</p>
          </div>
        </div>
      </Container>
    )
  }

  // ── Error ─────────────────────────────────────────────
  if (gameState === 'error') {
    return (
      <Container>
        <Card className="p-6 text-center max-w-md mx-auto mt-8">
          <p className="text-red-500 mb-4">Failed to load questions. Please try again.</p>
          <Button onClick={() => router.push('/play')}>Back to Play</Button>
        </Card>
      </Container>
    )
  }

  // ── Complete ──────────────────────────────────────────
  if (gameState === 'complete') {
    return (
      <Container>
        <Confetti />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🪜</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {session?.mode === 'team' ? 'Game Complete!' : 'Amazing!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading your results…</p>
          </div>
        </div>
      </Container>
    )
  }

  // ── Team: answered result flash ───────────────────────
  if (gameState === 'answered' && session?.mode === 'team') {
    const result = teamLastResultRef.current
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="anim-scale-in p-10 text-center max-w-sm w-full mx-auto">
            {result?.correct ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">Correct!</h2>
                <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-2">{result.teamName}</p>
                <p className="text-xl text-gray-500 dark:text-gray-400 mt-1">+{result.pts.toLocaleString()} pts</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😬</div>
                <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">No one got it!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">The answer was:</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{result?.correctAnswer}</p>
                {TEAM_WRONG_PENALTY_ENABLED && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-3">
                    Point penalty applied for wrong answers
                  </p>
                )}
              </>
            )}
            {answeredCountdown !== null && answeredCountdown > 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-5">
                Next in <span className="font-bold tabular-nums text-gray-600 dark:text-gray-300">{answeredCountdown}</span>…
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-5">Next question…</p>
            )}
          </Card>
        </div>
      </Container>
    )
  }

  // ── Solo: answered result flash ──────────────────────
  if (gameState === 'answered' && session?.mode === 'solo') {
    const result = soloLastResultRef.current
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="anim-scale-in p-10 text-center max-w-sm w-full mx-auto">
            {result?.correct ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">Correct!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Keep climbing…</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">Wrong!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">The answer was:</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{result?.correctAnswer}</p>
              </>
            )}
          </Card>
        </div>
      </Container>
    )
  }

  // ── Shared derived values ─────────────────────────────
  const safeZonePts = getSafeZonePoints(currentRung, ladder)
  const stealAvailable = triedTeamIndices.length > 0 && buzzedTeamIndex === null

  // ── TEAM MODE LAYOUT ──────────────────────────────────
  if (session?.mode === 'team') {
    const buzzedTeam = buzzedTeamIndex !== null ? teams[buzzedTeamIndex] : null
    const buzzing = buzzedTeamIndex !== null

    return (
      <Container>
        {/* Pause overlay */}
        {isPaused && (
          <div
            className="fixed inset-0 z-[90] bg-gray-950/95 flex flex-col items-center justify-center gap-6 cursor-pointer"
            onClick={() => setIsPaused(false)}
          >
            <div className="text-7xl">⏸</div>
            <h2 className="text-4xl font-black text-white">Paused</h2>
            <p className="text-gray-400 text-sm">Press <kbd className="px-2 py-0.5 rounded bg-gray-800 font-mono border border-gray-700">P</kbd> or click anywhere to resume</p>
          </div>
        )}
        {/* Keyboard shortcut overlay */}
        {showShortcuts && (
          <div
            className="fixed inset-0 z-[90] bg-gray-950/90 flex items-center justify-center"
            onClick={() => setShowShortcuts(false)}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-white mb-5">Keyboard Shortcuts</h2>
              <div className="space-y-3">
                {[
                  ['Space', 'Reveal question'],
                  ['1 – 4', 'Buzz in team'],
                  ['P', 'Pause / resume'],
                  ['T', 'Open teacher window'],
                  ['?', 'Show this overlay'],
                  ['Esc', 'Close overlay'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <kbd className="px-2.5 py-1 rounded bg-gray-800 font-mono text-sm text-gray-200 border border-gray-700">{key}</kbd>
                    <span className="text-sm text-gray-300">{desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)} className="mt-6 w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Close</button>
            </div>
          </div>
        )}
        {/* Full-screen buzz-in flash */}
        {buzzFlashTeam && (
          <div
            className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none ${TEAM_BG[buzzFlashTeam.color] ?? 'bg-blue-500'}`}
            style={{ animation: 'buzzFlash 1s ease-out forwards' }}
          >
            <div className="text-center text-white select-none">
              <div className="text-[9rem] leading-none mb-4">🎯</div>
              <div className="text-7xl font-black tracking-tight drop-shadow-lg">{buzzFlashTeam.name}</div>
              <div className="text-2xl font-semibold opacity-75 mt-4">Buzzed in!</div>
            </div>
          </div>
        )}
        <div className="flex gap-4 items-start">
          {/* Question area */}
          <div className="flex-1 min-w-0">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Question {currentRung} <span className="text-gray-400 dark:text-gray-600">/ {totalQCount}</span>
                <span className="mx-2 text-gray-300 dark:text-gray-700">·</span>
                {categoryName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="p-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-mono font-bold"
                  title="Keyboard shortcuts (?)"
                  aria-label="Show keyboard shortcuts"
                >?
                </button>
                <button
                  onClick={() => setIsPaused(p => !p)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Pause (P)"
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? '▶️' : '⏸️'}
                </button>
                {isQuestionRevealed && (
                  <Button variant="ghost" size="sm" onClick={handleTeamSkip} title="Skip to next question">
                    ⏭ Skip
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  ✕ End Game
                </Button>
              </div>
            </div>

            {/* ── COVER STATE: question not yet revealed ── */}
            {!isQuestionRevealed ? (
              <div className="rounded-2xl bg-gray-900 dark:bg-gray-950 border border-gray-700 min-h-[420px] flex flex-col items-center justify-center text-center gap-6 p-10 shadow-xl">
                <div className="text-[9rem] leading-none font-black text-gray-700 select-none">?</div>
                <div>
                  <p className="text-sm font-semibold text-gray-300 mb-2">
                    Question {currentRung} of {totalQCount}
                  </p>
                  {currentQuestion && <DifficultyBadge difficulty={currentQuestion.difficulty} />}
                  <p className="text-gray-500 text-sm mt-2">
                    Get everyone&apos;s attention, then show the question.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    setReadingTimerRemaining(timerSeconds)
                    setIsQuestionRevealed(true)
                  }}
                  className="px-10"
                >
                  Show Question
                </Button>
                <p className="text-xs text-gray-600">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-xs border border-gray-700">Space</kbd>
                  {' '}to reveal
                </p>
              </div>
            ) : (
              <>
                {/* Active team banner — with buzz-in countdown */}
                {buzzedTeam && (
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 text-white font-bold shadow-md ring-1 ring-inset ring-white/20 ${TEAM_BG[buzzedTeam.color] ?? 'bg-blue-500 dark:bg-blue-600'}`}>
                    <span>🎯 {buzzedTeam.name} is answering…</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-mono font-black tabular-nums ${buzzTimerRemaining <= 5 ? 'text-red-200 animate-pulse' : ''}`}>
                        {buzzTimerRemaining}s
                      </span>
                      <button
                        onClick={() => setBuzzedTeamIndex(null)}
                        className="opacity-70 hover:opacity-100 text-xs underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <Timer
                      key={`buzz-${currentRung}-${buzzedTeamIndex}-${triedTeamIndices.length}`}
                      seconds={buzzTimerSeconds}
                      isPaused={false}
                      onTick={setBuzzTimerRemaining}
                      onExpire={() => handleAnswer(false)}
                    />
                  </div>
                )}

                {/* Steal notification */}
                {stealAvailable && !buzzedTeam && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-xl px-4 py-2 mb-3 text-sm text-amber-800 dark:text-amber-300 font-medium">
                    ❌ Wrong answer! Select a team to steal.
                  </div>
                )}

                {/* Reading countdown (shown while waiting for buzz-in, no team selected yet) */}
                {!buzzedTeam && readingTimerRemaining > 0 && (
                  <>
                    <Timer
                      key={`read-${currentRung}`}
                      seconds={timerSeconds}
                      isPaused={buzzedTeamIndex !== null}
                      onTick={setReadingTimerRemaining}
                      onExpire={() => setReadingTimerRemaining(0)}
                    />
                    <div className="flex items-center justify-end mb-2 gap-1.5">
                      <span className={`text-xs font-mono font-semibold tabular-nums ${readingTimerRemaining <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}>
                        {readingTimerRemaining}s to read
                      </span>
                    </div>
                  </>
                )}

                {/* Question card — locked until a team buzzes in */}
                {currentQuestion && (
                  <QuestionCard
                    key={`q-${currentRung}-${triedTeamIndices.length}`}
                    data={{
                      question: currentQuestion.question,
                      answers: currentQuestion.answers,
                      correctAnswer: currentQuestion.correctAnswer,
                      difficulty: currentQuestion.difficulty,
                      categoryName,
                      imageUrl: currentQuestion.imageUrl,
                    }}
                    questionNumber={currentRung}
                    totalQuestions={totalQCount}
                    onAnswer={handleAnswer}
                    locked={!buzzing}
                    showTimer={false}
                    suppressFeedback={true}
                  />
                )}

                {/* Buzz-in panel */}
                {gameState === 'playing' && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-3">
                      {stealAvailable ? '🔁 Steal — who buzzes in?' : '📣 Who buzzed in?'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {teams.map((team, i) => {
                        const tried = triedTeamIndices.includes(i)
                        const isBuzzed = buzzedTeamIndex === i
                        return (
                          <button
                            key={team.id}
                            onClick={() => {
                              if (!tried && buzzedTeamIndex === null) {
                                setBuzzTimerRemaining(buzzTimerSeconds)
                                setBuzzedTeamIndex(i)
                                setBuzzFlashTeam(teams[i] ?? null)
                                if (buzzFlashRef.current) clearTimeout(buzzFlashRef.current)
                                buzzFlashRef.current = setTimeout(() => setBuzzFlashTeam(null), 900)
                              }
                            }}
                            disabled={tried || buzzedTeamIndex !== null}
                            className={`relative py-6 px-3 rounded-2xl font-bold text-xl min-h-[80px] transition-all shadow-sm select-none
                              ${isBuzzed
                                ? `${TEAM_BG[team.color] ?? 'bg-blue-500'} text-white scale-105 shadow-lg`
                                : tried
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through opacity-50 cursor-not-allowed'
                                  : buzzedTeamIndex !== null
                                    ? 'opacity-40 cursor-not-allowed bg-white dark:bg-gray-700'
                                    : `bg-white dark:bg-gray-700 border-2 ${TEAM_BORDER[team.color] ?? 'border-gray-300'} ${TEAM_TEXT[team.color] ?? 'text-gray-800'} hover:scale-105 hover:shadow-md cursor-pointer`
                              }`}
                          >
                            {tried && <span className="absolute top-1 right-2 text-sm font-bold">✗</span>}
                            <span className="block text-sm font-semibold opacity-50 mb-1">{i + 1}</span>
                            {team.name}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2">
                      Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">1</kbd>–<kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{teams.length}</kbd> to buzz in
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop scoreboard sidebar */}
          <div className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-4">
              <TeamScoreboard teams={teams} currentTeamIndex={-1} />
            </div>
          </div>
        </div>

        {/* Mobile scoreboard strip */}
        <div className="lg:hidden mt-4 flex gap-2 overflow-x-auto pb-1">
          {[...teams].sort((a, b) => b.score - a.score).map(t => (
            <div
              key={t.id}
              className={`flex-shrink-0 px-3 py-2 rounded-xl border-2 text-sm font-medium ${TEAM_BORDER[t.color] ?? 'border-gray-300'}`}
            >
              {t.name}: <span className="font-bold tabular-nums">{t.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  // ── SOLO MODE LAYOUT ──────────────────────────────────
  return (
    <Container>
      {/* Pause overlay */}
      {isPaused && (
        <div
          className="fixed inset-0 z-[90] bg-gray-950/95 flex flex-col items-center justify-center gap-6 cursor-pointer"
          onClick={() => setIsPaused(false)}
        >
          <div className="text-7xl">⏸</div>
          <h2 className="text-4xl font-black text-white">Paused</h2>
          <p className="text-gray-400 text-sm">Press <kbd className="px-2 py-0.5 rounded bg-gray-800 font-mono border border-gray-700">P</kbd> or click anywhere to resume</p>
        </div>
      )}
      {/* Keyboard shortcut overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[90] bg-gray-950/90 flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              {[
                ['Space / Enter', 'Reveal question'],
                ['1 – 4', 'Select answer'],
                ['P', 'Pause / resume'],
                ['T', 'Open teacher window'],
                ['?', 'Show this overlay'],
                ['Esc', 'Close overlay'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="px-2.5 py-1 rounded bg-gray-800 font-mono text-sm text-gray-200 border border-gray-700">{key}</kbd>
                  <span className="text-sm text-gray-300">{desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="mt-6 w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Close</button>
          </div>
        </div>
      )}
      <div className="flex gap-6 items-start">
        {/* Ladder sidebar */}
        <div className="hidden lg:block w-44 shrink-0 sticky top-4">
          <Card className="p-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-2">
              Ladder
            </p>
            <LadderDisplay currentRung={currentRung} totalRungs={totalQCount} />
          </Card>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Level {currentRung}
              <span className="text-gray-400 dark:text-gray-600"> / {totalQCount}</span>
              <span className="mx-2 text-gray-300 dark:text-gray-700">·</span>
              {categoryName}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-mono font-bold"
                title="Keyboard shortcuts (?)"
                aria-label="Show keyboard shortcuts"
              >?
              </button>
              <button
                onClick={() => setIsPaused(p => !p)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Pause (P)"
                aria-label={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                ✕ End Game
              </Button>
            </div>
          </div>

          {/* ── COVER STATE ── */}
          {!isSoloRevealed ? (
            <div className="rounded-2xl bg-gray-900 dark:bg-gray-950 border border-gray-700 min-h-[420px] flex flex-col items-center justify-center text-center gap-6 p-10 shadow-xl">
              <div className="text-[9rem] leading-none font-black text-gray-700 select-none">?</div>
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">
                  Level {currentRung} of {totalQCount}
                  {currentRungData?.isSafeZone && <span className="ml-2 text-amber-400">🛡️ Safe Zone</span>}
                </p>
                {currentQuestion && <DifficultyBadge difficulty={currentQuestion.difficulty} />}
                <p className="text-gray-500 text-sm mt-2 capitalize">
                  {formatPoints(currentRungData?.points ?? 0)} pts
                </p>
              </div>
              <Button size="lg" onClick={() => setIsSoloRevealed(true)} className="px-10">
                Show Question
              </Button>
              <p className="text-xs text-gray-600">
                Press{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-xs border border-gray-700">Space</kbd>
                {' '}or{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-xs border border-gray-700">Enter</kbd>
                {' '}to reveal
              </p>
              {safeZonePts > 0 && (
                <button
                  onClick={handleWalkAway}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
                >
                  🚶 Walk away with {formatPoints(safeZonePts)} pts
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Lifelines row */}
              <div className="flex items-center gap-2 mb-3 justify-between">
                {safeZonePts > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWalkAway}
                    disabled={gameState !== 'playing'}
                  >
                    🚶 Walk Away ({formatPoints(safeZonePts)})
                  </Button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    onClick={handleFiftyFifty}
                    disabled={fiftyfiftyUsed || gameState !== 'playing'}
                    title="Remove two wrong answers"
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-bold transition-all
                      ${fiftyfiftyUsed
                        ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer'
                      }`}
                  >
                    50/50
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={gameState !== 'playing'}
                    title="Skip this question"
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-bold transition-all
                      ${
                        gameState !== 'playing'
                        ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer'
                      }`}
                  >
                    ⏭ Skip
                  </button>
                </div>
              </div>

              {/* Question card */}
              {currentQuestion && (
                <QuestionCard
                  key={`rung-${currentRung}`}
                  data={{
                    question: currentQuestion.question,
                    answers: currentQuestion.answers,
                    correctAnswer: currentQuestion.correctAnswer,
                    difficulty: currentQuestion.difficulty,
                    categoryName,
                    imageUrl: currentQuestion.imageUrl,
                  }}
                  questionNumber={currentRung}
                  totalQuestions={totalQCount}
                  timerSeconds={timerSeconds}
                  isPaused={isPaused}
                  onAnswer={handleAnswer}
                  eliminatedAnswers={eliminatedAnswers}
                  enableKeyboardAnswers
                />
              )}

              {/* Level footer */}
              {currentRungData && (
                <Card className="px-4 py-2.5 mt-3 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {currentRungData.isSafeZone && '🛡️ Safe Zone · '}
                    {currentRungData.number === totalQCount && '🏆 Final Level · '}
                    <span className="font-semibold">{formatPoints(currentRungData.points)} points</span>
                    {' · '}
                    <span className="capitalize">{currentRungData.difficulty}</span>
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  )
}
