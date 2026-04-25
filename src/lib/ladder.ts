import type { Difficulty } from '@/lib/data/questions'

export type GradeLevel = 'K-2' | '3-5' | '6-8' | '9-12'

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

export function getSafeZonePoints(rung: number): number {
  const safeZones = LADDER.filter(r => r.isSafeZone && r.number < rung)
  if (safeZones.length === 0) return 0
  return safeZones[safeZones.length - 1].points
}

export function getRung(number: number): Rung | undefined {
  return LADDER[number - 1]
}

export function formatPoints(pts: number): string {
  return pts.toLocaleString()
}

export function getTimerSeconds(gradeLevel: GradeLevel): number {
  switch (gradeLevel) {
    case 'K-2':  return 45
    case '3-5':  return 35
    case '6-8':  return 25
    case '9-12': return 20
  }
}
