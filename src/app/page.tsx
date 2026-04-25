'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CATEGORIES } from '@/lib/data/categories'
import { GRADE_LEVELS, type GradeLevel } from '@/lib/ladder'
import { clearSession, createSession, saveSession, type Team } from '@/lib/session'
import { cn } from '@/lib/utils'

const TEAM_COLORS = ['red', 'blue', 'green', 'purple'] as const

const TEAM_COLOR_INPUT: Record<string, string> = {
  red:    'border-red-300 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200',
  blue:   'border-blue-300 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200',
  green:  'border-green-300 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200',
  purple: 'border-purple-300 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200',
}

export default function HomePage() {
  const router = useRouter()
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('3-5')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [mode, setMode] = useState<'solo' | 'team'>('solo')
  const [teamCount, setTeamCount] = useState(2)
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2', 'Team 3', 'Team 4'])

  const filteredCategories = CATEGORIES.filter(c => c.gradeLevels.includes(gradeLevel))

  function handleStart() {
    if (!categoryId) return
    clearSession()
    const teams: Team[] | null =
      mode === 'team'
        ? Array.from({ length: teamCount }, (_, i) => ({
            id: i,
            name: teamNames[i]?.trim() || `Team ${i + 1}`,
            color: TEAM_COLORS[i],
            score: 0,
          }))
        : null
    const session = createSession(categoryId, mode, gradeLevel, teams)
    saveSession(session)
    router.push('/quiz')
  }

  return (
    <Container>
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10 pt-4">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Trivia Levels
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto">
            Classroom trivia for K–12. Questions get harder as you climb — can your class reach the top?
          </p>
        </div>

        <div className="space-y-5">
          {/* Step 1: Grade Level */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              1 · Grade Level
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {GRADE_LEVELS.map(gl => (
                <button
                  key={gl.value}
                  onClick={() => { setGradeLevel(gl.value); setCategoryId(null) }}
                  className={cn(
                    'rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all text-center',
                    gradeLevel === gl.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 text-gray-700 dark:text-gray-300',
                  )}
                >
                  <div className="text-xl mb-0.5">{gl.emoji}</div>
                  <div>{gl.label}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 2: Category */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              2 · Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    categoryId === cat.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                  aria-pressed={categoryId === cat.id}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 3: Game Mode */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              3 · Game Mode
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('solo')}
                className={cn(
                  'rounded-lg border-2 p-4 text-center transition-all',
                  mode === 'solo'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300',
                )}
                aria-pressed={mode === 'solo'}
              >
                <div className="text-3xl mb-1">🧑‍🎓</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">Classroom</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Whole class climbs together</div>
              </button>
              <button
                onClick={() => setMode('team')}
                className={cn(
                  'rounded-lg border-2 p-4 text-center transition-all',
                  mode === 'team'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300',
                )}
                aria-pressed={mode === 'team'}
              >
                <div className="text-3xl mb-1">🏅</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">Teams</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Buzz-in, take turns, compete</div>
              </button>
            </div>
          </Card>

          {/* Step 4: Team Setup */}
          {mode === 'team' && (
            <Card className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                4 · Team Setup
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Teams:</span>
                <div className="flex gap-2">
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setTeamCount(n)}
                      className={cn(
                        'w-9 h-9 rounded-full border-2 font-bold text-sm transition-all',
                        teamCount === n
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: teamCount }, (_, i) => (
                  <div key={i} className={cn('rounded-lg border-2 px-3 py-2', TEAM_COLOR_INPUT[TEAM_COLORS[i]])}>
                    <input
                      type="text"
                      value={teamNames[i]}
                      onChange={e => {
                        const next = [...teamNames]
                        next[i] = e.target.value
                        setTeamNames(next)
                      }}
                      maxLength={20}
                      placeholder={`Team ${i + 1}`}
                      className="w-full bg-transparent font-semibold text-sm outline-none placeholder:opacity-40"
                      aria-label={`Team ${i + 1} name`}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Start */}
          <div className="flex justify-center pb-8">
            <Button
              variant="primary"
              size="lg"
              disabled={!categoryId}
              onClick={handleStart}
              className="px-12"
            >
              {categoryId ? '🚀 Launch Game' : 'Select a category to begin'}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}

