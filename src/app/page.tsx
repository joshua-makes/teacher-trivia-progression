'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CATEGORIES } from '@/lib/data/categories'
import { QUESTIONS } from '@/lib/data/questions'
import { GRADE_LEVELS, getTimerSeconds, type GradeLevel } from '@/lib/ladder'
import { clearSession, createSession, loadSession, saveSession, type QuizSession, type Team } from '@/lib/session'
import { loadCustomQuestions, saveCustomQuestions, clearCustomQuestions, parseCustomQuestionsJSON } from '@/lib/customQuestions'
import { cn } from '@/lib/utils'
import { Emoji } from '@/components/ui/Emoji'

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

export default function HomePage() {
  const router = useRouter()
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('3-5')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [mode, setMode] = useState<'solo' | 'team'>('solo')
  const [teamCount, setTeamCount] = useState(2)
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2', 'Team 3', 'Team 4'])
  const [questionCount, setQuestionCount] = useState(15)
  const [showPreview, setShowPreview] = useState(false)
  const [resumableSession, setResumableSession] = useState<QuizSession | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(() => getTimerSeconds('3-5'))
  const [buzzTimerSeconds, setBuzzTimerSeconds] = useState(() => getTimerSeconds('3-5'))
  const [teamColors, setTeamColors] = useState<TeamColor[]>([...DEFAULT_TEAM_COLORS])
  // Custom questions
  const [customQCount, setCustomQCount] = useState(0)
  const [showCustomImport, setShowCustomImport] = useState(false)
  const [customJson, setCustomJson] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  // Reset timer defaults whenever grade level changes
  useEffect(() => {
    const def = getTimerSeconds(gradeLevel)
    setTimerSeconds(def)
    setBuzzTimerSeconds(def)
  }, [gradeLevel])

  useEffect(() => {
    const sess = loadSession()
    if (sess && !sess.completed) {
      setResumableSession(sess)
    }
    // Restore any saved custom questions count
    const customs = loadCustomQuestions()
    if (customs && customs.length > 0) setCustomQCount(customs.length)
  }, [])

  const filteredCategories = CATEGORIES.filter(c => c.gradeLevels.includes(gradeLevel))

  function handleStart() {
    if (categoryId === null) return
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
            <div className="mb-6 rounded-2xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Resume your game?</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
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

        {/* Hero */}
        <div className="rounded-3xl bg-gray-900 dark:bg-gray-900 border border-gray-800 dark:border-gray-700 text-center py-16 px-8 mb-10 shadow-xl relative">
          {/* Glow orb — centered behind the emoji */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl" />
          </div>
          <div className="relative">
            <Image
              src="/ladderquiz-logo.png"
              alt="Ladder Quiz"
              width={240}
              height={240}
              className="mx-auto mb-5 drop-shadow-2xl"
              priority
            />
          </div>

          <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed relative">
            Classroom trivia for K–12. Climb the ladder as questions get harder.
          </p>
        </div>

        <div className="space-y-5">
          {/* Step 1: Grade Level */}
          <Card className="p-5">
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
          <Card className="p-5">
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

            {/* Custom Questions import */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (customQCount > 0) {
                        setCategoryId(0)
                        setShowCustomImport(false)
                      } else {
                        setShowCustomImport(p => !p)
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all',
                      categoryId === 0
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    ✏️ Custom Questions
                    {customQCount > 0 && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                        {customQCount}
                      </span>
                    )}
                    {categoryId === 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">✓</span>
                    )}
                  </button>
                  {customQCount > 0 && (
                    <button
                      onClick={() => {
                        clearCustomQuestions()
                        setCustomQCount(0)
                        if (categoryId === 0) setCategoryId(null)
                      }}
                      className="text-xs text-red-400 hover:text-red-500 transition-colors"
                    >
                      × Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCustomImport(p => !p)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showCustomImport ? '▾ Hide' : '▸ Import JSON'}
                </button>
              </div>

              {showCustomImport && (
                <div className="space-y-2.5 mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Paste a JSON array. Each item needs{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">question</code>,{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">correct</code>, and{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">incorrect</code>{' '}
                    (array of 3 strings). Optional:{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">difficulty</code>{' '}
                    (easy / medium / hard).
                  </p>
                  <textarea
                    value={customJson}
                    onChange={e => { setCustomJson(e.target.value); setCustomError(null) }}
                    rows={6}
                    spellCheck={false}
                    placeholder={`[\n  {\n    "question": "What is 2 + 2?",\n    "correct": "4",\n    "incorrect": ["3", "5", "6"],\n    "difficulty": "easy"\n  }\n]`}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {customError && (
                    <p className="text-xs text-red-500 dark:text-red-400 font-medium">{customError}</p>
                  )}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const result = parseCustomQuestionsJSON(customJson)
                      if ('error' in result) { setCustomError(result.error); return }
                      saveCustomQuestions(result.questions)
                      setCustomQCount(result.questions.length)
                      setCategoryId(0)
                      setShowCustomImport(false)
                      setCustomJson('')
                      setCustomError(null)
                    }}
                  >
                    Load {customJson.trim() ? `(${(() => { try { const a = JSON.parse(customJson); return Array.isArray(a) ? `${a.length} questions` : '…' } catch { return '…' } })()})` : 'Questions'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Step 3: Game Mode */}
          <Card className="p-5">
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

            {/* Timer sliders */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Timers</p>
              {mode === 'solo' ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-32 shrink-0">Answer time</span>
                  <input
                    type="range" min={5} max={60} step={5}
                    value={timerSeconds}
                    onChange={e => setTimerSeconds(Number(e.target.value))}
                    className="flex-1 accent-indigo-500"
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
                      className="flex-1 accent-indigo-500"
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
                      className="flex-1 accent-indigo-500"
                      aria-label="Buzz-in answer time in seconds"
                    />
                    <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300 w-10 text-right">{buzzTimerSeconds}s</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Step 4: Team Setup */}
          {mode === 'team' && (
            <Card className="p-5">
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

