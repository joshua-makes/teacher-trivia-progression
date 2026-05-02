import type { QuestionHistoryItem, Team } from '@/lib/session'
import { formatPoints } from '@/lib/ladder'

export type ExportPayload = {
  categoryName: string
  gradeLevel: string
  mode: 'solo' | 'team'
  completedAt: string
  /** Solo only */
  finalScore?: number
  levelsReached?: number
  totalLevels?: number
  /** Team only */
  teams?: Array<{ name: string; color: string; score: number }>
  /** Both modes */
  questions: Array<{
    number: number
    question: string
    correctAnswer: string
    answeredBy: string | null
    correct: boolean
    timeTakenMs?: number
  }>
}

export function buildExportPayload(
  history: QuestionHistoryItem[],
  opts: {
    categoryName: string
    gradeLevel: string
    mode: 'solo' | 'team'
    teams?: Team[]
    finalScore?: number
    levelsReached?: number
    totalLevels?: number
  },
): ExportPayload {
  return {
    categoryName: opts.categoryName,
    gradeLevel: opts.gradeLevel,
    mode: opts.mode,
    completedAt: new Date().toISOString(),
    ...(opts.finalScore !== undefined ? { finalScore: opts.finalScore } : {}),
    ...(opts.levelsReached !== undefined ? { levelsReached: opts.levelsReached } : {}),
    ...(opts.totalLevels !== undefined ? { totalLevels: opts.totalLevels } : {}),
    ...(opts.teams ? { teams: opts.teams.map(t => ({ name: t.name, color: t.color, score: t.score })) } : {}),
    questions: history.map(h => ({
      number: h.questionNumber,
      question: h.questionText,
      correctAnswer: h.correctAnswer,
      answeredBy: h.answeredBy,
      correct: h.correct,
      ...(h.timeTakenMs !== undefined ? { timeTakenMs: h.timeTakenMs } : {}),
    })),
  }
}

export function exportResultsAsJSON(payload: ExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const slug = payload.categoryName.replace(/\s+/g, '-').toLowerCase()
  a.download = `ladder-quiz-${slug}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportResultsAsCSV(payload: ExportPayload): void {
  const rows: string[] = []

  // Header metadata
  rows.push(`Category,${csvCell(payload.categoryName)}`)
  rows.push(`Grade,${csvCell(payload.gradeLevel)}`)
  rows.push(`Mode,${csvCell(payload.mode)}`)
  rows.push(`Date,${csvCell(new Date(payload.completedAt).toLocaleDateString())}`)
  if (payload.finalScore !== undefined) {
    rows.push(`Final Score,${formatPoints(payload.finalScore)}`)
  }
  if (payload.levelsReached !== undefined && payload.totalLevels !== undefined) {
    rows.push(`Levels Reached,${payload.levelsReached} / ${payload.totalLevels}`)
  }
  if (payload.teams && payload.teams.length > 0) {
    rows.push('')
    rows.push('Team Scores')
    rows.push('Team,Score')
    for (const t of [...payload.teams].sort((a, b) => b.score - a.score)) {
      rows.push(`${csvCell(t.name)},${t.score}`)
    }
  }

  // Question history
  if (payload.questions.length > 0) {
    rows.push('')
    rows.push('Question History')
    const hasTiming = payload.questions.some(q => q.timeTakenMs !== undefined)
    rows.push(['#', 'Question', 'Correct Answer', 'Answered By', 'Result', ...(hasTiming ? ['Time (s)'] : [])].map(csvCell).join(','))
    for (const q of payload.questions) {
      const timeSec = q.timeTakenMs !== undefined ? (q.timeTakenMs / 1000).toFixed(1) : ''
      rows.push([
        String(q.number),
        q.question,
        q.correctAnswer,
        q.answeredBy ?? '',
        q.correct ? 'Correct' : 'Incorrect',
        ...(hasTiming ? [timeSec] : []),
      ].map(csvCell).join(','))
    }
  }

  const blob = new Blob([rows.join('\r\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const slug = payload.categoryName.replace(/\s+/g, '-').toLowerCase()
  a.download = `ladder-quiz-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}
