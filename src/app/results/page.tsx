'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DifficultyBadge } from '@/components/quiz/DifficultyBadge'
import { loadSession, clearSession } from '@/lib/session'
import { computeScore } from '@/lib/scoring'
import { CATEGORIES } from '@/lib/data/categories'
import { formatTime, formatPercent } from '@/lib/utils'
import type { Difficulty } from '@/lib/data/questions'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export default function ResultsPage() {
  const router = useRouter()
  const [score, setScore] = useState<ReturnType<typeof computeScore> | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)

  useEffect(() => {
    const session = loadSession()
    if (!session || session.answers.length === 0) {
      router.push('/')
      return
    }
    setCategoryId(session.categoryId)
    setScore(computeScore(session.answers))
  }, [router])

  if (!score) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
          </div>
        </div>
      </Container>
    )
  }

  const accuracyPct = Math.round(score.accuracy * 100)

  return (
    <Container>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">{accuracyPct >= 80 ? '🏆' : accuracyPct >= 60 ? '⭐' : '📚'}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quiz Results</h1>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Overall Performance</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{accuracyPct}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {score.correct}/{score.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatTime(score.totalTimeMs)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Time</div>
            </div>
          </div>
          <ProgressBar value={score.correct} max={score.total} label={`${formatPercent(score.accuracy)} accuracy`} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Avg. {formatTime(score.avgTimeMs)} per question
          </p>
        </Card>

        {Object.keys(score.byCategory).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">By Category</h2>
            <div className="space-y-4">
              {Object.entries(score.byCategory).map(([catId, stats]) => {
                const cat = CATEGORIES.find(c => c.id === Number(catId))
                return (
                  <div key={catId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {cat?.emoji} {cat?.name ?? `Category ${catId}`}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stats.correct}/{stats.total} ({formatPercent(stats.accuracy)})
                      </span>
                    </div>
                    <ProgressBar value={stats.correct} max={stats.total} />
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {Object.keys(score.byDifficulty).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">By Difficulty</h2>
            <div className="space-y-4">
              {DIFFICULTIES.filter(d => score.byDifficulty[d]).map(diff => {
                const stats = score.byDifficulty[diff]
                if (!stats) return null
                return (
                  <div key={diff}>
                    <div className="flex items-center justify-between mb-1">
                      <DifficultyBadge difficulty={diff} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stats.correct}/{stats.total} ({formatPercent(stats.accuracy)})
                      </span>
                    </div>
                    <ProgressBar value={stats.correct} max={stats.total} />
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <div className="flex gap-4 justify-center pb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (categoryId) {
                clearSession()
                router.push('/')
              }
            }}
          >
            🔄 Play Again
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              clearSession()
              router.push('/')
            }}
          >
            🏠 New Category
          </Button>
        </div>
      </div>
    </Container>
  )
}
