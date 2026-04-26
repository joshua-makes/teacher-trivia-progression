'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { loadSession, clearSession, createSession, saveSession, getPersonalBest, savePersonalBest, type Team, type QuestionHistoryItem } from '@/lib/session'
import { CATEGORIES } from '@/lib/data/categories'
import { LADDER, formatPoints, getSafeZonePoints } from '@/lib/ladder'
import { cn } from '@/lib/utils'

const TEAM_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  red:    { bg: 'bg-red-500',    text: 'text-white', border: 'border-red-400' },
  orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400' },
  amber:  { bg: 'bg-amber-500',  text: 'text-white', border: 'border-amber-400' },
  green:  { bg: 'bg-green-500',  text: 'text-white', border: 'border-green-400' },
  teal:   { bg: 'bg-teal-500',   text: 'text-white', border: 'border-teal-400' },
  blue:   { bg: 'bg-blue-500',   text: 'text-white', border: 'border-blue-400' },
  indigo: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-400' },
  purple: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' },
  violet: { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-400' },
  pink:   { bg: 'bg-pink-500',   text: 'text-white', border: 'border-pink-400' },
  rose:   { bg: 'bg-rose-500',   text: 'text-white', border: 'border-rose-400' },
}

function getLadderEmoji(rung: number, completed: boolean): string {
  if (completed) return '🪜'
  if (rung >= 11) return '🔥'
  if (rung >= 6) return '⭐'
  return '📚'
}

