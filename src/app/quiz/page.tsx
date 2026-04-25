'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { LadderDisplay } from '@/components/quiz/LadderDisplay'
import { TeamScoreboard } from '@/components/quiz/TeamScoreboard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { loadSession, saveSession, type Team } from '@/lib/session'
import { fetchQuestions, decodeHtmlEntities } from '@/lib/opentdb'
import { QUESTIONS } from '@/lib/data/questions'
import { CATEGORIES } from '@/lib/data/categories'
import { LADDER, getSafeZonePoints, getTimerSeconds, formatPoints } from '@/lib/ladder'
import { shuffleArray } from '@/lib/shuffle'
import type { Difficulty } from '@/lib/data/questions'
import type { QuizSession } from '@/lib/session'

type QuizQuestion = {
  id: string
  question: string
  answers: string[]
  correctAnswer: string
  difficulty: Difficulty
}

type GameState =
  | 'loading'
  | 'playing'
  | 'answered'
  | 'team-next'
  | 'complete'
  | 'error'

const TEAM_BG: Record<string, string> = {
  red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-600',
}

const TEAM_BORDER: Record<string, string> = {
  red: 'border-red-400', blue: 'border-blue-400', green: 'border-green-400', purple: 'border-purple-400',
}

export default function QuizPage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('loading')
  const [session, setSession] = useState<QuizSession | null>(null)
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [currentRung, setCurrentRung] = useState(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const loadAllQuestions = useCallback(async (catId: number): Promise<QuizQuestion[]> => {
    const diffs: Difficulty[] = ['easy', 'medium', 'hard']
    const apiResults = await Promise.all(diffs.map(d => fetchQuestions(catId, d, 5)))

    const out: QuizQuestion[] = []
    for (let i = 0; i < 3; i++) {
      const diff = diffs[i]
      const api = apiResults[i]
      if (api && api.length >= 5) {
        out.push(...api.slice(0, 5).map((q, idx) => ({
          id: `api-${diff}-${idx}`,
          question: decodeHtmlEntities(q.question),
          answers: shuffleArray([
            decodeHtmlEntities(q.correct_answer),
            ...q.incorrect_answers.map(decodeHtmlEntities),
          ]),
          correctAnswer: decodeHtmlEntities(q.correct_answer),
          difficulty: diff,
        })))
      } else {
        const local = QUESTIONS.filter(q => q.category === catId && q.difficulty === diff)
        const pool = local.length >= 5 ? local : QUESTIONS.filter(q => q.difficulty === diff)
        out.push(...shuffleArray(pool).slice(0, 5).map(q => ({
          id: q.id,
          question: q.question,
          answers: shuffleArray([q.correct, ...q.incorrect]),
          correctAnswer: q.correct,
          difficulty: diff,
        })))
      }
    }
    return out
  }, [])

  useEffect(() => {
    const sess = loadSession()
    if (!sess) { router.push('/'); return }
    setSession(sess)
    setCurrentRung(1)
    setTeams(sess.teams ? [...sess.teams] : [])
    setCurrentTeamIndex(0)
    loadAllQuestions(sess.categoryId)
      .then(qs => { setAllQuestions(qs); setGameState('playing') })
      .catch(() => setGameState('error'))
    return () => clearTimer()
  }, [router, loadAllQuestions])

  const currentQuestion = allQuestions[currentRung - 1] ?? null
  const currentRungData = LADDER[currentRung - 1]
  const timerSeconds = session ? getTimerSeconds(session.gradeLevel) : 30
  const categoryName = CATEGORIES.find(c => c.id === session?.categoryId)?.name ?? ''

  const finishGame = useCallback((pts: number, winTeams: Team[], completed: boolean) => {
    const sess = loadSession()
    if (sess) {
      sess.completed = completed
      sess.currentRung = currentRung
      sess.finalPoints = session?.mode === 'solo' ? pts : null
      sess.teams = winTeams.length > 0 ? winTeams : sess.teams
      saveSession(sess)
    }
    setGameState('complete')
    timerRef.current = setTimeout(() => router.push('/results'), 1200)
  }, [currentRung, session?.mode, router])

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (gameState !== 'playing') return
      setGameState('answered')
      clearTimer()

      if (!session) return

      if (session.mode === 'solo') {
        if (correct) {
          timerRef.current = setTimeout(() => {
            if (currentRung >= 15) {
              finishGame(1_000_000, [], true)
            } else {
              setCurrentRung(r => r + 1)
              setGameState('playing')
            }
          }, 1000)
        } else {
          timerRef.current = setTimeout(() => {
            finishGame(getSafeZonePoints(currentRung), [], false)
          }, 2500)
        }
      } else {
        // Team mode — update score, advance rung, rotate team
        const newTeams = teams.map((t, i) =>
          i === currentTeamIndex && correct
            ? { ...t, score: t.score + (currentRungData?.points ?? 0) }
            : t,
        )
        setTeams(newTeams)

        timerRef.current = setTimeout(() => {
          if (currentRung >= 15) {
            finishGame(0, newTeams, true)
            return
          }
          const nextRung = currentRung + 1
          const nextTeam = (currentTeamIndex + 1) % (newTeams.length || 1)
          setCurrentRung(nextRung)
          setCurrentTeamIndex(nextTeam)
          const sess = loadSession()
          if (sess) { sess.currentRung = nextRung; sess.currentTeamIndex = nextTeam; sess.teams = newTeams; saveSession(sess) }

          if (newTeams.length > 1) {
            setGameState('team-next')
            timerRef.current = setTimeout(() => setGameState('playing'), 2200)
          } else {
            setGameState('playing')
          }
        }, 1600)
      }
    },
    [gameState, session, currentRung, currentRungData, currentTeamIndex, teams, finishGame],
  )

  const handleWalkAway = useCallback(() => {
    if (!session || session.mode !== 'solo') return
    clearTimer()
    finishGame(getSafeZonePoints(currentRung), [], false)
  }, [session, currentRung, finishGame])

  // ── Loading ──────────────────────────────────────────
  if (gameState === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🏆</div>
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
          <p className="text-red-500 mb-4">Failed to load questions. Please check your connection.</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </Card>
      </Container>
    )
  }

  // ── Complete ──────────────────────────────────────────
  if (gameState === 'complete') {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {session?.mode === 'team' ? 'Game Complete!' : 'Amazing!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading your results…</p>
          </div>
        </div>
      </Container>
    )
  }

  // ── Team transition screen ────────────────────────────
  if (gameState === 'team-next' && teams.length > 0) {
    const nextTeam = teams[currentTeamIndex]
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className={`text-center rounded-2xl px-12 py-10 text-white shadow-xl ${TEAM_BG[nextTeam?.color ?? 'blue'] ?? 'bg-blue-500'}`}
          >
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-lg opacity-80 font-medium mb-1">Level {currentRung}</p>
            <h2 className="text-4xl font-bold">{nextTeam?.name}</h2>
            <p className="text-xl opacity-80 mt-2">You&apos;re up!</p>
          </div>
        </div>
      </Container>
    )
  }

  // ── Main game ─────────────────────────────────────────
  const safeZonePts = getSafeZonePoints(currentRung)

  return (
    <Container>
      <div className="flex gap-4 items-start">
        {/* Ladder sidebar */}
        <div className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-2">
              Ladder
            </p>
            <LadderDisplay currentRung={currentRung} />
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
          {/* Mobile team strip */}
          {session?.mode === 'team' && teams.length > 0 && (
            <div className="lg:hidden mb-3 flex gap-2 overflow-x-auto pb-1">
              {teams.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${TEAM_BORDER[t.color] ?? 'border-gray-300'} ${i === currentTeamIndex ? 'bg-white dark:bg-gray-800 font-bold shadow-sm' : 'opacity-50'}`}
                >
                  {i === currentTeamIndex && '▶ '}
                  {t.name}: <span className="tabular-nums">{formatPoints(t.score)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {session?.mode === 'team' ? `${teams[currentTeamIndex]?.name ?? ''} · ` : ''}
              {categoryName}
            </span>
            {session?.mode === 'solo' && safeZonePts > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWalkAway}
                disabled={gameState !== 'playing'}
                title="Take your safe zone points and walk away"
              >
                🚶 Walk Away ({formatPoints(safeZonePts)} pts)
              </Button>
            )}
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
              }}
              questionNumber={currentRung}
              totalQuestions={15}
              timerSeconds={timerSeconds}
              onAnswer={handleAnswer}
            />
          )}

          {/* Level value */}
          {currentRungData && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
              {currentRungData.isSafeZone && '🛡️ Safe Zone · '}
              {currentRungData.number === 15 && '🏆 Top of the Ladder · '}
              <span className="font-semibold">{formatPoints(currentRungData.points)} points</span>
              {' · '}
              <span className="capitalize">{currentRungData.difficulty}</span>
            </p>
          )}
        </div>

        {/* Team scores sidebar */}
        {session?.mode === 'team' && teams.length > 0 && (
          <div className="hidden lg:block w-44 shrink-0">
            <div className="sticky top-4">
              <TeamScoreboard teams={teams} currentTeamIndex={currentTeamIndex} />
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
