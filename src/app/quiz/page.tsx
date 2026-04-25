'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { LadderDisplay } from '@/components/quiz/LadderDisplay'
import { TeamScoreboard } from '@/components/quiz/TeamScoreboard'
import { Timer } from '@/components/quiz/Timer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { loadSession, saveSession, type Team } from '@/lib/session'
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
  | 'complete'
  | 'error'

const TEAM_BG: Record<string, string> = {
  red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-600',
}

const TEAM_BORDER: Record<string, string> = {
  red: 'border-red-400', blue: 'border-blue-400', green: 'border-green-400', purple: 'border-purple-400',
}

const TEAM_TEXT: Record<string, string> = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  purple: 'text-purple-600 dark:text-purple-400',
}

const TEAM_QUESTION_POINTS: Record<string, number> = { easy: 100, medium: 200, hard: 300 }

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
  const [isRevealed, setIsRevealed] = useState(false)
  const [buzzTimerRemaining, setBuzzTimerRemaining] = useState(0)
  const teamLastResultRef = useRef<{ correct: true; teamName: string; pts: number } | { correct: false; correctAnswer: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const loadAllQuestions = useCallback((catId: number, gradeLevel: string, mode: 'solo' | 'team'): QuizQuestion[] => {
    const diffs: Difficulty[] = ['easy', 'medium', 'hard']
    const pools: QuizQuestion[] = []
    for (const diff of diffs) {
      const byGrade = QUESTIONS.filter(q =>
        q.category === catId && q.difficulty === diff && q.grades.includes(gradeLevel as never)
      )
      const pool = byGrade.length >= 5
        ? byGrade
        : QUESTIONS.filter(q => q.difficulty === diff && q.grades.includes(gradeLevel as never))
      pools.push(...shuffleArray(pool).slice(0, 5).map(q => ({
        id: q.id,
        question: q.question,
        answers: shuffleArray([q.correct, ...q.incorrect]),
        correctAnswer: q.correct,
        difficulty: diff,
      })))
    }
    // Solo: ordered easy→medium→hard (ladder structure)
    // Team: shuffled mix so difficulty escalates unpredictably
    return mode === 'team' ? shuffleArray(pools) : pools
  }, [])

  useEffect(() => {
    const sess = loadSession()
    if (!sess) { router.push('/'); return }
    setSession(sess)
    setCurrentRung(1)
    setTeams(sess.teams ? [...sess.teams] : [])
    setBuzzedTeamIndex(null)
    const qs = loadAllQuestions(sess.categoryId, sess.gradeLevel, sess.mode)
    setAllQuestions(qs)
    setGameState('playing')
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
      clearTimer()
      if (!session) return

      if (session.mode === 'solo') {
        setGameState('answered')
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
        // ── Team buzz-in mode ──────────────────────────────────────────
        if (buzzedTeamIndex === null) return
        const q = allQuestions[currentRung - 1]

        if (correct) {
          const pts = TEAM_QUESTION_POINTS[q?.difficulty ?? 'easy']
          const newTeams = teams.map((t, i) =>
            i === buzzedTeamIndex ? { ...t, score: t.score + pts } : t
          )
          setTeams(newTeams)
          teamLastResultRef.current = { correct: true, teamName: teams[buzzedTeamIndex]?.name ?? '', pts }
          setGameState('answered')
          timerRef.current = setTimeout(() => {
            if (currentRung >= 15) {
              finishGame(0, newTeams, true)
            } else {
              setCurrentRung(r => r + 1)
              setBuzzedTeamIndex(null)
              setTriedTeamIndices([])
              setIsRevealed(false)
              setGameState('playing')
            }
          }, 1800)
        } else {
          const newTried = [...triedTeamIndices, buzzedTeamIndex]
          setTriedTeamIndices(newTried)

          if (newTried.length >= teams.length) {
            // All teams failed — show answer and move on
            setBuzzedTeamIndex(null)
            teamLastResultRef.current = { correct: false, correctAnswer: q?.correctAnswer ?? '' }
            setGameState('answered')
            timerRef.current = setTimeout(() => {
              if (currentRung >= 15) {
                finishGame(0, teams, true)
              } else {
                setCurrentRung(r => r + 1)
                setTriedTeamIndices([])
                setIsRevealed(false)
                setGameState('playing')
              }
            }, 2800)
          } else {
            // Steal opportunity
            const remaining = teams.map((_, i) => i).filter(i => !newTried.includes(i))
            if (remaining.length === 1) {
              // Only one team left — auto-buzz them in so the game keeps moving
              const autoIdx = remaining[0]!
              setBuzzedTeamIndex(autoIdx)
              setBuzzTimerRemaining(session ? getTimerSeconds(session.gradeLevel) : 30)
            } else {
              setBuzzedTeamIndex(null)
            }
          }
        }
      }
    },
    [gameState, session, currentRung, allQuestions, buzzedTeamIndex, triedTeamIndices, teams, finishGame],
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
          <p className="text-red-500 mb-4">Failed to load questions. Please try again.</p>
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

  // ── Team: answered result flash ───────────────────────
  if (gameState === 'answered' && session?.mode === 'team') {
    const result = teamLastResultRef.current
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm mx-auto">
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
              </>
            )}
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-5">Next question coming up…</p>
          </div>
        </div>
      </Container>
    )
  }

  // ── Shared derived values ─────────────────────────────
  const safeZonePts = getSafeZonePoints(currentRung)
  const stealAvailable = triedTeamIndices.length > 0 && buzzedTeamIndex === null

  // ── TEAM MODE LAYOUT ──────────────────────────────────
  if (session?.mode === 'team') {
    const buzzedTeam = buzzedTeamIndex !== null ? teams[buzzedTeamIndex] : null
    const buzzing = buzzedTeamIndex !== null && !isRevealed

    return (
      <Container>
        <div className="flex gap-4 items-start">
          {/* Question area */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Question {currentRung} of 15 · {categoryName}
              </span>
              <div className="flex items-center gap-2">
                {!isRevealed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setBuzzedTeamIndex(null); setIsRevealed(true) }}
                    title="Show the correct answer to everyone"
                  >
                    👁 Reveal Answer
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  ✕ End Game
                </Button>
              </div>
            </div>

            {/* Active team banner — with countdown timer */}
            {buzzedTeam && !isRevealed && (
              <div className={`flex items-center justify-between px-4 py-2 rounded-xl mb-3 text-white font-bold text-sm ${TEAM_BG[buzzedTeam.color] ?? 'bg-blue-500'}`}>
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
                {/* Timer fires on expire — treat as wrong answer */}
                <Timer
                  key={`buzz-timer-${currentRung}-${buzzedTeamIndex}-${triedTeamIndices.length}`}
                  seconds={timerSeconds}
                  isPaused={false}
                  onTick={setBuzzTimerRemaining}
                  onExpire={() => handleAnswer(false)}
                />
              </div>
            )}

            {/* Reveal banner */}
            {isRevealed && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl px-4 py-2 mb-3 text-sm text-green-800 dark:text-green-300 font-medium flex items-center justify-between">
                <span>✅ Answer revealed — the correct answer is highlighted below</span>
                <button
                  onClick={() => {
                    // Skip question, advance
                    teamLastResultRef.current = { correct: false, correctAnswer: currentQuestion?.correctAnswer ?? '' }
                    if (currentRung >= 15) {
                      finishGame(0, teams, true)
                    } else {
                      setCurrentRung(r => r + 1)
                      setTriedTeamIndices([])
                      setIsRevealed(false)
                    }
                  }}
                  className="ml-4 text-xs underline opacity-70 hover:opacity-100"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Steal notification */}
            {stealAvailable && !buzzedTeam && !isRevealed && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-xl px-4 py-2 mb-3 text-sm text-amber-800 dark:text-amber-300 font-medium">
                ❌ Wrong answer! Select a team to steal.
              </div>
            )}

            {/* Question card */}
            {currentQuestion && (
              <QuestionCard
                key={`q-${currentRung}-${triedTeamIndices.length}`}
                data={{
                  question: currentQuestion.question,
                  answers: currentQuestion.answers,
                  correctAnswer: currentQuestion.correctAnswer,
                  difficulty: currentQuestion.difficulty,
                  categoryName,
                }}
                questionNumber={currentRung}
                totalQuestions={15}
                onAnswer={handleAnswer}
                locked={!buzzing}
                showTimer={false}
                revealAnswer={isRevealed}
                suppressFeedback={true}
              />
            )}

            {/* Buzz-in panel */}
            {gameState === 'playing' && !isRevealed && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-3">
                  {stealAvailable ? '🔁 Steal — who buzzes in?' : '📣 Who buzzed in?'}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {teams.map((team, i) => {
                    const tried = triedTeamIndices.includes(i)
                    const isBuzzed = buzzedTeamIndex === i
                    return (
                      <button
                        key={team.id}
                        onClick={() => {
                          if (!tried && buzzedTeamIndex === null) {
                            setBuzzTimerRemaining(timerSeconds)
                            setBuzzedTeamIndex(i)
                          }
                        }}
                        disabled={tried || buzzedTeamIndex !== null}
                        className={`relative py-4 px-3 rounded-2xl font-bold text-lg transition-all shadow-sm select-none
                          ${isBuzzed
                            ? `${TEAM_BG[team.color] ?? 'bg-blue-500'} text-white scale-105 shadow-lg`
                            : tried
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through opacity-50 cursor-not-allowed'
                              : buzzedTeamIndex !== null
                                ? 'opacity-40 cursor-not-allowed bg-white dark:bg-gray-700'
                                : `bg-white dark:bg-gray-700 border-2 ${TEAM_BORDER[team.color] ?? 'border-gray-300'} ${TEAM_TEXT[team.color] ?? 'text-gray-800'} hover:scale-105 hover:shadow-md cursor-pointer`
                          }`}
                      >
                        {tried && <span className="absolute top-1 right-2 text-xs font-normal">✗</span>}
                        {team.name}
                      </button>
                    )
                  })}
                </div>
              </div>
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
              className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 text-sm font-medium ${TEAM_BORDER[t.color] ?? 'border-gray-300'}`}
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
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">{categoryName}</span>
            {safeZonePts > 0 && (
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
      </div>
    </Container>
  )
}
