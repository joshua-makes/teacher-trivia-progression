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
import { upsertCloudSet, deleteCloudSet, shareSet } from '@/lib/actions/sets'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  imageUrl: '',
}

type FormState = Omit<CustomQuestion, 'id'> & { id?: string }
type ErrorMap = Partial<Record<keyof FormState | 'incorrect0' | 'incorrect1' | 'incorrect2', string>>

export function QuestionsClient({ serverSets, isSignedIn }: { serverSets: QuestionSet[]; isSignedIn: boolean }) {
  const router = useRouter()

  // ── Sets state ────────────────────────────────────────
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [activeSetId, setActiveSetId] = useState<string | null>(null)
  const [view, setView] = useState<'sets' | 'questions'>('sets')

  // New-set form
  const [showNewSet, setShowNewSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [newSetEmoji, setNewSetEmoji] = useState('📝')
  const [newSetGrade, setNewSetGrade] = useState<'all' | 'K-2' | '3-5' | '6-8' | '9-12'>('all')
  const [newSetError, setNewSetError] = useState<string | null>(null)

  // Edit-set-meta panel
  const [showSetMeta, setShowSetMeta] = useState(false)
  const [metaName, setMetaName] = useState('')
  const [metaEmoji, setMetaEmoji] = useState('📝')
  const [metaGrade, setMetaGrade] = useState<'all' | 'K-2' | '3-5' | '6-8' | '9-12'>('all')

  // ── Question form state ───────────────────────────────
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<ErrorMap>({})
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const local = loadQuestionSets()
    let initial: QuestionSet[]

    if (serverSets.length > 0) {
      // Server pre-fetched cloud sets — merge with any local-only sets
      const serverById = new Map(serverSets.map(s => [s.id, s]))
      const localOnly = local.filter(s => !serverById.has(s.id))
      initial = [...serverSets, ...localOnly].sort((a, b) => b.createdAt - a.createdAt)
      // Push any offline-created sets to cloud silently
      localOnly.forEach(s => upsertCloudSet(s).catch(() => {}))
      saveQuestionSets(initial)
    } else {
      initial = local
    }

    setSets(initial)
    // Auto-open set from ?setId= param
    const paramSetId = new URLSearchParams(window.location.search).get('setId')
    if (paramSetId && initial.some(s => s.id === paramSetId)) {
      setActiveSetId(paramSetId)
      setView('questions')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persistence helpers ───────────────────────────────
  function persistSets(next: QuestionSet[], changedSet?: QuestionSet, deletedSetId?: string) {
    saveQuestionSets(next)
    setSets(next)
    if (isSignedIn) {
      if (changedSet) upsertCloudSet(changedSet).catch(() => {})
      if (deletedSetId) deleteCloudSet(deletedSetId).catch(() => {})
    }
  }

  function persistActiveQuestions(questions: CustomQuestion[]) {
    if (!activeSetId) return
    const updatedSet = sets.find(s => s.id === activeSetId)
    if (!updatedSet) return
    const next = { ...updatedSet, questions }
    persistSets(sets.map(s => s.id === activeSetId ? next : s), next)
  }

  // ── Set management ────────────────────────────────────
  function openSetMeta() {
    if (!activeSet) return
    setMetaName(activeSet.name)
    setMetaEmoji(activeSet.emoji)
    setMetaGrade((activeSet.gradeLevel ?? 'all') as 'all' | 'K-2' | '3-5' | '6-8' | '9-12')
    setShowSetMeta(true)
  }

  function handleUpdateSetMeta() {
    if (!activeSet || !metaName.trim()) return
    const updated: QuestionSet = {
      ...activeSet,
      name: metaName.trim(),
      emoji: metaEmoji,
      gradeLevel: metaGrade === 'all' ? undefined : metaGrade,
    }
    persistSets(sets.map(s => s.id === activeSet.id ? updated : s), updated)
    setShowSetMeta(false)
    toast.success('Set settings saved')
  }

  function handleCreateSet() {
    if (!newSetName.trim()) { setNewSetError('Give your set a name.'); return }
    const newSet: QuestionSet = {
      id: makeSetId(),
      name: newSetName.trim(),
      emoji: newSetEmoji,
      questions: [],
      createdAt: Date.now(),
      gradeLevel: newSetGrade === 'all' ? undefined : newSetGrade,
    }
    persistSets([...sets, newSet], newSet)
    setNewSetName('')
    setNewSetEmoji('📝')
    setNewSetGrade('all')
    setNewSetError(null)
    setShowNewSet(false)
    setActiveSetId(newSet.id)
    setView('questions')
    toast.success(`“${newSet.name}” created — add your questions below`)  }
  function handleDeleteSet(id: string) {
    const name = sets.find(s => s.id === id)?.name ?? 'Set'
    if (!confirm(`Delete “${name}” and all its questions?`)) return
    persistSets(sets.filter(s => s.id !== id), undefined, id)
    if (activeSetId === id) { setActiveSetId(null); setView('sets') }
    toast.success(`“${name}” deleted`)
  }

  async function handleShare(setId: string) {
    if (!isSignedIn) {
      toast.error('Sign in to generate a share link')
      return
    }
    const toastId = toast.loading('Generating share link…')
    const token = await shareSet(setId)
    if (!token) { toast.error('Could not generate share link', { id: toastId }); return }
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard!', { id: toastId })
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
    const url = (form.imageUrl ?? '').trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      e.imageUrl = 'Image URL must start with http://, https://, or be a data:image/ URI.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate() || !activeSet) return

    // Duplicate check (new questions only — edits are exempt)
    if (!editingId) {
      const isDuplicate = activeSet.questions.some(
        q =>
          q.question.trim().toLowerCase() === form.question.trim().toLowerCase() &&
          q.correct.trim().toLowerCase() === form.correct.trim().toLowerCase(),
      )
      if (isDuplicate) {
        setErrors(e => ({ ...e, question: 'A question with the same text and correct answer already exists in this set.' }))
        return
      }
    }

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
    toast.success(editingId ? 'Question updated' : 'Question added')
  }

  function handleEdit(q: CustomQuestion) {
    setForm({ question: q.question, correct: q.correct, incorrect: [...q.incorrect], difficulty: q.difficulty ?? 'medium', imageUrl: q.imageUrl ?? '' })
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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Cloud-synced sets can store large images in the DB.
    // Local-only sets are capped at 512 KB to stay within localStorage limits.
    const maxBytes = isSignedIn ? 5 * 1024 * 1024 : 512 * 1024
    const limitLabel = isSignedIn ? '5 MB' : '512 KB'
    if (file.size > maxBytes) {
      setErrors(err => ({ ...err, imageUrl: `Image must be under ${limitLabel}.${isSignedIn ? '' : ' Sign in to upload larger images.'}` }))
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm(f => ({ ...f, imageUrl: reader.result as string }))
      setErrors(err => ({ ...err, imageUrl: undefined }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleImport() {
    if (!activeSet) return
    const result = parseCustomQuestionsJSON(importJson)
    if ('error' in result) { toast.error(result.error); setImportError(result.error); return }
    const count = result.questions.length
    persistActiveQuestions([...activeSet.questions, ...result.questions])
    setImportJson('')
    setImportError(null)
    setShowImport(false)
    toast.success(`${count} question${count !== 1 ? 's' : ''} imported`)
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
                {sets.length} set{sets.length !== 1 ? 's' : ''} ·{' '}
                {isSignedIn ? '☁️ Cloud sync on' : 'Saved to this browser · Sign in to sync'}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => { setShowNewSet(p => !p); setNewSetName(''); setNewSetGrade('all'); setNewSetError(null) }}>
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
                    'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500',
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
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 scale-110'
                          : 'border-gray-200 dark:border-gray-700 hover:border-teal-300',
                      )}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Grade Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'K-2', '3-5', '6-8', '9-12'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNewSetGrade(g)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all',
                        newSetGrade === g
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-300',
                      )}
                    >
                      {g === 'all' ? 'All grades' : `Grade ${g}`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  {newSetGrade === 'all' ? 'Visible for every grade level.' : `Only shown when Grade ${newSetGrade} is selected on the home page.`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleCreateSet}>Create &amp; Add Questions</Button>
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
                        {set.gradeLevel && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                            {set.gradeLevel}
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button
                          onClick={() => openSet(set.id)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => router.push(`/play?setId=${set.id}`)}
                          disabled={set.questions.length === 0}
                          className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          🚀 Play
                        </button>
                        {isSignedIn && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleShare(set.id)}
                              disabled={set.questions.length === 0}
                              title="Generate a public link — anyone with it can add this set to their own collection"
                              className="text-xs px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              🔗 Share
                            </button>
                          </div>
                        )}
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
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium shrink-0"
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
            {activeSet && (
              <Button variant="secondary" size="sm" onClick={() => showSetMeta ? setShowSetMeta(false) : openSetMeta()}>
                ⚙ Settings
              </Button>
            )}
            {activeSet && activeSet.questions.length > 0 && (
              <>
                <Button variant="secondary" size="sm" onClick={() => exportCustomQuestionsAsFile(activeSet.questions)}>
                  ⬇ Export
                </Button>
                <Button variant="primary" size="sm" onClick={() => router.push(`/play?setId=${activeSet.id}`)}>
                  🚀 Play
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Set settings panel */}
        {showSetMeta && activeSet && (
          <Card className="p-5 border-teal-200 dark:border-teal-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Set Settings</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={metaName}
                onChange={e => setMetaName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {['📝','🧠','🔬','📐','🌍','📚','🎭','🏆','⭐','🎯','🔢','🌱'].map(e => (
                  <button key={e} type="button" onClick={() => setMetaEmoji(e)}
                    className={cn('w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all',
                      metaEmoji === e ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 scale-110' : 'border-gray-200 dark:border-gray-700 hover:border-teal-300',
                    )}>{e}</button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grade Level</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'K-2', '3-5', '6-8', '9-12'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setMetaGrade(g)}
                    className={cn('px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all',
                      metaGrade === g
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-300',
                    )}>
                    {g === 'all' ? 'All grades' : `Grade ${g}`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                {metaGrade === 'all' ? 'Visible for every grade level.' : `Only shown when Grade ${metaGrade} is selected on the home page.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleUpdateSetMeta}>Save</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSetMeta(false)}>Cancel</Button>
            </div>
          </Card>
        )}

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
                  'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500',
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
                      'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500',
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

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                🖼 Image <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={form.imageUrl ?? ''}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.png or leave blank"
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500',
                    errors.imageUrl ? 'border-red-400' : 'border-gray-300 dark:border-gray-700',
                  )}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                >
                  Upload
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                {isSignedIn
                  ? 'Cloud-synced — images up to 5 MB stored in the database.'
                  : 'Local only — use a URL or upload under 512 KB. Sign in to store larger images.'}
              </p>
              {errors.imageUrl && <p className="text-xs text-red-500 mb-1">{errors.imageUrl}</p>}
              {form.imageUrl && !errors.imageUrl && (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-24 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none hover:bg-red-600"
                    aria-label="Remove image"
                  >×</button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSubmit}>
                {editingId ? 'Save Changes' : '+ Add Question'}
              </Button>
              {editingId && (
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>Cancel</Button>
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
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline shrink-0 ml-4"
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
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g. The Solar System, World War II…"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
                  <select
                    value={aiGrade}
                    onChange={e => setAiGrade(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                <pre className="w-full rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-3 py-3 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
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
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
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
                (3 strings). Optional: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">difficulty</code>,{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">imageUrl</code>.
              </p>
              <textarea
                value={importJson}
                onChange={e => { setImportJson(e.target.value); setImportError(null) }}
                rows={6}
                spellCheck={false}
                placeholder={`[\n  {\n    "question": "What is 2 + 2?",\n    "correct": "4",\n    "incorrect": ["3", "5", "6"],\n    "difficulty": "easy"\n  }\n]`}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className={cn('p-4 transition-all', editingId === q.id && 'ring-2 ring-teal-400')}
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
                    {q.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.imageUrl} alt="" className="h-12 object-contain rounded mb-1.5 bg-gray-100 dark:bg-gray-800" />
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {q.correct}</span>
                      {q.incorrect.map((a, i) => (
                        <span key={i} className="text-gray-400 dark:text-gray-500">✗ {a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleEdit(q)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors font-medium">
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
            <Button variant="primary" size="lg" onClick={() => router.push(`/play?setId=${activeSet.id}`)} className="px-10">
              🚀 Play This Set
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}