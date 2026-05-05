'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CATEGORIES } from '@/lib/data/categories'
import { QUESTIONS } from '@/lib/data/questions'
import { GRADE_LEVELS, getTimerSeconds, type GradeLevel } from '@/lib/ladder'
import { clearSession, createSession, loadSession, saveSession, type QuizSession, type Team } from '@/lib/session'
import { loadQuestionSets, type QuestionSet } from '@/lib/customQuestions'
import { cn } from '@/lib/utils'
import { Emoji } from '@/components/ui/Emoji'
import { loadSettings } from '@/lib/settings'

/**
 * Returns the set of question-count buttons to show for a given pool size.
 * Always includes multiples of 5 that fit (5, 10, 15), plus the exact pool
 * size when it's not already one of those steps and is below 15.
 *   pool=3  → [3]
 *   pool=7  → [5, 7]
 *   pool=12 → [5, 10, 12]
 *   pool=15 → [5, 10, 15]
 *   pool=20 → [5, 10, 15]
 */
function getQuestionCountOptions(pool: number): number[] {
  const steps = [5, 10, 15, 20, 25, 30]
  const opts = steps.filter(n => n <= pool)
  if (pool < 15 && !steps.includes(pool)) opts.push(pool)
  opts.sort((a, b) => a - b)
  return opts.length > 0 ? opts : [Math.min(pool, 15)]
}

const ALL_TEAM_COLORS = [
  'red', 'orange', 'amber', 'green', 'teal',
  'blue', 'indigo', 'purple', 'violet', 'pink', 'rose',
] as const

type TeamColor = typeof ALL_TEAM_COLORS[number]

const DEFAULT_TEAM_COLORS: TeamColor[] = ['red', 'blue', 'green', 'purple']

/** Hex values used for swatch circles in the color picker */
const SWATCH_HEX: Record<TeamColor, string> = {
  red:    '#ef4444',
  orange: '#f97316',
  amber:  '#f59e0b',
  green:  '#22c55e',
  teal:   '#14b8a6',
  blue:   '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f8',
  violet: '#8b5cf6',
  pink:   '#ec4899',
  rose:   '#f43f5e',
}

const TEAM_COLOR_INPUT: Record<TeamColor, string> = {
  red:    'border-red-300 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200',
  orange: 'border-orange-300 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200',
  amber:  'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
  green:  'border-green-300 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200',
  teal:   'border-teal-300 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200',
  blue:   'border-blue-300 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200',
  indigo: 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200',
  purple: 'border-purple-300 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200',
  violet: 'border-violet-300 bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200',
  pink:   'border-pink-300 bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-200',
  rose:   'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200',
}

