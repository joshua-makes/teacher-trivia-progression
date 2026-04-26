'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  loadCustomQuestions,
  saveCustomQuestions,
  parseCustomQuestionsJSON,
  exportCustomQuestionsAsFile,
  makeId,
  type CustomQuestion,
} from '@/lib/customQuestions'
import { cn } from '@/lib/utils'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFF_COLORS: Record<Difficulty, string> = {
  easy:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  hard:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
}

const EMPTY_FORM: Omit<CustomQuestion, 'id'> = {
  question: '',
  correct: '',
  incorrect: ['', '', ''],
  difficulty: 'medium',
}

type FormState = Omit<CustomQuestion, 'id'> & { id?: string }

export default function QuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'incorrect0' | 'incorrect1' | 'incorrect2', string>>>({})
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [saved, setSaved] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setQuestions(loadCustomQuestions() ?? [])
  }, [])

  function persist(qs: CustomQuestion[]) {
    saveCustomQuestions(qs)
    setQuestions(qs)
  }

  // ── Form validation ───────────────────────────────────
  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.question.trim()) e.question = 'Question text is required.'
    if (!form.correct.trim()) e.correct = 'Correct answer is required.'
    form.incorrect.forEach((v, i) => {
      if (!v.trim()) e[`incorrect${i}` as 'incorrect0'] = 'Required.'
    })
    // Duplicate answer check
    const allAnswers = [form.correct, ...form.incorrect].map(a => a.trim().toLowerCase())
    if (new Set(allAnswers).size < allAnswers.filter(Boolean).length) {
      e.correct = 'All four answers must be different.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit (add or update) ────────────────────────────
  function handleSubmit() {
    if (!validate()) return
    if (editingId) {
      persist(questions.map(q =>
        q.id === editingId
          ? { ...form, id: editingId, incorrect: form.incorrect as [string, string, string] }
          : q,
      ))
      setEditingId(null)
    } else {
      persist([
        ...questions,
        { ...form, id: makeId(), incorrect: form.incorrect as [string, string, string] },
      ])
    }
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
    persist(questions.filter(q => q.id !== id))
    if (editingId === id) { setEditingId(null); setForm({ ...EMPTY_FORM }) }
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setErrors({})
  }

  function handleImport() {
    const result = parseCustomQuestionsJSON(importJson)
    if ('error' in result) { setImportError(result.error); return }
    persist([...questions, ...result.questions])
    setImportJson('')
    setImportError(null)
    setShowImport(false)
  }

  function handleMoveUp(idx: number) {
    if (idx === 0) return
    const qs = [...questions]
    ;[qs[idx - 1], qs[idx]] = [qs[idx], qs[idx - 1]]
    persist(qs)
  }
  function handleMoveDown(idx: number) {
    if (idx === questions.length - 1) return
    const qs = [...questions]
    ;[qs[idx], qs[idx + 1]] = [qs[idx + 1], qs[idx]]
    persist(qs)
  }

  return (
    <Container>
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Question Bank</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {questions.length} custom question{questions.length !== 1 ? 's' : ''} · saved to this browser
            </p>
          </div>
          <div className="flex items-center gap-2">
            {questions.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportCustomQuestionsAsFile(questions)}
                >
                  ⬇ Export JSON
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/')}
                >
                  🚀 Play These
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

          {/* Question text */}
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

          {/* Correct answer */}
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

          {/* Incorrect answers */}
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

          {/* Difficulty */}
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
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              {editingId ? 'Save Changes' : '+ Add Question'}
            </Button>
            {editingId && (
              <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
            {saved && (
              <span className="self-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Saved!</span>
            )}
          </div>
        </Card>
        </div>

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
                Import
              </Button>
            </div>
          )}
        </Card>

        {/* Question list */}
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-600">
            <div className="text-5xl mb-3">📝</div>
            <p className="font-medium">No questions yet.</p>
            <p className="text-sm mt-1">Add your first question above or import a JSON file.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
              Your Questions ({questions.length})
            </h2>
            {questions.map((q, idx) => (
              <Card
                key={q.id}
                className={cn(
                  'p-4 transition-all',
                  editingId === q.id && 'ring-2 ring-indigo-400',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs"
                      aria-label="Move up"
                    >▲</button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === questions.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none text-xs"
                      aria-label="Move down"
                    >▼</button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums font-mono">
                        #{idx + 1}
                      </span>
                      {q.difficulty && (
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          DIFF_COLORS[q.difficulty as Difficulty],
                        )}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-1.5">
                      {q.question}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {q.correct}</span>
                      {q.incorrect.map((a, i) => (
                        <span key={i} className="text-gray-400 dark:text-gray-500">✗ {a}</span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEdit(q)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Play / back actions */}
        {questions.length > 0 && (
          <div className="flex gap-3 justify-center pb-6">
            <Button variant="primary" size="lg" onClick={() => router.push('/')} className="px-10">
              🚀 Play These Questions
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}
