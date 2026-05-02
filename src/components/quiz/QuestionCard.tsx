'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Difficulty } from '@/lib/data/questions'
import { Card } from '@/components/ui/Card'
import { DifficultyBadge } from './DifficultyBadge'
import { AnswerButton } from './AnswerButton'
import { Timer } from './Timer'

type QuestionData = {
  question: string
  answers: string[]
  correctAnswer: string
  difficulty: Difficulty
  categoryName: string
  imageUrl?: string
}

type AnswerState = 'default' | 'correct' | 'incorrect' | 'missed'

export function QuestionCard({
  data,
  questionNumber,
  totalQuestions,
  onAnswer,
  timerSeconds = 30,
  isPaused: externalIsPaused = false,
  locked = false,
  showTimer = true,
  revealAnswer = false,
  suppressFeedback = false,
  eliminatedAnswers = [] as string[],
}: {
  data: QuestionData
  questionNumber: number
  totalQuestions: number
  onAnswer: (correct: boolean, timeMs: number) => void
  timerSeconds?: number
  /** When true, pauses the countdown timer */
  isPaused?: boolean
  /** When true, answer buttons are visible but non-interactive (waiting for buzz-in) */
  locked?: boolean
  /** When false, the timer is hidden and never fires */
  showTimer?: boolean
  /** When true, highlights the correct answer without triggering onAnswer */
  revealAnswer?: boolean
  /** When true, calls onAnswer immediately with no visual feedback (for team mode) */
  suppressFeedback?: boolean
  /** Answers to hide (used by 50/50 lifeline) */
  eliminatedAnswers?: string[]
}) {
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({})
  const [remaining, setRemaining] = useState(timerSeconds)
  const [answered, setAnswered] = useState(false)
  const [startTime] = useState(Date.now())
  const TIMER_SECONDS = timerSeconds

  const isPaused = externalIsPaused

  const handleAnswer = useCallback(
    (answer: string | null, timedOut = false) => {
      if (answered) return
      setAnswered(true)
      const correct = !timedOut && answer === data.correctAnswer
      const timeMs = Date.now() - startTime
      // In team mode, skip visual feedback and fire immediately so the
      // correct answer is never exposed to stealing teams
      if (suppressFeedback) {
        onAnswer(correct, timeMs)
        return
      }
      const newStates: Record<string, AnswerState> = {}
      for (const a of data.answers) {
        if (a === data.correctAnswer) {
          newStates[a] = timedOut ? 'missed' : a === answer ? 'correct' : 'missed'
        } else if (a === answer) {
          newStates[a] = 'incorrect'
        } else {
          newStates[a] = 'default'
        }
      }
      setAnswerStates(newStates)
      setTimeout(() => onAnswer(correct, timeMs), 1200)
    },
    [answered, data.correctAnswer, data.answers, onAnswer, startTime, suppressFeedback]
  )

  useEffect(() => {
    setAnswerStates({})
    setAnswered(false)
    setRemaining(timerSeconds)
  }, [data.question, timerSeconds])

  return (
    <Card className="p-6 overflow-hidden">
      {/* Depleting timer bar — bleeds to card edges, color shifts as time runs low */}
      {showTimer && (
        <div className="-mx-6 -mt-6 mb-5 h-1.5 bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full transition-[width] duration-[950ms] ease-linear ${
              remaining / TIMER_SECONDS > 0.5
                ? 'bg-emerald-400 dark:bg-emerald-500'
                : remaining / TIMER_SECONDS > 0.25
                ? 'bg-amber-400 dark:bg-amber-500'
                : 'bg-red-500 dark:bg-red-600'
            }`}
            style={{ width: `${(remaining / TIMER_SECONDS) * 100}%` }}
          />
        </div>
      )}
      {/* Compact metadata row */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {data.categoryName} · Lvl {questionNumber}/{totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={data.difficulty} />
          {showTimer && (
            <>
              <span
                role="timer"
                aria-label={`${remaining} seconds remaining`}
                className={`text-sm font-mono font-bold tabular-nums ${
                  remaining <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {remaining}s
              </span>
            </>
          )}
        </div>
      </div>
      {data.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.imageUrl}
          alt="Question illustration"
          className="w-full max-h-52 object-contain rounded-lg mb-4 bg-gray-100 dark:bg-gray-800"
        />
      )}
      <p
        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-snug"
        aria-live="polite"
      >
        {data.question}
      </p>
      <div className="space-y-3">
        {data.answers.map((answer, idx) => {
          if (eliminatedAnswers.includes(answer)) return null
          let displayState: AnswerState = answerStates[answer] ?? 'default'
          if (revealAnswer && !answered) {
            displayState = answer === data.correctAnswer ? 'missed' : 'default'
          }
          return (
            <AnswerButton
              key={answer}
              answer={answer}
              state={displayState}
              disabled={answered || isPaused || locked || revealAnswer}
              onClick={() => handleAnswer(answer)}
              index={idx}
            />
          )
        })}
      </div>
      {isPaused && !answered && !locked && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          ⏸ Paused — click ▶ to resume
        </p>
      )}
      <Timer
        seconds={TIMER_SECONDS}
        isPaused={isPaused || answered || !showTimer}
        onTick={showTimer ? setRemaining : () => {}}
        onExpire={showTimer ? () => handleAnswer(null, true) : () => {}}
      />
      <span className="sr-only" aria-live="polite">
        {remaining <= 5 && !answered && !isPaused ? `${remaining} seconds left` : ''}
      </span>
    </Card>
  )
}
