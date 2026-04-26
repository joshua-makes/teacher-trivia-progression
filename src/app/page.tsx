'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CATEGORIES } from '@/lib/data/categories'
import { QUESTIONS } from '@/lib/data/questions'
import { GRADE_LEVELS, type GradeLevel } from '@/lib/ladder'
import { clearSession, createSession, saveSession, type Team } from '@/lib/session'
import { cn } from '@/lib/utils'
import { Emoji } from '@/components/ui/Emoji'

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
  const [questionCount, setQuestionCount] = useState(15)
  const [showPreview, setShowPreview] = useState(false)

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
    const session = createSession(categoryId, mode, gradeLevel, teams, questionCount)
    saveSession(session)
    router.push('/quiz')
  }

  return (
    <Container>
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="anim-fade-up rounded-3xl bg-gray-900 dark:bg-gray-900 border border-gray-800 dark:border-gray-700 text-center py-16 px-8 mb-10 shadow-xl relative">
          {/* Glow orb — centered behind the emoji */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl" />
          </div>
          <div className="relative">
            <Emoji emoji="🪜" size={96} className="mx-auto mb-5" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight relative">
            Ladder Quiz
          </h1>
          <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed relative">
            Classroom trivia for K–12. Climb the ladder as questions get harder.
          </p>
        </div>

        <div className="space-y-5">
          {/* Step 1: Grade Level */}
          <Card className="anim-fade-up anim-d1 p-5">
            <h2 className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">1</span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Grade Level</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {GRADE_LEVELS.map(gl => (
                <button
                  key={gl.value}
                  onClick={() => { setGradeLevel(gl.value); setCategoryId(null) }}
                  className={cn(
                    'relative rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all text-center',
                    gradeLevel === gl.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 text-gray-700 dark:text-gray-300',
                  )}
                >
                  {gradeLevel === gl.value && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                  )}
                  <Emoji emoji={gl.emoji} size={36} className="mx-auto mb-1" />
                  <div>{gl.label}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 2: Category */}
          <Card className="anim-fade-up anim-d2 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-baseline gap-3">
                <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">2</span>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Category</span>
              </h2>
              <button
                onClick={() => {
                  const pick = filteredCategories[Math.floor(Math.random() * filteredCategories.length)]
                  if (pick) setCategoryId(pick.id)
                }}
                title="Pick a random category"
                aria-label="Random category"
                className="hover:scale-125 active:scale-95 transition-transform"
              >
                <Emoji emoji="🎲" size={28} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'relative rounded-lg border-2 p-3 text-left transition-all',
                    categoryId === cat.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                  aria-pressed={categoryId === cat.id}
                >
                  {categoryId === cat.id && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                  )}
                  <Emoji emoji={cat.emoji} size={32} className="mb-1" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</div>
                </button>
              ))}
            </div>

            {/* Question preview */}
            {categoryId && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowPreview(p => !p)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showPreview ? '\u25be' : '\u25b8'} Preview questions ({QUESTIONS.filter(q => q.category === categoryId && q.grades.includes(gradeLevel)).length} for this grade)
                </button>
                {showPreview && (
                  <div className="mt-3 space-y-4 max-h-72 overflow-y-auto pr-1">
                    {(['easy', 'medium', 'hard'] as const).map(diff => {
                      const qs = QUESTIONS.filter(q => q.category === categoryId && q.difficulty === diff && q.grades.includes(gradeLevel))
                      if (qs.length === 0) return null
                      return (
                        <div key={diff}>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                            {diff === 'easy' ? '✦ Easy' : diff === 'medium' ? '◆ Medium' : '★ Hard'} · {qs.length} questions
                          </p>
                          <div className="space-y-1.5">
                            {qs.map((q, i) => (
                              <div key={q.id} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 px-3 py-2">
                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{i + 1}. {q.question}</p>
                                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">✓ {q.correct}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Step 3: Game Mode */}
          <Card className="anim-fade-up anim-d3 p-5">
            <h2 className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">3</span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Game Mode</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('solo')}
                className={cn(
                  'relative rounded-lg border-2 p-4 text-center transition-all',
                  mode === 'solo'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300',
                )}
                aria-pressed={mode === 'solo'}
              >
                {mode === 'solo' && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                )}
                <Emoji emoji="🧑‍🎓" size={44} className="mx-auto mb-2" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">Classroom</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Whole class climbs together</div>
              </button>
              <button
                onClick={() => setMode('team')}
                className={cn(
                  'relative rounded-lg border-2 p-4 text-center transition-all',
                  mode === 'team'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300',
                )}
                aria-pressed={mode === 'team'}
              >
                {mode === 'team' && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                )}
                <Emoji emoji="🏅" size={44} className="mx-auto mb-2" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">Teams</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Buzz-in, take turns, compete</div>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Questions per game:</span>
              <div className="flex gap-2">
                {[5, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={cn(
                      'w-10 h-9 rounded-lg border-2 font-bold text-sm transition-all',
                      questionCount === n
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Step 4: Team Setup */}
          {mode === 'team' && (
            <Card className="anim-fade-up p-5">
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">4</span>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Team Setup</span>
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
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400',
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
          <div className="anim-fade-up anim-d4 flex justify-center pb-8">
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

