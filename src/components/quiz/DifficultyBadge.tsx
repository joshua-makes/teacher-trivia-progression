import type { Difficulty } from '@/lib/data/questions'
import { cn } from '@/lib/utils'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        difficulty === 'easy' &&
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
        difficulty === 'medium' &&
          'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        difficulty === 'hard' && 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
      )}
    >
      {difficulty === 'easy' ? '✦ Easy' : difficulty === 'medium' ? '◆ Medium' : '★ Hard'}
    </span>
  )
}
