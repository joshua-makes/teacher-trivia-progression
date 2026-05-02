/**
 * Persists user-configurable game settings to localStorage.
 * Settings are read once on page load and applied as defaults.
 */

export type GameSettings = {
  /** Default timer override per grade level (null = use grade default) */
  timerOverrides: Record<string, number | null>
  /** Points awarded per difficulty in team mode */
  teamPoints: { easy: number; medium: number; hard: number }
  /** Adaptive difficulty — adjust question difficulty based on performance */
  adaptiveDifficulty: boolean
  /** Deduct the question's point value from a team that answers incorrectly */
  wrongAnswerPenalty: boolean
}

const SETTINGS_KEY = 'trivia_settings'

export const DEFAULT_SETTINGS: GameSettings = {
  timerOverrides: { 'K-2': null, '3-5': null, '6-8': null, '9-12': null },
  teamPoints: { easy: 100, medium: 200, hard: 300 },
  adaptiveDifficulty: false,
  wrongAnswerPenalty: false,
}

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    return {
      timerOverrides: { ...DEFAULT_SETTINGS.timerOverrides, ...(parsed.timerOverrides ?? {}) },
      teamPoints: { ...DEFAULT_SETTINGS.teamPoints, ...(parsed.teamPoints ?? {}) },
      adaptiveDifficulty: parsed.adaptiveDifficulty ?? DEFAULT_SETTINGS.adaptiveDifficulty,
      wrongAnswerPenalty: parsed.wrongAnswerPenalty != null ? Boolean(parsed.wrongAnswerPenalty) : DEFAULT_SETTINGS.wrongAnswerPenalty,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function resetSettings(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SETTINGS_KEY)
}
