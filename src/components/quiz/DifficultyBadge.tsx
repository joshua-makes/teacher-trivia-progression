import type { Difficulty } from '@/lib/data/questions'
import { cn } from '@/lib/utils'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        difficulty === 'easy' &&
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        difficulty === 'medium' &&
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        difficulty === 'hard' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      )}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  )
}
