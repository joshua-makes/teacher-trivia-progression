'use client'

import { useEffect, useState } from 'react'
import { loadLiveQuestion, type LiveQuestion } from '@/lib/session'
import { cn } from '@/lib/utils'

const DIFF_COLOR: Record<string, string> = {
  easy:   'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700',
  medium: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-700',
  hard:   'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border-red-400 dark:border-red-700',
}

export default function TeacherPage() {
  const [live, setLive] = useState<LiveQuestion | null>(null)
  const [prevKey, setPrevKey] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)

  // Poll localStorage every 600 ms
  useEffect(() => {
    function poll() {
      const q = loadLiveQuestion()
      if (!q) { setLive(null); return }
      const key = `${q.questionNumber}-${q.questionText}`
      setLive(q)
      if (key !== prevKey) {
        setPrevKey(key)
        setFlash(true)
        setTimeout(() => setFlash(false), 700)
      }
    }
    poll()
    const id = setInterval(poll, 600)
    return () => clearInterval(id)
  })

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-widest border border-amber-400 dark:border-amber-700">
            👨‍🏫 Teacher View
          </span>
          <span className="text-xs text-gray-500">Auto-updates as questions change</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">
          Keep this window on <strong className="text-gray-700 dark:text-gray-400">your screen</strong> — not the projector
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!live ? (
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">⏳</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Waiting for a game to start…</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm">
              Start a quiz on the main window. This page will update automatically.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'w-full max-w-2xl transition-all duration-300',
              flash && 'scale-[1.01]',
            )}
          >
            {/* Meta row */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {live.categoryName}
                <span className="mx-2 text-gray-300 dark:text-gray-700">·</span>
                Question <span className="text-gray-900 dark:text-white font-bold">{live.questionNumber}</span>{' '}
                <span className="text-gray-400 dark:text-gray-600">/ {live.totalQuestions}</span>
              </span>
              <span className={cn(
                'text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border',
                DIFF_COLOR[live.difficulty] ?? 'bg-gray-800 text-gray-400 border-gray-700',
              )}>
                {live.difficulty}
              </span>
            </div>

            {/* Question */}
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-snug text-center">
              {live.questionText}
            </p>

            {/* Answers */}
            <div className="space-y-3">
              {live.answers.map((a, i) => {
                const isCorrect = a === live.correctAnswer
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl border-2 px-6 py-4 text-base font-semibold',
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-500',
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0',
                      isCorrect
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
                    )}>
                      {isCorrect ? '✓' : String.fromCharCode(65 + i)}
                    </span>
                    {a}
                    {isCorrect && (
                      <span className="ml-auto text-xs text-emerald-400 font-bold uppercase tracking-wider">
                        Correct Answer
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-center text-gray-400 dark:text-gray-700 text-xs mt-8">
              This window updates automatically — students cannot see it
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
