import { cn } from '@/lib/utils'

type AnswerState = 'default' | 'correct' | 'incorrect' | 'missed'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export function AnswerButton({
  answer,
  state,
  disabled,
  onClick,
  index,
}: {
  answer: string
  state: AnswerState
  disabled: boolean
  onClick: () => void
  index?: number
}) {
  const letter = index !== undefined ? LETTERS[index] : undefined
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-4 py-4 rounded-xl border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center gap-3 active:scale-[0.98]',
        state === 'default' &&
          !disabled &&
          'border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-800 dark:text-gray-200',
        state === 'default' &&
          disabled &&
          'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed text-gray-600 dark:text-gray-400',
        state === 'correct' &&
          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
        state === 'incorrect' &&
          'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
        state === 'missed' &&
          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 opacity-75'
      )}
      aria-pressed={state !== 'default'}
    >
      {letter && (
        <span
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center',
            state === 'default' &&
              'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
            state === 'correct' &&
              'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200',
            state === 'incorrect' &&
              'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200',
            state === 'missed' &&
              'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200',
          )}
        >
          {letter}
        </span>
      )}
      <span>{answer}</span>
    </button>
  )
}
