'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadSettings, saveSettings, resetSettings, DEFAULT_SETTINGS, type GameSettings } from '@/lib/settings'
import { GRADE_LEVELS, getTimerSeconds } from '@/lib/ladder'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  function handleSave() {
    saveSettings(settings)
    onClose()
  }

  function handleReset() {
    resetSettings()
    setSettings(DEFAULT_SETTINGS)
  }

  function setTimerOverride(grade: string, value: string) {
    const parsed = parseInt(value, 10)
    const next = isNaN(parsed) || parsed <= 0 ? null : parsed
    setSettings(s => ({
      ...s,
      timerOverrides: { ...s.timerOverrides, [grade]: next },
    }))
  }

  function setTeamPoints(diff: 'easy' | 'medium' | 'hard', value: string) {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0) return
    setSettings(s => ({
      ...s,
      teamPoints: { ...s.teamPoints, [diff]: parsed },
    }))
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto py-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Timer overrides */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            Default Timer (seconds)
          </h3>
          <div className="space-y-2">
            {GRADE_LEVELS.map(gl => {
              const override = settings.timerOverrides[gl.value]
              const placeholder = String(getTimerSeconds(gl.value))
              return (
                <div key={gl.value} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {gl.emoji} {gl.label}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    step={5}
                    placeholder={placeholder}
                    value={override ?? ''}
                    onChange={e => setTimerOverride(gl.value, e.target.value)}
                    className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Leave blank to use grade-level defaults.</p>
        </section>

        {/* Team point values */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            Team Mode Points per Question
          </h3>
          <div className="space-y-2">
            {(['easy', 'medium', 'hard'] as const).map(diff => {
              const colorClass = diff === 'easy'
                ? 'text-emerald-600 dark:text-emerald-400'
                : diff === 'medium'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
              return (
                <div key={diff} className="flex items-center justify-between gap-3">
                  <label className={`text-sm font-medium capitalize flex-1 ${colorClass}`}>
                    {diff}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    step={50}
                    value={settings.teamPoints[diff]}
                    onChange={e => setTeamPoints(diff, e.target.value)}
                    className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">Wrong answer penalty</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Deduct the question&apos;s point value on a wrong buzz-in</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.wrongAnswerPenalty}
              onClick={() => setSettings(s => ({ ...s, wrongAnswerPenalty: !s.wrongAnswerPenalty }))}
              className={`relative shrink-0 w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${settings.wrongAnswerPenalty ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.wrongAnswerPenalty ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        {/* Adaptive difficulty */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            Gameplay
          </h3>
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adaptive Difficulty</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Questions adjust harder/easier based on class performance</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.adaptiveDifficulty}
              onClick={() => setSettings(s => ({ ...s, adaptiveDifficulty: !s.adaptiveDifficulty }))}
              className={`relative shrink-0 w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${settings.adaptiveDifficulty ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.adaptiveDifficulty ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>
        </section>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
