'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { loadSession, clearSession, type Team } from '@/lib/session'
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
          <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tabular-nums">
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

        <div className="flex justify-center pb-8">
          <Button variant="primary" size="lg" onClick={handlePlayAgain} className="px-10">
            🔄 Play Again
          </Button>
        </div>
      </div>
    </Container>
  )
}