export default function ResultsPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'solo' | 'team' | null>(null)
  const [completed, setCompleted] = useState(false)
  const [finalPoints, setFinalPoints] = useState<number | null>(null)
  const [rung, setRung] = useState(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>([])
  const [copied, setCopied] = useState(false)
  const [questionCount, setQuestionCount] = useState(15)
  const [displayScore, setDisplayScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [prevBest, setPrevBest] = useState<number | null>(null)
  // Store session snapshot for "Play again (same settings)"
  const [replaySession, setReplaySession] = useState<ReturnType<typeof loadSession>>(null)

  useEffect(() => {
    const session = loadSession()
    if (!session) { router.push('/'); return }

    setMode(session.mode)
    setCompleted(session.completed)
    setFinalPoints(session.finalPoints)
    setRung(session.currentRung ?? 1)
    setTeams(session.teams ?? [])
    const cat = CATEGORIES.find(c => c.id === session.categoryId)
    setCategoryName(session.categoryId === 0 ? 'Custom Questions' : cat?.name ?? 'General Knowledge')
    setQuestionHistory(session.questionHistory ?? [])
    setQuestionCount(session.questionCount ?? 15)
    setReplaySession(session)

    // Personal best (solo only)
    if (session.mode === 'solo') {
      const score = session.finalPoints !== null ? session.finalPoints : getSafeZonePoints(session.currentRung ?? 1)
      const prev = getPersonalBest(session.categoryId, session.gradeLevel)
      setPrevBest(prev)
      const isNew = savePersonalBest(session.categoryId, session.gradeLevel, score)
      setIsNewBest(isNew)
    }

    setLoading(false)
  }, [router])

  // Animate score counting up once loaded
  useEffect(() => {
    if (loading || mode !== 'solo') return
    const target = finalPoints !== null ? finalPoints : getSafeZonePoints(rung)
    if (target === 0) { setDisplayScore(0); return }
    let current = 0
    const increment = Math.max(50, Math.ceil(target / 35))
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setDisplayScore(current)
      if (current >= target) clearInterval(timer)
    }, 25)
    return () => clearInterval(timer)
  }, [loading, finalPoints, rung, mode])

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-5xl animate-pulse">⏳</div>
        </div>
      </Container>
    )
  }

  function handlePlayAgain() {
    clearSession()
    router.push('/')
  }

  function handlePlayAgainSame() {
    if (!replaySession) { router.push('/'); return }
    // Re-create a fresh session with the same settings
    const fresh = createSession(
      replaySession.categoryId,
      replaySession.mode,
      replaySession.gradeLevel,
      replaySession.teams
        ? replaySession.teams.map(t => ({ ...t, score: 0 }))
        : null,
      replaySession.questionCount,
      replaySession.timerSeconds,
      replaySession.buzzTimerSeconds,
    )
    saveSession(fresh)
    router.push('/quiz')
  }

  // ── Team results ──────────────────────────────────────
  if (mode === 'team' && teams.length > 0) {
    const sorted = [...teams].sort((a, b) => b.score - a.score)
    const winner = sorted[0]
    const maxScore = winner?.score ?? 1

    function handleCopyTeam() {
      const scoreLines = sorted
        .map((t, i) => `${['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49'][i] ?? `${i + 1}.`} ${t.name}: ${formatPoints(t.score)} pts`)
        .join('\n')
      const histLines = questionHistory
        .map(item => `Q${item.questionNumber}: ${item.questionText}\n  \u2713 ${item.correctAnswer} \u2014 ${item.correct ? item.answeredBy : 'No one got it'}`)
        .join('\n\n')
      const text = [
        `Ladder Quiz \u2014 ${categoryName}`,
        `Date: ${new Date().toLocaleDateString()}`,
        '',
        'FINAL SCORES',
        scoreLines,
        ...(questionHistory.length > 0 ? ['', 'QUESTION RECAP', histLines] : []),
      ].join('\n')
      void navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }

    return (
      <Container>
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          <Card className="p-6 text-center">
            <div className="text-5xl mb-3">🏅</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Game Over!</h1>
            <p className="text-gray-500 dark:text-gray-400">{categoryName} · {rung - 1} of {questionCount} levels</p>
          </Card>

          {/* Winner banner */}
          {winner && (
            <div
              className={cn(
                'rounded-2xl p-6 text-center text-white shadow-lg',
                TEAM_STYLES[winner.color]?.bg ?? 'bg-blue-500',
              )}
            >
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm font-medium opacity-80 mb-1">Winner!</p>
              <h2 className="text-3xl font-bold">{winner.name}</h2>
              <p className="text-2xl font-semibold opacity-90 mt-1">{formatPoints(winner.score)} pts</p>
            </div>
          )}

          {/* Full scoreboard */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Final Scores</h2>
            <div className="space-y-3">
              {sorted.map((team, i) => (
                <div key={team.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      {i === 0 && '🥇 '}
                      {i === 1 && '🥈 '}
                      {i === 2 && '🥉 '}
                      {i > 2 && `${i + 1}. `}
                      {team.name}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300">
                      {formatPoints(team.score)}
                    </span>
                  </div>
                  <ProgressBar value={team.score} max={maxScore || 1} />
                </div>
              ))}
            </div>
          </Card>

          {/* Question Recap */}
          {questionHistory.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Question Recap</h2>
              <div className="space-y-3">
                {questionHistory.map(item => (
                  <div
                    key={item.questionNumber}
                    className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-0.5">Q{item.questionNumber}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{item.questionText}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Answer: <span className="font-semibold text-gray-700 dark:text-gray-300">{item.correctAnswer}</span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        {item.correct ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold">
                            ✓ {item.answeredBy}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold">
                            ✗ No one
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-2 justify-center print:hidden">
            <button
              onClick={handleCopyTeam}
              className="px-4 py-2 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy results'}
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              🖨️ Print
            </button>
          </div>

          <div className="flex justify-center pb-8">
            <Button variant="primary" size="lg" onClick={handlePlayAgain} className="px-10">
              🔄 Play Again
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  // ── Solo results ──────────────────────────────────────
  const points = finalPoints ?? getSafeZonePoints(rung)
  const isWinner = completed
  const rungData = LADDER[rung - 1]
  const levelsReached = completed ? questionCount : rung - 1

  return (
    <Container>
      <div className="max-w-xl mx-auto space-y-6 py-4">
        <Card className="anim-scale-in p-6 text-center">
          <div className="text-6xl mb-3">{getLadderEmoji(rung, completed)}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {isWinner ? '🎉 Grand Champion!' : completed ? 'Game Complete!' : 'Nice Try!'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{categoryName}</p>
        </Card>

        {/* Score card */}
        <Card className="anim-scale-in anim-d1 p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {isWinner ? 'Top of the ladder!' : 'Points earned'}
          </p>
          <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {formatPoints(displayScore)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Reached level <strong>{levelsReached}</strong> of {questionCount}
          </p>
          {!isWinner && rungData && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {points > 0 ? `🛡️ Safe zone — kept ${formatPoints(points)} pts` : 'No safe zone reached'}
            </p>
          )}
          {isNewBest && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-semibold">
              🏆 New Personal Best!
            </div>
          )}
          {!isNewBest && prevBest !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Personal best: {formatPoints(prevBest)} pts
            </p>
          )}
        </Card>

        {/* Ladder progress */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ladder Progress</h2>
          <div className="space-y-1.5">
            {LADDER.slice(0, questionCount).map(r => {
              const reached = r.number <= levelsReached
              const isFinal = r.number === levelsReached && !isWinner
              return (
                <div key={r.number} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0',
                      reached ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700',
                      isFinal && !completed && 'bg-red-400 text-white',
                    )}
                  >
                    {reached ? (isFinal && !completed ? '✗' : '✓') : ''}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={cn('text-xs', reached ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600')}>
                      {r.isSafeZone && '🛡️ '}Level {r.number}
                    </span>
                    <span className={cn('text-xs tabular-nums', reached ? 'text-gray-600 dark:text-gray-400 font-medium' : 'text-gray-400 dark:text-gray-600')}>
                      {r.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex gap-2 justify-center print:hidden">
          <button
            onClick={() => {
              const recap = questionHistory.length > 0
                ? ['', 'Question Recap:', ...questionHistory.map(h =>
                    `Q${h.questionNumber}: ${h.questionText}\n   Answer: ${h.correctAnswer} — ${h.answeredBy ? '✓ Correct' : '✗ Wrong'}`
                  )]
                : []
              const text = [
                `Ladder Quiz — ${categoryName}`,
                `Date: ${new Date().toLocaleDateString()}`,
                '',
                isWinner ? '🏆 Grand Champion!' : `Reached level ${levelsReached} of ${questionCount}`,
                `Score: ${formatPoints(points)} pts`,
                ...recap,
              ].join('\n')
              void navigator.clipboard.writeText(text)
              setCopied(true)
              setTimeout(() => setCopied(false), 2500)
            }}
            className="px-4 py-2 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy results'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            🖨️ Print
          </button>
        </div>

        {/* Solo question recap */}
        {questionHistory.length > 0 && (
          <Card className="p-5 print:block">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Question Recap</h2>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {questionHistory.map(item => (
                <div key={item.questionNumber} className="py-2.5 flex items-start gap-3">
                  <div className={cn(
                    'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0',
                    item.answeredBy ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white',
                  )}>
                    {item.answeredBy ? '✓' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Q{item.questionNumber}</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{item.questionText}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Answer: <span className="font-medium text-gray-700 dark:text-gray-300">{item.correctAnswer}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
          {replaySession && (
            <Button variant="primary" size="lg" onClick={handlePlayAgainSame} className="px-8">
              🔄 Play Again (same)
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={handlePlayAgain} className="px-8">
            🏠 New Game
          </Button>
        </div>
      </div>
    </Container>
  )
}

