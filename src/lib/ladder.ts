import type { Difficulty } from '@/lib/data/questions'
import type { GradeLevel } from '@/lib/data/grades'
export type { GradeLevel }

export const GRADE_LEVELS: { value: GradeLevel; label: string; emoji: string }[] = [
  { value: 'K-2',  label: 'K–2nd Grade',   emoji: '🌱' },
  { value: '3-5',  label: '3rd–5th Grade',  emoji: '📖' },
  { value: '6-8',  label: '6th–8th Grade',  emoji: '🔬' },
  { value: '9-12', label: '9th–12th Grade', emoji: '🎓' },
]

export type Rung = {
  number: number
  points: number
  difficulty: Difficulty
  isSafeZone: boolean
  label: string
}

export const LADDER: Rung[] = [
  { number: 1,  points: 100,       difficulty: 'easy',   isSafeZone: false, label: '100' },
  { number: 2,  points: 200,       difficulty: 'easy',   isSafeZone: false, label: '200' },
  { number: 3,  points: 300,       difficulty: 'easy',   isSafeZone: false, label: '300' },
  { number: 4,  points: 500,       difficulty: 'easy',   isSafeZone: false, label: '500' },
  { number: 5,  points: 1_000,     difficulty: 'easy',   isSafeZone: true,  label: '1,000' },
  { number: 6,  points: 2_000,     difficulty: 'medium', isSafeZone: false, label: '2,000' },
  { number: 7,  points: 4_000,     difficulty: 'medium', isSafeZone: false, label: '4,000' },
  { number: 8,  points: 8_000,     difficulty: 'medium', isSafeZone: false, label: '8,000' },
  { number: 9,  points: 16_000,    difficulty: 'medium', isSafeZone: false, label: '16,000' },
  { number: 10, points: 32_000,    difficulty: 'medium', isSafeZone: true,  label: '32,000' },
  { number: 11, points: 64_000,    difficulty: 'hard',   isSafeZone: false, label: '64,000' },
  { number: 12, points: 125_000,   difficulty: 'hard',   isSafeZone: false, label: '125,000' },
  { number: 13, points: 250_000,   difficulty: 'hard',   isSafeZone: false, label: '250,000' },
  { number: 14, points: 500_000,   difficulty: 'hard',   isSafeZone: false, label: '500,000' },
  { number: 15, points: 1_000_000, difficulty: 'hard',   isSafeZone: false, label: '1,000,000' },
]

export function getSafeZonePoints(rung: number, ladder: Rung[] = LADDER): number {
  const safeZones = ladder.filter(r => r.isSafeZone && r.number < rung)
  if (safeZones.length === 0) return 0
  return safeZones[safeZones.length - 1].points
}

export function getRung(number: number): Rung | undefined {
  return LADDER[number - 1]
}

export function formatPoints(pts: number): string {
  return pts.toLocaleString()
}

/** Rounds a raw point value to a clean display number */
function snapPoints(n: number): number {
  if (n >= 500_000) return Math.round(n / 50_000) * 50_000
  if (n >= 100_000) return Math.round(n / 10_000) * 10_000
  if (n >= 10_000)  return Math.round(n / 1_000) * 1_000
  if (n >= 1_000)   return Math.round(n / 500) * 500
  return Math.max(100, Math.round(n / 100) * 100)
}

/**
 * Generates a scaled ladder of `n` rungs.
 * - Easy: first third, Medium: second third, Hard: final third
 * - Safe zones at the end of each of the first two thirds
 * - Points scale geometrically from 100 to 1,000,000
 */
export function buildLadder(n: number): Rung[] {
  if (n <= 0) return []
  const e = Math.max(1, Math.floor(n / 3))           // last easy rung index
  const m = Math.max(e + 1, Math.floor(2 * n / 3))  // last medium rung index
  return Array.from({ length: n }, (_, i) => {
    const rungNum = i + 1
    const diff: Difficulty = rungNum <= e ? 'easy' : rungNum <= m ? 'medium' : 'hard'
    const isSafeZone = rungNum === e || rungNum === m
    const raw = n === 1 ? 1_000_000 : 100 * Math.pow(10_000, i / (n - 1))
    const pts = rungNum === n ? 1_000_000 : snapPoints(raw)
    return { number: rungNum, points: pts, difficulty: diff, isSafeZone, label: formatPoints(pts) }
  })
}

export function getTimerSeconds(gradeLevel: GradeLevel): number {
  switch (gradeLevel) {
    case 'K-2':  return 45
    case '3-5':  return 35
    case '6-8':  return 25
    case '9-12': return 20
  }
}
