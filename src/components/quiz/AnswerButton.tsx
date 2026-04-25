import { cn } from '@/lib/utils'

type AnswerState = 'default' | 'correct' | 'incorrect' | 'missed'

export function AnswerButton({
  answer,
  state,
  disabled,
  onClick,
}: {
  answer: string
  state: AnswerState
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
        state === 'default' &&
          !disabled &&
          'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
        state === 'default' &&
          disabled &&
          'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed',
        state === 'correct' &&
          'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
        state === 'incorrect' &&
          'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
        state === 'missed' &&
          'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 opacity-70'
      )}
      aria-pressed={state !== 'default'}
    >
      {answer}
    </button>
  )
}
