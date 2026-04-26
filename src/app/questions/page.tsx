'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  loadQuestionSets,
  saveQuestionSets,
  makeSetId,
  makeId,
  parseCustomQuestionsJSON,
  exportCustomQuestionsAsFile,
  type QuestionSet,
  type CustomQuestion,
} from '@/lib/customQuestions'
import { cn } from '@/lib/utils'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFF_COLORS: Record<Difficulty, string> = {
  easy:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  hard:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
}

const SET_EMOJIS = ['📝', '🧪', '📚', '🎯', '🔬', '🌍', '🔢', '🏆', '🎭', '⚡', '🌊', '🦋']

const EMPTY_FORM: Omit<CustomQuestion, 'id'> = {
  question: '',
  correct: '',
  incorrect: ['', '', ''],
  difficulty: 'medium',
}

type FormState = Omit<CustomQuestion, 'id'> & { id?: string }
type ErrorMap = Partial<Record<keyof FormState | 'incorrect0' | 'incorrect1' | 'incorrect2', string>>

export default function QuestionsPage() {
  const router = useRouter()

  // ── Sets state ────────────────────────────────────────
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [activeSetId, setActiveSetId] = useState<string | null>(null)
  const [view, setView] = useState<'sets' | 'questions'>('sets')

  // New-set form
  const [showNewSet, setShowNewSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [newSetEmoji, setNewSetEmoji] = useState('📝')
  const [newSetError, setNewSetError] = useState<string | null>(null)

  // ── Question form state ───────────────────────────────
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<ErrorMap>({})
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [saved, setSaved] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // AI prompt builder
  const [showAiPrompt, setShowAiPrompt] = useState(false)
  const [aiSubject, setAiSubject] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiGrade, setAiGrade] = useState('3–5')
  const [aiCount, setAiCount] = useState(10)
  const [aiDifficulty, setAiDifficulty] = useState<'mixed' | 'easy' | 'medium' | 'hard'>('mixed')
  const [aiCopied, setAiCopied] = useState(false)

  const activeSet = sets.find(s => s.id === activeSetId) ?? null

  useEffect(() => {
    const loaded = loadQuestionSets()
    setSets(loaded)
    // Auto-open set from ?setId= param
    const paramSetId = new URLSearchParams(window.location.search).get('setId')
    if (paramSetId && loaded.some(s => s.id === paramSetId)) {
      setActiveSetId(paramSetId)
      setView('questions')
    }
  }, [])

  // ── Persistence helpers ───────────────────────────────
  function persistSets(next: QuestionSet[]) {
    saveQuestionSets(next)
    setSets(next)
  }

  function persistActiveQuestions(questions: CustomQuestion[]) {
    if (!activeSetId) return
    persistSets(sets.map(s => s.id === activeSetId ? { ...s, questions } : s))
  }

  // ── Set management ────────────────────────────────────
  function handleCreateSet() {
    if (!newSetName.trim()) { setNewSetError('Give your set a name.'); return }
    const newSet: QuestionSet = {
      id: makeSetId(),
      name: newSetName.trim(),
      emoji: newSetEmoji,
      questions: [],
      createdAt: Date.now(),
    }
    persistSets([...sets, newSet])
    setNewSetName('')
    setNewSetEmoji('📝')
    setNewSetError(null)
    setShowNewSet(false)
    setActiveSetId(newSet.id)
    setView('questions')
  }

  function handleDeleteSet(id: string) {
    if (!confirm('Delete this set and all its questions?')) return
    persistSets(sets.filter(s => s.id !== id))
    if (activeSetId === id) { setActiveSetId(null); setView('sets') }
  }

  function openSet(id: string) {
    setActiveSetId(id)
    setView('questions')
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setErrors({})
  }

  // ── Question validation ───────────────────────────────
  function validate(): boolean {
    const e: ErrorMap = {}
    if (!form.question.trim()) e.question = 'Question text is required.'
    if (!form.correct.trim()) e.correct = 'Correct answer is required.'
    form.incorrect.forEach((v, i) => {
      if (!v.trim()) e[`incorrect${i}` as 'incorrect0'] = 'Required.'
    })
    const allAnswers = [form.correct, ...form.incorrect].map(a => a.trim().toLowerCase())
    if (new Set(allAnswers).size < allAnswers.filter(Boolean).length) {
      e.correct = 'All four answers must be different.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate() || !activeSet) return
    let nextQs: CustomQuestion[]
    if (editingId) {
      nextQs = activeSet.questions.map(q =>
        q.id === editingId
          ? { ...form, id: editingId, incorrect: form.incorrect as [string, string, string] }
          : q,
      )
      setEditingId(null)
    } else {
      nextQs = [...activeSet.questions, { ...form, id: makeId(), incorrect: form.incorrect as [string, string, string] }]
    }
    persistActiveQuestions(nextQs)
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleEdit(q: CustomQuestion) {
    setForm({ question: q.question, correct: q.correct, incorrect: [...q.incorrect], difficulty: q.difficulty ?? 'medium' })
    setEditingId(q.id)
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleDelete(id: string) {
    if (!activeSet) return
    persistActiveQuestions(activeSet.questions.filter(q => q.id !== id))
    if (editingId === id) { setEditingId(null); setForm({ ...EMPTY_FORM }) }
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setErrors({})
  }

  function handleImport() {
    if (!activeSet) return
    const result = parseCustomQuestionsJSON(importJson)
    if ('error' in result) { setImportError(result.error); return }
    persistActiveQuestions([...activeSet.questions, ...result.questions])
    setImportJson('')
    setImportError(null)
    setShowImport(false)
  }

  function handleMoveUp(idx: number) {
    if (!activeSet || idx === 0) return
    const qs = [...activeSet.questions]
    ;[qs[idx - 1], qs[idx]] = [qs[idx], qs[idx - 1]]
    persistActiveQuestions(qs)
  }

  function handleMoveDown(idx: number) {
    if (!activeSet || idx === activeSet.questions.length - 1) return
    const qs = [...activeSet.questions]
    ;[qs[idx], qs[idx + 1]] = [qs[idx + 1], qs[idx]]
    persistActiveQuestions(qs)
  }

  function buildAiPrompt(): string {
    const subjectPart = aiSubject.trim() ? ` in ${aiSubject.trim()}` : ''
    const topicPart = aiTopic.trim() ? ` about "${aiTopic.trim()}"` : ''
    const diffPart =
      aiDifficulty === 'mixed'
        ? 'a mix of easy, medium, and hard'
        : `all "${aiDifficulty}"`
    return `Generate ${aiCount} trivia questions${topicPart}${subjectPart} suitable for Grade ${aiGrade} students. Make the difficulty ${diffPart}.

Return ONLY a JSON array — no explanation, no markdown code fences, just raw JSON. Each object must have exactly these 4 keys:

[
  {
    "question": "Question text here?",
    "correct": "The correct answer",
    "incorrect": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"],
    "difficulty": "easy"
  }
]

Rules:
- "difficulty" must be one of: "easy", "medium", or "hard"
- "incorrect" must be an array of exactly 3 strings
- Questions must be age-appropriate for Grade ${aiGrade} students
- Incorrect answers should be plausible but clearly wrong
- Return ONLY the JSON array, nothing else`
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(buildAiPrompt()).then(() => {
      setAiCopied(true)
      setTimeout(() => setAiCopied(false), 2500)
    })
  }

  // ══════════════════════════════════════════════════════
  // VIEW: Sets overview
  // ══════════════════════════════════════════════════════
  if (view === 'sets') {
    return (
      <Container>
        <div className="max-w-3xl mx-auto space-y-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Question Sets</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {sets.length} set{sets.length !== 1 ? 's' : ''} · saved to this browser
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => { setShowNewSet(p => !p); setNewSetName(''); setNewSetError(null) }}>
              + New Set
            </Button>
          </div>

          {/* New-set form */}
          {showNewSet && (
            <Card className="p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Create a New Set</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSetName}
                  autoFocus
                  onChange={e => { setNewSetName(e.target.value); setNewSetError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleCreateSet()}
                  placeholder="e.g. Chapter 5 Review, Geometry Basics…"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    newSetError ? 'border-red-400' : 'border-gray-300 dark:border-gray-700',
                  )}
                />
                {newSetError && <p className="text-xs text-red-500 mt-1">{newSetError}</p>}
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {SET_EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNewSetEmoji(e)}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all',
                        newSetEmoji === e
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 scale-110'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300',
                      )}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleCreateSet}>Create & Add Questions</Button>
                <Button variant="secondary" size="sm" onClick={() => setShowNewSet(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {/* Set list */}
          {sets.length === 0 && !showNewSet ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📂</div>
              <p className="font-medium text-gray-600 dark:text-gray-400">No question sets yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                Create a set to organize your custom questions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sets.map(set => (
                <Card key={set.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0">{set.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">{set.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {set.questions.length} question{set.questions.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => openSet(set.id)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => router.push(`/?setId=${set.id}`)}
                          disabled={set.questions.length === 0}
                          className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          🚀 Play
                        </button>
                        <button
                          onClick={() => handleDeleteSet(set.id)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    )
  }

  // ══════════════════════════════════════════════════════
  // VIEW: Question editor for active set
  // ══════════════════════════════════════════════════════
  return (
    <Container>
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        {/* Breadcrumb header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => { setView('sets'); setActiveSetId(null) }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium shrink-0"
            >
              ← Sets
            </button>
            {activeSet && (
              <>
                <span className="text-gray-300 dark:text-gray-700 shrink-0">/</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {activeSet.emoji} {activeSet.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">
                  ({activeSet.questions.length})
                </span>
              </>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {activeSet && activeSet.questions.length > 0 && (
              <>
                <Button variant="secondary" size="sm" onClick={() => exportCustomQuestionsAsFile(activeSet.questions)}>
                  ⬇ Export
                </Button>
                <Button variant="primary" size="sm" onClick={() => router.push(`/?setId=${activeSet.id}`)}>
                  🚀 Play
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Add / Edit form */}
        <div ref={formRef}>
          <Card className="p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingId ? '✏️ Edit Question' : '➕ Add Question'}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                rows={2}
                placeholder="e.g. What is the capital of France?"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  errors.question ? 'border-red-400' : 'border-gray-300 dark:border-gray-700',
                )}
              />
              {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                ✓ Correct Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.correct}
                onChange={e => setForm(f => ({ ...f, correct: e.target.value }))}
                placeholder="e.g. Paris"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.correct ? 'border-red-400' : 'border-emerald-300 dark:border-emerald-800',
                )}
              />
              {errors.correct && <p className="text-xs text-red-500 mt-1">{errors.correct}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ✗ Wrong Answers (3) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {([0, 1, 2] as const).map(i => (
                  <input
                    key={i}
                    type="text"
                    value={form.incorrect[i]}
                    onChange={e => {
                      const next = [...form.incorrect] as [string, string, string]
                      next[i] = e.target.value
                      setForm(f => ({ ...f, incorrect: next }))
                    }}
                    placeholder={`Wrong answer ${i + 1}`}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      errors[`incorrect${i}` as 'incorrect0'] ? 'border-red-400' : 'border-gray-300 dark:border-gray-700',
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                    className={cn(
                      'px-4 py-1.5 rounded-lg border-2 text-sm font-semibold capitalize transition-all',
                      form.difficulty === d
                        ? DIFF_COLORS[d]
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400',
                    )}
                  >{d}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSubmit}>
                {editingId ? 'Save Changes' : '+ Add Question'}
              </Button>
              {editingId && (
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>Cancel</Button>
              )}
              {saved && (
                <span className="self-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Saved!</span>
              )}
            </div>
          </Card>
        </div>

        {/* AI Prompt Builder */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">✨ Generate with AI</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Build a prompt, paste it into ChatGPT / Claude / Gemini, then import the result below.</p>
            </div>
            <button
              onClick={() => setShowAiPrompt(p => !p)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-4"
            >
              {showAiPrompt ? '▾ Collapse' : '▸ Expand'}
            </button>
          </div>

          {showAiPrompt && (
            <div className="mt-4 space-y-4">
              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={aiSubject}
                    onChange={e => setAiSubject(e.target.value)}
                    placeholder="e.g. Science, History, Maths…"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g. The Solar System, World War II…"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
                  <select
                    value={aiGrade}
                    onChange={e => setAiGrade(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="K–2">K–2</option>
                    <option value="3–5">3–5</option>
                    <option value="6–8">6–8</option>
                    <option value="9–12">9–12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">No. of Questions</label>
                  <select
                    value={aiCount}
                    onChange={e => setAiCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[5, 10, 15, 20, 25, 30].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={e => setAiDifficulty(e.target.value as typeof aiDifficulty)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Generated prompt preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Your prompt</label>
                <pre className="w-full rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-3 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                  {buildAiPrompt()}
                </pre>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleCopyPrompt}>
                  {aiCopied ? '✓ Copied!' : '📋 Copy Prompt'}
                </Button>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Paste into ChatGPT, Claude, Gemini, etc. — then import the JSON below.
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Import JSON */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Import from JSON</h2>
            <button
              onClick={() => setShowImport(p => !p)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showImport ? '▾ Collapse' : '▸ Expand'}
            </button>
          </div>
          {showImport && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste a JSON array. Each item needs{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">question</code>,{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">correct</code>, and{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">incorrect</code>{' '}
                (3 strings). Optional: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">difficulty</code>.
              </p>
              <textarea
                value={importJson}
                onChange={e => { setImportJson(e.target.value); setImportError(null) }}
                rows={6}
                spellCheck={false}
                placeholder={`[\n  {\n    "question": "What is 2 + 2?",\n    "correct": "4",\n    "incorrect": ["3", "5", "6"],\n    "difficulty": "easy"\n  }\n]`}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {importError && <p className="text-xs text-red-500 font-medium">{importError}</p>}
              <Button size="sm" variant="primary" onClick={handleImport}>
                Import into &ldquo;{activeSet?.name}&rdquo;
              </Button>
            </div>
          )}
        </Card>

        {/* Question list */}
        {!activeSet || activeSet.questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600">
            <div className="text-5xl mb-3">📝</div>
            <p className="font-medium">No questions yet.</p>
            <p className="text-sm mt-1">Add your first question above or import a JSON file.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
              Questions ({activeSet.questions.length})
            </h2>
            {activeSet.questions.map((q, idx) => (
              <Card
                key={q.id}
                className={cn('p-4 transition-all', editingId === q.id && 'ring-2 ring-indigo-400')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                    <button onClick={() => handleMoveUp(idx)} disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs" aria-label="Move up">▲</button>
                    <button onClick={() => handleMoveDown(idx)} disabled={idx === activeSet.questions.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs" aria-label="Move down">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums font-mono">#{idx + 1}</span>
                      {q.difficulty && (
                        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', DIFF_COLORS[q.difficulty as Difficulty])}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-1.5">{q.question}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {q.correct}</span>
                      {q.incorrect.map((a, i) => (
                        <span key={i} className="text-gray-400 dark:text-gray-500">✗ {a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleEdit(q)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(q.id)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeSet && activeSet.questions.length > 0 && (
          <div className="flex justify-center pb-6">
            <Button variant="primary" size="lg" onClick={() => router.push(`/?setId=${activeSet.id}`)} className="px-10">
              🚀 Play This Set
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}