import { describe, it, expect } from 'vitest'
import { nextDifficulty } from '@/lib/progression'

describe('nextDifficulty', () => {
  it('advances from easy to medium when score >= 80%', () => {
    expect(nextDifficulty('easy', 8, 10)).toBe('medium')
  })

  it('advances from medium to hard when score >= 80%', () => {
    expect(nextDifficulty('medium', 8, 10)).toBe('hard')
  })

  it('stays at hard when already at max difficulty', () => {
    expect(nextDifficulty('hard', 10, 10)).toBe('hard')
  })

  it('demotes from medium to easy when score < 40%', () => {
    expect(nextDifficulty('medium', 3, 10)).toBe('easy')
  })

  it('demotes from hard to medium when score < 40%', () => {
    expect(nextDifficulty('hard', 3, 10)).toBe('medium')
  })

  it('stays at easy when already at min difficulty', () => {
    expect(nextDifficulty('easy', 0, 10)).toBe('easy')
  })

  it('stays at same difficulty for mid-range score', () => {
    expect(nextDifficulty('medium', 5, 10)).toBe('medium')
  })

  it('handles zero total', () => {
    expect(nextDifficulty('easy', 0, 0)).toBe('easy')
  })
})
