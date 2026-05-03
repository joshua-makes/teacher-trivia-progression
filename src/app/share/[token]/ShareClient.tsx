'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { loadQuestionSets, saveQuestionSets, makeSetId } from '@/lib/customQuestions'
import type { SharedSetPreview } from '@/lib/actions/sets'
import { toast } from 'sonner'

export function ShareClient({ preview }: { preview: SharedSetPreview }) {
  const router = useRouter()
  const [imported, setImported] = useState(false)

  function handleImport() {
    const sets = loadQuestionSets()
    const duplicate = sets.some(
      s => s.name === preview.name && s.questions.length === preview.questionCount
    )
    if (duplicate) { toast.info('You already have this set'); return }
    const newSet = {
      id: makeSetId(),
      name: preview.name,
      emoji: preview.emoji,
      questions: preview.questions,
      createdAt: Date.now(),
    }
    saveQuestionSets([newSet, ...sets])
    setImported(true)
    toast.success(`"${preview.name}" added to your sets`)
  }

  if (imported) {
    return (
      <Container>
        <div className="max-w-lg mx-auto py-20 text-center space-y-4">
          <p className="text-5xl">🎉</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Set added!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            <span className="font-semibold">{preview.emoji} {preview.name}</span> is now in your question sets.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={() => router.push('/questions')}>View my sets</Button>
            <Button variant="secondary" onClick={() => router.push('/')}>Play now</Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="max-w-lg mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-6xl">{preview.emoji}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{preview.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {preview.questionCount} question{preview.questionCount !== 1 ? 's' : ''} · shared by a teacher
          </p>
        </div>

        {/* Question preview */}
        <Card className="p-5 space-y-4 max-h-[32rem] overflow-y-auto">
          {preview.questions.slice(0, 8).map((q, i) => (
            <div key={q.id} className="text-sm space-y-1.5">
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                <span className="text-gray-400 dark:text-gray-500 mr-1.5">{i + 1}.</span>
                {q.question}
              </p>
              <ul className="ml-5 space-y-0.5">
                <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="text-[10px] font-bold uppercase tracking-wide shrink-0">✓</span>
                  {q.correct}
                </li>
                {q.incorrect.map((ans, j) => (
                  <li key={j} className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                    <span className="text-[10px] shrink-0">✗</span>
                    {ans}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {preview.questionCount > 8 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
              +{preview.questionCount - 8} more questions…
            </p>
          )}
        </Card>

        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={handleImport}>
            ＋ Add to my sets
          </Button>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Maybe later
          </Button>
        </div>
      </div>
    </Container>
  )
}
