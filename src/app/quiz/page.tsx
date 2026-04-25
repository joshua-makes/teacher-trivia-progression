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
import { loadSession, saveSession, type Team, type QuestionHistoryItem } from '@/lib/session'
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
  red: 'bg-red-500 dark:bg-red-600',
  blue: 'bg-blue-500 dark:bg-blue-600',
  green: 'bg-green-500 dark:bg-green-600',
  purple: 'bg-purple-600 dark:bg-purple-700',
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
  const [isQuestionRevealed, setIsQuestionRevealed] = useState(false)
  const [readingTimerRemaining, setReadingTimerRemaining] = useState(0)
  const [buzzTimerRemaining, setBuzzTimerRemaining] = useState(0)
  const teamLastResultRef = useRef<{ correct: true; teamName: string; pts: number } | { correct: false; correctAnswer: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buzzFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const questionHistoryRef = useRef<QuestionHistoryItem[]>([])
  const [buzzFlashTeam, setBuzzFlashTeam] = useState<Team | null>(null)
  // Lifelines (solo mode)
  const [fiftyfiftyUsed, setFiftyfiftyUsed] = useState(false)
  const [skipUsed, setSkipUsed] = useState(false)
  const [eliminatedAnswers, setEliminatedAnswers] = useState<string[]>([])
  // Team: countdown shown on the answered flash screen
  const [answeredCountdown, setAnsweredCountdown] = useState<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const loadAllQuestions = useCallback((catId: number, gradeLevel: string, mode: 'solo' | 'team', questionCount: number): QuizQuestion[] => {
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
    const ordered = mode === 'team' ? shuffleArray(pools) : pools
    return ordered.slice(0, questionCount)
  }, [])

  useEffect(() => {
    const sess = loadSession()
    if (!sess) { router.push('/'); return }
    setSession(sess)
    setCurrentRung(1)
    setTeams(sess.teams ? [...sess.teams] : [])
    setBuzzedTeamIndex(null)
    const qs = loadAllQuestions(sess.categoryId, sess.gradeLevel, sess.mode, sess.questionCount ?? 15)
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
      sess.questionHistory = questionHistoryRef.current
      saveSession(sess)
    }
    setGameState('complete')
    timerRef.current = setTimeout(() => router.push('/results'), 1200)
  }, [currentRung, session?.mode, router])

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (gameState !== 'playing') return
      if (!session) return

      // Team-mode guard comes BEFORE clearTimer so a stale timer callback
      // with buzzedTeamIndex=null can't cancel a legitimate pending timeout
      if (session.mode === 'team' && buzzedTeamIndex === null) return

      clearTimer()

      if (session.mode === 'solo') {
        setGameState('answered')
        if (correct) {
          timerRef.current = setTimeout(() => {
            if (currentRung >= allQuestions.length) {
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
        // buzzedTeamIndex is guaranteed non-null by the guard above clearTimer
        const bidx = buzzedTeamIndex as number
        const q = allQuestions[currentRung - 1]

        if (correct) {
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
          }]
          setGameState('answered')
          timerRef.current = setTimeout(() => {
            if (currentRung >= allQuestions.length) {
              finishGame(0, newTeams, true)
            } else {
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

          if (newTried.length >= teams.length) {
            // All teams failed — show answer and move on
            setBuzzedTeamIndex(null)
            teamLastResultRef.current = { correct: false, correctAnswer: q?.correctAnswer ?? '' }
            questionHistoryRef.current = [...questionHistoryRef.current, {
              questionNumber: currentRung,
              questionText: q?.question ?? '',
              correctAnswer: q?.correctAnswer ?? '',
              answeredBy: null,
              correct: false,
            }]
            setGameState('answered')
            timerRef.current = setTimeout(() => {
              if (currentRung >= allQuestions.length) {
                finishGame(0, teams, true)
              } else {
                setCurrentRung(r => r + 1)
                setTriedTeamIndices([])
                setIsQuestionRevealed(false)
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

  const handleFiftyFifty = useCallback(() => {
    if (fiftyfiftyUsed || gameState !== 'playing' || !currentQuestion) return
    const wrongs = currentQuestion.answers.filter(a => a !== currentQuestion.correctAnswer)
    const toRemove = shuffleArray(wrongs).slice(0, 2)
    setEliminatedAnswers(toRemove)
    setFiftyfiftyUsed(true)
  }, [fiftyfiftyUsed, gameState, currentQuestion])

  const handleSkip = useCallback(() => {
    if (skipUsed || gameState !== 'playing' || !session || session.mode !== 'solo') return
    clearTimer()
    setSkipUsed(true)
    setEliminatedAnswers([])
    setGameState('answered')
    timerRef.current = setTimeout(() => {
      if (currentRung >= allQuestions.length) {
        finishGame(getSafeZonePoints(currentRung), [], false)
      } else {
        setCurrentRung(r => r + 1)
        setGameState('playing')
      }
    }, 600)
  }, [skipUsed, gameState, session, currentRung, allQuestions.length, finishGame])

  // Reset eliminated answers when question changes
  useEffect(() => {
    setEliminatedAnswers([])
  }, [currentRung])

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

  // Keyboard shortcuts 1–4 to buzz in teams (team mode only)
  useEffect(() => {
    if (session?.mode !== 'team') return
    if (!isQuestionRevealed || gameState !== 'playing' || buzzedTeamIndex !== null) return
    function onKey(e: KeyboardEvent) {
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < teams.length) {
        if (!triedTeamIndices.includes(idx)) {
          setBuzzTimerRemaining(timerSeconds)
          setBuzzedTeamIndex(idx)
          setBuzzFlashTeam(teams[idx] ?? null)
          if (buzzFlashRef.current) clearTimeout(buzzFlashRef.current)
          buzzFlashRef.current = setTimeout(() => setBuzzFlashTeam(null), 900)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session?.mode, isQuestionRevealed, gameState, buzzedTeamIndex, teams, triedTeamIndices, timerSeconds])

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
            {answeredCountdown !== null && answeredCountdown > 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-5">
                Next in <span className="font-bold tabular-nums text-gray-600 dark:text-gray-300">{answeredCountdown}</span>…
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-5">Next question…</p>
            )}
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
    const buzzing = buzzedTeamIndex !== null

    return (
      <Container>
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
                Question {currentRung} <span className="text-gray-400 dark:text-gray-600">/ {allQuestions.length}</span>
                <span className="mx-2 text-gray-300 dark:text-gray-700">·</span>
                {categoryName}
              </span>
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                ✕ End Game
              </Button>
            </div>

            {/* ── COVER STATE: question not yet revealed ── */}
            {!isQuestionRevealed ? (
              <div className="rounded-2xl bg-gray-900 dark:bg-gray-950 border border-gray-700 min-h-[420px] flex flex-col items-center justify-center text-center gap-6 p-10 shadow-xl">
                <div className="text-[9rem] leading-none font-black text-gray-700 select-none">?</div>
                <div>
                  <p className="text-sm font-semibold text-gray-300 mb-1">
                    Question {currentRung} of {allQuestions.length}
                  </p>
                  <p className="text-gray-500 text-sm">
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
                      seconds={timerSeconds}
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
                    }}
                    questionNumber={currentRung}
                    totalQuestions={allQuestions.length}
                    onAnswer={handleAnswer}
                    locked={!buzzing}
                    showTimer={false}
                    suppressFeedback={true}
                  />
                )}

                {/* Teacher ✓/✗ controls */}
                {buzzing && gameState === 'playing' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAnswer(true)}
                      className="flex-1 py-6 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black text-2xl min-h-[80px] shadow-md transition-all select-none"
                    >
                      ✓ Correct
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      className="flex-1 py-6 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-2xl min-h-[80px] shadow-md transition-all select-none"
                    >
                      ✗ Wrong
                    </button>
                  </div>
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
                                setBuzzTimerRemaining(timerSeconds)
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

          {/* Lifelines */}
          <div className="flex gap-2 mb-3 justify-end">
            <button
              onClick={handleFiftyFifty}
              disabled={fiftyfiftyUsed || gameState !== 'playing'}
              title="Remove two wrong answers"
              className={`px-3 py-1.5 rounded-lg border-2 text-sm font-bold transition-all
                ${ fiftyfiftyUsed
                  ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer'
                }`}
            >
              50/50
            </button>
            <button
              onClick={handleSkip}
              disabled={skipUsed || gameState !== 'playing'}
              title="Skip this question (once per game)"
              className={`px-3 py-1.5 rounded-lg border-2 text-sm font-bold transition-all
                ${ skipUsed
                  ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer'
                }`}
            >
              ⏭ Skip
            </button>
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
              totalQuestions={allQuestions.length}
              timerSeconds={timerSeconds}
              onAnswer={handleAnswer}
              eliminatedAnswers={eliminatedAnswers}
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
