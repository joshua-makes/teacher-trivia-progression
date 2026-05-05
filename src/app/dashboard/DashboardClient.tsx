'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { deleteGameSession, type GameSessionRecord } from '@/lib/actions/sessions'
import { formatPoints } from '@/lib/ladder'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ms: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ms))
}

function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`
}

function accuracyColor(a: number) {
  if (a >= 0.8) return 'text-emerald-600 dark:text-emerald-400'
  if (a >= 0.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

type CategoryStat = {
  name: string
  emoji: string
  sessions: number
  accuracy: number
  totalQ: number
  correctQ: number
}

const CATEGORY_EMOJI: Record<number, string> = {
  9: '🌍', 17: '🔬', 19: '🔢', 27: '🐾', 22: '🗺️',
  23: '📜', 21: '⚽', 12: '🎵', 25: '🎨', 18: '💻',
  20: '⚡', 11: '🎬', 0: '📝',
}

function buildCategoryStats(sessions: GameSessionRecord[]): CategoryStat[] {
  const map = new Map<string, CategoryStat>()
  for (const s of sessions) {
    const key = `${s.categoryId}::${s.categoryName}`
    const cur = map.get(key) ?? {
      name: s.categoryName,
      emoji: CATEGORY_EMOJI[s.categoryId] ?? '📝',
      sessions: 0, accuracy: 0, totalQ: 0, correctQ: 0,
    }
    cur.sessions += 1
    cur.totalQ += s.questionCount
    cur.correctQ += s.correctCount
    map.set(key, cur)
  }
  return [...map.values()].map(c => ({
    ...c,
    accuracy: c.totalQ > 0 ? c.correctQ / c.totalQ : 0,
  })).sort((a, b) => b.sessions - a.sessions)
}

function exportCSV(sessions: GameSessionRecord[]) {
  const header = ['Date', 'Mode', 'Grade', 'Category', 'Rung', 'Questions', 'Correct', 'Accuracy%', 'Points', 'Completed']
  const rows = sessions.map(s => [
    fmtDate(s.playedAt),
    s.mode,
    s.gradeLevel,
    s.categoryName,
    s.rungReached,
    s.questionCount,
    s.correctCount,
    Math.round(s.accuracy * 100),
    s.finalPoints ?? '',
    s.completed ? 'Yes' : 'No',
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ladderquiz-history-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV downloaded')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardClient({ initialSessions }: { initialSessions: GameSessionRecord[] }) {
  const router = useRouter()
  const [sessions, setSessions] = useState<GameSessionRecord[]>(initialSessions)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Remove this session from your history?')) return
    setDeletingId(id)
    await deleteGameSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
    toast.success('Session removed')
  }

  // ── Stats summary ─────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalQ = sessions.reduce((s, r) => s + r.questionCount, 0)
  const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0)
  const overallAccuracy = totalQ > 0 ? totalCorrect / totalQ : 0
  const catStats = buildCategoryStats(sessions)
  const bestCat = catStats[0]

  return (
    <Container>
      <div className="max-w-5xl mx-auto py-8">
        <Card className="p-6 sm:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your class game history</p>
          </div>
          <div className="flex gap-2">
            {sessions.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => exportCSV(sessions)}>
                ⬇ Export CSV
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => router.push('/play')}>
              + New Game
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Games played', value: totalSessions.toString() },
            { label: 'Questions asked', value: totalQ.toLocaleString() },
            { label: 'Overall accuracy', value: totalQ > 0 ? fmtPct(overallAccuracy) : '—' },
            { label: 'Top category', value: bestCat ? `${bestCat.emoji} ${bestCat.name}` : '—' },
          ].map(s => (
            <Card key={s.label} className="p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 truncate">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {sessions.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <p className="text-4xl">🎯</p>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">No games recorded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Finish a game while signed in and it will appear here automatically.
            </p>
          </Card>
        ) : (
          <>
            {/* Category strength */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Category breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catStats.map(cat => (
                  <Card key={cat.name} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {cat.emoji} {cat.name}
                      </span>
                      <span className={cn('text-sm font-bold tabular-nums', accuracyColor(cat.accuracy))}>
                        {fmtPct(cat.accuracy)}
                      </span>
                    </div>
                    {/* accuracy bar */}
                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', cat.accuracy >= 0.8 ? 'bg-emerald-500' : cat.accuracy >= 0.5 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${Math.round(cat.accuracy * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {cat.sessions} game{cat.sessions !== 1 ? 's' : ''} · {cat.correctQ}/{cat.totalQ} correct
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Session history */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Session history</h2>
              <div className="space-y-2">
                {sessions.map(s => (
                  <Card key={s.id} className="overflow-hidden">
                    {/* Row */}
                    <button
                      className="w-full text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => setExpandedId(id => id === s.id ? null : s.id)}
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-24 shrink-0">{fmtDate(s.playedAt)}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">
                        {CATEGORY_EMOJI[s.categoryId] ?? '📝'} {s.categoryName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {s.gradeLevel} · {s.mode === 'team' ? '👥 Teams' : '🎓 Solo'}
                      </span>
                      <span className={cn('text-sm font-bold tabular-nums shrink-0 w-12 text-right', accuracyColor(s.accuracy))}>
                        {fmtPct(s.accuracy)}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {expandedId === s.id ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Expanded detail */}
                    {expandedId === s.id && (
                      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-100">Level {s.rungReached}/{s.questionCount}</p>
                            <p className="text-xs text-gray-500">Rung reached</p>
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{s.correctCount}/{s.questionCount}</p>
                            <p className="text-xs text-gray-500">Correct answers</p>
                          </div>
                          {s.finalPoints !== null && (
                            <div>
                              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{formatPoints(s.finalPoints)}</p>
                              <p className="text-xs text-gray-500">Points</p>
                            </div>
                          )}
                          <div>
                            <p className={cn('text-base font-bold', s.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                              {s.completed ? '✓ Completed' : 'Ended early'}
                            </p>
                            <p className="text-xs text-gray-500">Result</p>
                          </div>
                        </div>

                        {/* Question breakdown */}
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {s.questionHistory.map((q, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className={cn('mt-0.5 shrink-0 font-bold', q.correct ? 'text-emerald-500' : 'text-red-400')}>
                                {q.correct ? '✓' : '✗'}
                              </span>
                              <span className="text-gray-700 dark:text-gray-300 flex-1">{q.questionText}</span>
                              {!q.correct && (
                                <span className="text-gray-400 dark:text-gray-500 shrink-0 italic">{q.correctAnswer}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === s.id ? 'Removing…' : 'Remove from history'}
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
        </Card>
      </div>
    </Container>
  )
}
