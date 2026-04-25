import type { Difficulty } from '@/lib/data/questions'

export type Answer = {
  questionId: string
  category: number
  difficulty: Difficulty
  correct: boolean
  timeMs: number
}

type Stats = {
  correct: number
  total: number
  accuracy: number
  totalTimeMs: number
  avgTimeMs: number
}

type ScoreResult = {
  correct: number
  total: number
  accuracy: number
  totalTimeMs: number
  avgTimeMs: number
  byCategory: Record<number, Stats>
  byDifficulty: Partial<Record<Difficulty, Stats>>
}

function makeStats(answers: Answer[]): Stats {
  const total = answers.length
  const correct = answers.filter(a => a.correct).length
  const totalTimeMs = answers.reduce((sum, a) => sum + a.timeMs, 0)
  return {
    correct,
    total,
    accuracy: total > 0 ? correct / total : 0,
    totalTimeMs,
    avgTimeMs: total > 0 ? totalTimeMs / total : 0,
  }
}

export function computeScore(answers: Answer[]): ScoreResult {
  const overall = makeStats(answers)

  const categoryMap = new Map<number, Answer[]>()
  const difficultyMap = new Map<Difficulty, Answer[]>()

  for (const answer of answers) {
    const catAnswers = categoryMap.get(answer.category) ?? []
    catAnswers.push(answer)
    categoryMap.set(answer.category, catAnswers)

    const diffAnswers = difficultyMap.get(answer.difficulty) ?? []
    diffAnswers.push(answer)
    difficultyMap.set(answer.difficulty, diffAnswers)
  }

  const byCategory: Record<number, Stats> = {}
  for (const [cat, ans] of categoryMap) {
    byCategory[cat] = makeStats(ans)
  }

  const byDifficulty: Partial<Record<Difficulty, Stats>> = {}
  for (const [diff, ans] of difficultyMap) {
    byDifficulty[diff] = makeStats(ans)
  }

  return {
    ...overall,
    byCategory,
    byDifficulty,
  }
}
