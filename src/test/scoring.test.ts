import { describe, it, expect } from 'vitest'
import { computeScore } from '@/lib/scoring'
import type { Answer } from '@/lib/scoring'

const makeAnswer = (
  overrides: Partial<Answer> = {}
): Answer => ({
  questionId: 'q1',
  category: 9,
  difficulty: 'easy',
  correct: true,
  timeMs: 5000,
  ...overrides,
})

describe('computeScore', () => {
  it('returns zero stats for empty answers', () => {
    const score = computeScore([])
    expect(score.total).toBe(0)
    expect(score.correct).toBe(0)
    expect(score.accuracy).toBe(0)
    expect(score.totalTimeMs).toBe(0)
    expect(score.avgTimeMs).toBe(0)
  })

  it('calculates overall accuracy', () => {
    const answers = [
      makeAnswer({ correct: true }),
      makeAnswer({ correct: true }),
      makeAnswer({ correct: false }),
      makeAnswer({ correct: false }),
    ]
    const score = computeScore(answers)
    expect(score.accuracy).toBe(0.5)
    expect(score.correct).toBe(2)
    expect(score.total).toBe(4)
  })

  it('groups by category', () => {
    const answers = [
      makeAnswer({ category: 9, correct: true }),
      makeAnswer({ category: 9, correct: false }),
      makeAnswer({ category: 17, correct: true }),
    ]
    const score = computeScore(answers)
    expect(score.byCategory[9].total).toBe(2)
    expect(score.byCategory[9].correct).toBe(1)
    expect(score.byCategory[17].total).toBe(1)
    expect(score.byCategory[17].correct).toBe(1)
  })

  it('groups by difficulty', () => {
    const answers = [
      makeAnswer({ difficulty: 'easy', correct: true }),
      makeAnswer({ difficulty: 'hard', correct: false }),
    ]
    const score = computeScore(answers)
    expect(score.byDifficulty.easy?.total).toBe(1)
    expect(score.byDifficulty.hard?.total).toBe(1)
  })

  it('calculates total and average time', () => {
    const answers = [
      makeAnswer({ timeMs: 3000 }),
      makeAnswer({ timeMs: 7000 }),
    ]
    const score = computeScore(answers)
    expect(score.totalTimeMs).toBe(10000)
    expect(score.avgTimeMs).toBe(5000)
  })
})
