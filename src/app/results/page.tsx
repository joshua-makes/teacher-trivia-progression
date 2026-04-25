'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { loadSession, clearSession, type Team, type QuestionHistoryItem } from '@/lib/session'
import { CATEGORIES } from '@/lib/data/categories'
import { LADDER, formatPoints, getSafeZonePoints } from '@/lib/ladder'
import { cn } from '@/lib/utils'

const TEAM_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  red:    { bg: 'bg-red-500',    text: 'text-white', border: 'border-red-400' },
  blue:   { bg: 'bg-blue-500',   text: 'text-white', border: 'border-blue-400' },
  green:  { bg: 'bg-green-500',  text: 'text-white', border: 'border-green-400' },
  purple: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' },
}

function getLadderEmoji(rung: number, completed: boolean): string {
  if (completed && rung === 15) return '🏆'
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

  useEffect(() => {
    const session = loadSession()
    if (!session) { router.push('/'); return }

    setMode(session.mode)
    setCompleted(session.completed)
    setFinalPoints(session.finalPoints)
    setRung(session.currentRung ?? 1)
    setTeams(session.teams ?? [])
    const cat = CATEGORIES.find(c => c.id === session.categoryId)
    setCategoryName(cat?.name ?? 'General Knowledge')
    setQuestionHistory(session.questionHistory ?? [])
    setLoading(false)
  }, [router])

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
        `Trivia Levels \u2014 ${categoryName}`,
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
          <div className="text-center">
            <div className="text-5xl mb-3">🏅</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Game Over!</h1>
            <p className="text-gray-500 dark:text-gray-400">{categoryName} · {rung - 1} levels completed</p>
          </div>

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
  const isWinner = completed && rung === 15
  const rungData = LADDER[rung - 1]
  const levelsReached = completed ? 15 : rung - 1

  return (
    <Container>
      <div className="max-w-xl mx-auto space-y-6 py-4">
        <div className="text-center">
          <div className="text-6xl mb-3">{getLadderEmoji(rung, completed)}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {isWinner ? '🎉 Grand Champion!' : completed ? 'Game Complete!' : 'Nice Try!'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{categoryName}</p>
        </div>

        {/* Score card */}
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {isWinner ? 'Top of the ladder!' : 'Points earned'}
          </p>
          <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {formatPoints(points)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Reached level <strong>{levelsReached}</strong> of 15
          </p>
          {!isWinner && rungData && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {points > 0 ? `🛡️ Safe zone — kept ${formatPoints(points)} pts` : 'No safe zone reached'}
            </p>
          )}
        </Card>

        {/* Ladder progress */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ladder Progress</h2>
          <div className="space-y-1.5">
            {LADDER.map(r => {
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
              const text = [
                `Trivia Levels — ${categoryName}`,
                `Date: ${new Date().toLocaleDateString()}`,
                '',
                isWinner ? '🏆 Grand Champion!' : `Reached level ${levelsReached} of 15`,
                `Score: ${formatPoints(points)} pts`,
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

        <div className="flex justify-center pb-8">
          <Button variant="primary" size="lg" onClick={handlePlayAgain} className="px-10">
            🔄 Play Again
          </Button>
        </div>
      </div>
    </Container>
  )
}