export function PlayClient({ isSignedIn }: { isSignedIn: boolean }) {
  const router = useRouter()
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('3-5')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [mode, setMode] = useState<'solo' | 'team'>('solo')
  const [teamCount, setTeamCount] = useState(2)
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2', 'Team 3', 'Team 4'])
  const [questionCount, setQuestionCount] = useState(15)
  const [showPreview, setShowPreview] = useState(false)
  const [resumableSession, setResumableSession] = useState<QuizSession | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(() => {
    const settings = loadSettings()
    return settings.timerOverrides['3-5'] ?? getTimerSeconds('3-5')
  })
  const [buzzTimerSeconds, setBuzzTimerSeconds] = useState(() => {
    const settings = loadSettings()
    return settings.timerOverrides['3-5'] ?? getTimerSeconds('3-5')
  })
  const [teamColors, setTeamColors] = useState<TeamColor[]>([...DEFAULT_TEAM_COLORS])
  // Custom question sets
  const [customSets, setCustomSets] = useState<QuestionSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [showTimers, setShowTimers] = useState(false)

  // Read adaptive difficulty from persistent settings (configured via ⚙️ modal)
  const adaptiveDifficulty = (() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = localStorage.getItem('trivia_settings')
      if (!raw) return false
      return (JSON.parse(raw) as { adaptiveDifficulty?: boolean }).adaptiveDifficulty ?? false
    } catch { return false }
  })()

  // Reset timer defaults whenever grade level changes (respect settings override)
  useEffect(() => {
    const settings = loadSettings()
    const def = settings.timerOverrides[gradeLevel] ?? getTimerSeconds(gradeLevel)
    setTimerSeconds(def)
    setBuzzTimerSeconds(def)
  }, [gradeLevel])

  useEffect(() => {
    const sess = loadSession()
    if (sess && !sess.gameOver) {
      setResumableSession(sess)
    }
    const sets = loadQuestionSets()
    setCustomSets(sets)
    // Auto-select a set from ?setId= param (e.g. coming from /questions "Play" button)
    const params = new URLSearchParams(window.location.search)
    const setId = params.get('setId')
    if (setId && sets.some(s => s.id === setId)) {
      setCategoryId(0)
      setSelectedSetId(setId)
    }

  }, [])

  const filteredCategories = CATEGORIES.filter(c => c.gradeLevels.includes(gradeLevel))
  // Custom sets: show all (no gradeLevel) + those matching current grade
  const filteredCustomSets = customSets.filter(s => !s.gradeLevel || s.gradeLevel === gradeLevel)

  // ── Derived: available question count for the current selection ──────────
  const selectedSet = categoryId === 0
    ? (customSets.find(s => s.id === selectedSetId) ?? null)
    : null
  const availableCount = selectedSet
    ? selectedSet.questions.length
    : (categoryId !== null && categoryId !== 0)
      ? QUESTIONS.filter(q => q.category === categoryId && q.grades.includes(gradeLevel)).length
      : 15
  const questionCountOptions = getQuestionCountOptions(Math.max(1, availableCount))

  // Snap questionCount to a valid option whenever the available pool changes
  useEffect(() => {
    if (!questionCountOptions.includes(questionCount)) {
      setQuestionCount(questionCountOptions[questionCountOptions.length - 1]!)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCount])

  function handleStart() {
    if (categoryId === null) return
    if (categoryId === 0 && !selectedSetId) return
    clearSession()
    const teams: Team[] | null =
      mode === 'team'
        ? Array.from({ length: teamCount }, (_, i) => ({
            id: i,
            name: teamNames[i]?.trim() || `Team ${i + 1}`,
            color: teamColors[i] ?? DEFAULT_TEAM_COLORS[i] ?? 'blue',
            score: 0,
          }))
        : null
    const session = createSession(
      categoryId,
      mode,
      gradeLevel,
      teams,
      questionCount,
      timerSeconds,
      mode === 'team' ? buzzTimerSeconds : null,
      categoryId === 0 ? (selectedSetId ?? undefined) : undefined,
      adaptiveDifficulty,
    )
    saveSession(session)
    router.push('/quiz')
  }

  return (
    <Container>
      <div className="max-w-3xl mx-auto">
        {/* Continue game banner */}
        {resumableSession && (() => {
          const cat = CATEGORIES.find(c => c.id === resumableSession.categoryId)
          return (
            <div className="mb-6 rounded-2xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-teal-800 dark:text-teal-200">Resume your game?</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                  {cat?.emoji} {cat?.name ?? 'Unknown'}
                  {' · '}
                  {resumableSession.gradeLevel}
                  {' · '}
                  {resumableSession.mode === 'team' ? 'Teams' : 'Classroom'}
                  {' · '}
                  Question {resumableSession.currentRung} of {resumableSession.questionCount}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push('/quiz')}
                >
                  Continue
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { clearSession(); setResumableSession(null) }}
                >
                  Discard
                </Button>
              </div>
            </div>
          )
        })()}

        {/* Page heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Set up a game</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pick a grade, category, and mode — then launch.</p>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">1</span>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Grade Level</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {GRADE_LEVELS.map(gl => (
                <button
                  key={gl.value}
                  onClick={() => { setGradeLevel(gl.value); setCategoryId(null) }}
                  className={cn(
                    'relative rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all text-center',
                    gradeLevel === gl.value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 text-gray-700 dark:text-gray-300',
                  )}
                >
                  {gradeLevel === gl.value && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                  )}
                  <Emoji emoji={gl.emoji} size={36} className="mx-auto mb-1" />
                  <div>{gl.label}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Step 2: Category */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-baseline gap-3">
                <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">2</span>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Category</span>
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
              {filteredCategories.map(cat => {
                const qCount = QUESTIONS.filter(q => q.category === cat.id && q.grades.includes(gradeLevel)).length
                return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'relative rounded-lg border-2 p-3 text-left transition-all',
                    categoryId === cat.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                  aria-pressed={categoryId === cat.id}
                >
                  {categoryId === cat.id && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                  )}
                  <Emoji emoji={cat.emoji} size={32} className="mb-1" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{qCount} questions</div>
                </button>
                )
              })}
            </div>

            {/* Question preview — built-in categories only */}
            {categoryId !== null && categoryId !== 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowPreview(p => !p)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
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

            {/* Custom question sets — shown below built-in categories */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              {filteredCustomSets.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Your Sets</span>
                    <button
                      onClick={() => router.push('/questions')}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-teal-500 transition-colors"
                    >
                      Manage →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredCustomSets.map(set => (
                      <button
                        key={set.id}
                        onClick={() => { setCategoryId(0); setSelectedSetId(set.id) }}
                        className={cn(
                          'relative rounded-lg border-2 p-3 text-left transition-all',
                          categoryId === 0 && selectedSetId === set.id
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 shadow-sm'
                            : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                        )}
                        aria-pressed={categoryId === 0 && selectedSetId === set.id}
                      >
                        {categoryId === 0 && selectedSetId === set.id && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                        )}
                        <span className="text-2xl mb-1 block">{set.emoji}</span>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{set.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{set.questions.length} questions</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : customSets.length > 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No sets for <span className="font-semibold">{gradeLevel}</span> —{' '}
                  <button onClick={() => router.push('/questions')} className="underline hover:text-teal-500">manage sets →</button>
                </p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/questions')}
                    className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    ✏️ Create a custom question set →
                  </button>
                  {!isSignedIn && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      <button onClick={() => router.push('/sign-in?next=/play')} className="underline hover:text-teal-500">Sign in</button>
                      {' '}to sync your question sets across devices.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Step 3: Game Mode */}
          <Card className="p-5">
            <h2 className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">3</span>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Game Mode</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('solo')}
                className={cn(
                  'relative rounded-lg border-2 p-4 text-center transition-all',
                  mode === 'solo'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300',
                )}
                aria-pressed={mode === 'solo'}
              >
                {mode === 'solo' && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                )}
                <Emoji emoji="🏫" size={44} className="mx-auto mb-2" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">Classroom</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Whole class climbs together</div>
              </button>
              <button
                onClick={() => setMode('team')}
                className={cn(
                  'relative rounded-lg border-2 p-4 text-center transition-all',
                  mode === 'team'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300',
                )}
                aria-pressed={mode === 'team'}
              >
                {mode === 'team' && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                )}
                <Emoji emoji="🏆" size={44} className="mx-auto mb-2" />
                <div className="font-semibold text-gray-900 dark:text-gray-100">Teams</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Buzz-in, take turns, compete</div>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Questions per game:</span>
              <div className="flex gap-2 flex-wrap">
                {questionCountOptions.map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={cn(
                      'min-w-[2.5rem] px-2 h-9 rounded-lg border-2 font-bold text-sm transition-all',
                      questionCount === n
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-teal-400',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {selectedSet && availableCount < 15 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  ({availableCount} in set)
                </span>
              )}
            </div>

            {/* Timer sliders — collapsed by default */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowTimers(p => !p)}
                className="flex items-center justify-between w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="font-bold uppercase tracking-widest">Timers</span>
                <span className="tabular-nums font-medium">
                  {mode === 'solo'
                    ? `${timerSeconds}s`
                    : `read ${timerSeconds}s · buzz ${buzzTimerSeconds}s`}
                  <span className="ml-1">{showTimers ? '▴' : '▾'}</span>
                </span>
              </button>
              {showTimers && (
                <div className="mt-3 space-y-3">
                  {mode === 'solo' ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-32 shrink-0">Answer time</span>
                      <input
                        type="range" min={5} max={60} step={5}
                        value={timerSeconds}
                        onChange={e => setTimerSeconds(Number(e.target.value))}
                        className="flex-1 accent-teal-500"
                        aria-label="Answer time in seconds"
                      />
                      <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300 w-10 text-right">{timerSeconds}s</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-32 shrink-0">Reading time</span>
                        <input
                          type="range" min={5} max={60} step={5}
                          value={timerSeconds}
                          onChange={e => setTimerSeconds(Number(e.target.value))}
                          className="flex-1 accent-teal-500"
                          aria-label="Reading time in seconds"
                        />
                        <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300 w-10 text-right">{timerSeconds}s</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-32 shrink-0">Buzz-in time</span>
                        <input
                          type="range" min={5} max={60} step={5}
                          value={buzzTimerSeconds}
                          onChange={e => setBuzzTimerSeconds(Number(e.target.value))}
                          className="flex-1 accent-teal-500"
                          aria-label="Buzz-in answer time in seconds"
                        />
                        <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300 w-10 text-right">{buzzTimerSeconds}s</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Step 4: Team Setup */}
          {mode === 'team' && (
            <Card className="p-5">
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-black leading-none text-gray-200 dark:text-gray-700 select-none">4</span>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Team Setup</span>
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
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-teal-400',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: teamCount }, (_, i) => {
                  const color = teamColors[i] ?? DEFAULT_TEAM_COLORS[i] ?? 'blue'
                  return (
                    <div key={i} className={cn('rounded-xl border-2 px-3 pt-2 pb-3', TEAM_COLOR_INPUT[color])}>
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
                        className="w-full bg-transparent font-semibold text-sm outline-none placeholder:opacity-40 mb-2"
                        aria-label={`Team ${i + 1} name`}
                      />
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Team ${i + 1} colour`}>
                        {ALL_TEAM_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              const next = [...teamColors] as TeamColor[]
                              next[i] = c
                              setTeamColors(next)
                            }}
                            aria-label={c}
                            aria-pressed={color === c}
                            className="w-5 h-5 rounded-full transition-all shrink-0"
                            style={{
                              backgroundColor: SWATCH_HEX[c],
                              outline: color === c ? `3px solid ${SWATCH_HEX[c]}` : 'none',
                              outlineOffset: '2px',
                              opacity: color === c ? 1 : 0.55,
                              transform: color === c ? 'scale(1.2)' : 'scale(1)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Start */}
          <div className="flex justify-center pb-8">
            <Button
              variant="primary"
              size="lg"
              disabled={categoryId === null}
              onClick={handleStart}
              className="px-12"
            >
              {categoryId !== null ? '🚀 Launch Game' : 'Select a category to begin'}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
