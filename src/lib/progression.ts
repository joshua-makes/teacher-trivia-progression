import type { Difficulty } from '@/lib/data/questions'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

const ADVANCE_THRESHOLD = 0.8
const DEMOTE_THRESHOLD = 0.4

export function nextDifficulty(
  current: Difficulty,
  correct: number,
  total: number
): Difficulty {
  if (total === 0) return current
  const ratio = correct / total
  const currentIndex = DIFFICULTIES.indexOf(current)

  if (ratio >= ADVANCE_THRESHOLD && currentIndex < DIFFICULTIES.length - 1) {
    return DIFFICULTIES[currentIndex + 1]
  }
  if (ratio < DEMOTE_THRESHOLD && currentIndex > 0) {
    return DIFFICULTIES[currentIndex - 1]
  }
  return current
}
