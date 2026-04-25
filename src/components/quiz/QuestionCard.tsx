'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Difficulty } from '@/lib/data/questions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DifficultyBadge } from './DifficultyBadge'
import { AnswerButton } from './AnswerButton'
import { Timer } from './Timer'

type QuestionData = {
  question: string
  answers: string[]
  correctAnswer: string
  difficulty: Difficulty
  categoryName: string
}

type AnswerState = 'default' | 'correct' | 'incorrect' | 'missed'

export function QuestionCard({
  data,
  questionNumber,
  totalQuestions,
  onAnswer,
  timerSeconds = 30,
  locked = false,
  showTimer = true,
  revealAnswer = false,
  suppressFeedback = false,
}: {
  data: QuestionData
  questionNumber: number
  totalQuestions: number
  onAnswer: (correct: boolean, timeMs: number) => void
  timerSeconds?: number
  /** When true, answer buttons are visible but non-interactive (waiting for buzz-in) */
  locked?: boolean
  /** When false, the timer is hidden and never fires */
  showTimer?: boolean
  /** When true, highlights the correct answer without triggering onAnswer */
  revealAnswer?: boolean
  /** When true, calls onAnswer immediately with no visual feedback (for team mode) */
  suppressFeedback?: boolean
}) {
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({})
  const [isPaused, setIsPaused] = useState(false)
  const [remaining, setRemaining] = useState(timerSeconds)
  const [answered, setAnswered] = useState(false)
  const [startTime] = useState(Date.now())
  const TIMER_SECONDS = timerSeconds

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
    setIsPaused(false)
    setRemaining(timerSeconds)
  }, [data.question, timerSeconds])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Level {questionNumber} of {totalQuestions}
        </span>
        <DifficultyBadge difficulty={data.difficulty} />
      </div>
      <ProgressBar value={questionNumber - 1} max={totalQuestions} />
      <div className="flex items-center justify-between mt-4 mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{data.categoryName}</span>
        {showTimer && (
        <div className="flex items-center gap-2">
          <span
            role="timer"
            aria-label={`${remaining} seconds remaining`}
            className={`text-sm font-mono font-bold ${
              remaining <= 10 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {remaining}s
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(p => !p)}
            aria-pressed={isPaused}
            aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
            disabled={answered}
          >
            {isPaused ? '▶' : '⏸'}
          </Button>
        </div>
        )}
      </div>
      <p
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 leading-relaxed"
        aria-live="polite"
      >
        {data.question}
      </p>
      <div className="space-y-3">
        {data.answers.map((answer, idx) => {
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
